const tf = require('@tensorflow/tfjs')
const { customSTFT, customISTFT } = require('./utils')

let fb_model = null,
    sb_model = null,
    fb_num_neighbors = null,
    sb_num_neighbors = null,
    look_ahead = null,
    n_fft = null,
    hop_length = null,
    win_length = null;

async function setInitial(){
    fb_model = await tf.loadLayersModel('FullSubNet/fb_model/model.json')
    sb_model = await tf.loadLayersModel('FullSubNet/sb_model/model.json')

    // Basic Setting
    fb_num_neighbors = 0
    sb_num_neighbors = 15
    look_ahead = 2
    n_fft = 512
    hop_length = 256
    win_length = 512
}

async function unfold(input, num_neighbor){
    // assume input -> 4dim
    var batch = input.shape[0]
    var channel = input.shape[1]
    var freq = input.shape[2]
    var frame = input.shape[3]

    if (num_neighbor < 1){
        input = tf.reshape(tf.transpose(input, [0, 2, 1, 3]), [batch, freq, channel, 1, frame])
        return input
    }

    var output = input.reshape([batch*channel, 1, freq, frame])
    var sub_band_unit_size = num_neighbor*2+1

    //pad
    output = tf.mirrorPad(output, [[0, 0], [0, 0], [num_neighbor, num_neighbor], [0, 0]], 'reflect')
    output = tf.transpose(output, [0, 2, 3, 1])
    
    // output = tf.image.extract_patches(output, sizes=[1, 257, 1, 1], strides=[1,1,1,1], rates=[1,1,1,1], padding='VALID')
    output = extract_patches(output, 257, [1,1,1,1])
    output = tf.reshape(output, [batch, sub_band_unit_size*frame, freq])
    output = tf.reshape(output, [batch, channel, sub_band_unit_size, frame, freq])
    output = tf.transpose(output, [0, 4, 1, 2, 3])

    return output
}

function mag(noisy_complex){
    return tf.abs(noisy_complex)
}

function decompress_cIRM(mask, K=10, limit=9.9){
    // mask.print();
  //boolean to number
    let temp_greater = tf.cast(mask.greaterEqual(limit), "float32");
    let temp_less = tf.cast(mask.lessEqual(limit), "float32");
    let new_mask = tf.cast(tf.abs(mask).less(limit), "float32");

  //calc
    temp_greater = temp_greater.mul(limit);
    temp_less = temp_less.mul(limit);
    new_mask = new_mask.mul(mask);
    let output = temp_greater.sub(temp_less).add(new_mask);

  //reference : -K * tf.log((K - temp) / (K + temp));
    let inverse_mask = output.mul(-1);
    output = tf.log(inverse_mask.add(K).div(output.add(K))).mul(-K);
    return output;
    }

function sepComplex(complexTensor) {
    // Exist Error that recover the deleted dims in real, imag function... set temporary squeeze function
    let real_temp = tf.real(complexTensor).squeeze();
    let imag_temp = tf.imag(complexTensor).squeeze();

    return [real_temp, imag_temp];
}

// Normalization 
function norm(input){
    var mu = input.mean([1, 2, 3], true);
    var normed = input.div(mu.add(1e-5));
    return normed;
}

async function enhancement(noisy_mag) {
    noisy_mag = noisy_mag.pad([
        [0, 0],
        [0, 0],
        [0, 0],
        [0, look_ahead]
    ]);

    const batch = noisy_mag.shape[0],
        channel = noisy_mag.shape[1],
        freq = noisy_mag.shape[2],
        frame = noisy_mag.shape[3];

    // Full Band
    let fb_input = await norm(noisy_mag);
    fb_input = fb_input.reshape([batch, channel * freq, frame]);
    fb_input = tf.transpose(fb_input, [0, 2, 1]);

    let fb_output = (await fb_model).predict(fb_input);
    fb_output = tf.transpose(fb_output, [0, 2, 1]);
    fb_output = tf.reshape(fb_output, [batch, 1, freq, frame]);

    let fb_output_unfolded = await unfold(fb_output, fb_num_neighbors);
    fb_output_unfolded = tf.reshape(fb_output_unfolded, [
        batch,
        freq,
        fb_num_neighbors * 2 + 1,
        frame
    ]);

    // Sub Band
    let noisy_mag_unfolded = await unfold(noisy_mag, sb_num_neighbors);
    noisy_mag_unfolded = tf.reshape(noisy_mag_unfolded, [
        batch,
        freq,
        sb_num_neighbors * 2 + 1,
        frame
    ]);

    let sb_input = tf.concat([noisy_mag_unfolded, fb_output_unfolded], 2);
    sb_input = await norm(sb_input);
    sb_input = sb_input.reshape([
        batch * freq,
        sb_num_neighbors * 2 + 1 + (fb_num_neighbors * 2 + 1),
        frame
    ]);
    sb_input = tf.transpose(sb_input, [0, 2, 1]);

    let sb_mask = (await sb_model).predict(sb_input);
    sb_mask = tf.transpose(sb_mask, [0, 2, 1]);
    sb_mask = tf.reshape(sb_mask, [batch, freq, 2, frame]);
    sb_mask = tf.transpose(sb_mask, [0, 2, 1, 3]);

    const shape_q = sb_mask.shape[0],
        shape_w = sb_mask.shape[1],
        shape_e = sb_mask.shape[2],
        shape_r = sb_mask.shape[3];

    let output = sb_mask.slice(
        [0, 0, 0, 2],
        [shape_q, shape_w, shape_e, shape_r - 2]
    );
    return output;
}

async function extract_patches(input, ksize, stride){
    // eg. input = [1, 287, 193, 1]
    /*
    Goal
    eg. [1, 31, 193, 257]
    ... no padding algorithm
     */

    /*
        params
        input : padded stft result [batch, in_rows, in_cols, depth] ex. Tensor(1, 1, 287, 193)
        ksize : kernel size [1, size_rows, size_cols, 1]
        stride : movement [1, stride_rows, stride_cols, 1]
        rate : input stride, specifying how far two consecutive patch samples are in the input
        padding : type of padding algorithm to use

        patch_sizes_eff : patch_sizes + (patch_sizes - 1)*(rates - 1)

        input : (1, 287, 193, 1) padded / 4Dims
        output : (1, 31, 193, 257) need to match freq to 257 / 4Dims
    */

    //stridesSlice
    const num_freq_padded = input.shape[1]; // 287
    const num_frame = input.shape[2]; // 193

    const stride_row = stride[1]; // 1
    const stride_col = stride[2]; // 1

    let concat = null;
    for (var i = 0; i <= num_freq_padded - ksize; i += stride_col) {
        let temp = input.stridedSlice(
            [0, i, 0, 0],
            [stride_row, ksize + i, num_frame, stride_col],
            stride
        );
        temp = temp.transpose([0, 2, 3, 1]);
        temp = temp.reshape([stride_row, stride_col, num_frame, ksize]);

        //Concatenate
        if (concat == null) {
            concat = temp;
        } else {
            concat = tf.concat([concat, temp], 1);
        }
    }
    //Return
    return concat
}

function convert_cIRM(noisy_complex_real, noisy_complex_imag, pred_crm) {
    let freq_temp = pred_crm.shape[1];
    let frame_temp = pred_crm.shape[2];

    let complex_real = noisy_complex_real.reshape([1, freq_temp, frame_temp, 1]);
    let complex_imag = noisy_complex_imag.reshape([1, freq_temp, frame_temp, 1]);

    let pred_crm_real = pred_crm.slice(
        [0, 0, 0, 0],
        [1, freq_temp, frame_temp, 1]
    );
    let pred_crm_imag = pred_crm.slice(
        [0, 0, 0, 1],
        [1, freq_temp, frame_temp, 1]
    );

    let predict_real = pred_crm_real
        .mul(complex_real)
        .sub(pred_crm_imag.mul(complex_imag));
    let predict_imag = pred_crm_imag
        .mul(complex_real)
        .add(pred_crm_real.mul(complex_imag));

    let predict_complex = tf.complex(predict_real, predict_imag);
    predict_complex = predict_complex.squeeze();

    return predict_complex;
}

// Inferece Function
async function inference(input){

    let noisy = tf.tensor(input);
    await setInitial();
    // Add STFT
    // let noisy_complex = await stft(noisy, n_fft, hop_length, win_length)
    let noisy_complex = await customSTFT(noisy, n_fft, hop_length, win_length); // e.g. [freqs : 257, frames : 193]
    let noisy_mag = mag(noisy_complex);

    noisy_mag = noisy_mag.expandDims(0); // add virtual batch
    noisy_mag = noisy_mag.expandDims(0); // add virtual channel
    let pred_crm = await enhancement(noisy_mag);

    pred_crm = pred_crm.transpose([0, 2, 3, 1]);
    pred_crm = await decompress_cIRM(pred_crm);

    let noisy_complex_real, noisy_complex_imag;
    [noisy_complex_real, noisy_complex_imag] = await sepComplex(noisy_complex);

    let enhanced_noisy = await convert_cIRM(
        noisy_complex_real,
        noisy_complex_imag,
        pred_crm
    );
    //Set transpose
    let enhanced_noisy_transpose = await complexTranspose(enhanced_noisy);

    // Add Inverse STFT
    let enhanced_output = await customISTFT(
        enhanced_noisy_transpose,
        n_fft,
        hop_length,
        win_length
    );
    return enhanced_output;
}

// For testing
// module.exports = {
//     inference: (context) => {
//         console.log(context)
//     }
// }

function convertTensor(input){
    let output = tf.tensor(input);
    return output
}

module.exports = {
    convertTensor,
    inference,
}
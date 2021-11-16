const fb_model = null,
    sb_model = null,
    fb_num_neighbors = null,
    sb_num_neighbors = null,
    look_ahead = null,
    n_fft = null,
    hop_length = null,
    win_length = null;

async function setInitial(){
    fb_model = await tf.loadLayersModel('./fb_model/model.json')
    sb_model = await tf.loadLayersModel('./sb_model/model.json')

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

    var ouptut = tf.reshape(input, [batch*channel, 1, freq, frame])
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

async function mag(noisy_complex){
    return tf.abs(noisy_complex)
}

async function decompress_cIRM(mask, K=10, limit=9.9){
    mask = tf.cast(mask >= limit, "float32") - limit*tf.cast(mask <= limit, "tf.float32") + mask*tf.cast(tf.abs(mask) < limit, "float32")
    mask = -K * tf.log((K-mask)/(K+mask))

    return mask
}

async function sepComplex(noisy_complex){
    var real = tf.real(noisy_complex)
    var imag = tf.imag(noisy_complex)

    return [real, imag]
}

// Normalization 
async function norm(input){
    var mu = tf.mean(input, [1, 2, 3], true)
    var normed = input/(mu+1e-5)

    return normed
}

async function enhancement(noisy_mag){
    noisy_mag = tf.pad(noisy_mag, [[0,0], [0,0], [0,0], [0, look_ahead]])
    
    var batch = noisy_mag.shape[0]
    var channel = noisy_mag.shape[1]
    var freq = noisy_mag.shape[2]
    var frame = noisy_mag.shape[3]

    // Full Band
    var fb_input = norm(noisy_mag)
    fb_input = tf.reshape(fb_input, [batch, channel*freq, frame])
    fb_input = tf.transpose(fb_input, [0, 2, 1])

    var fb_output = fb_model.predict(fb_input)
    fb_output = tf.transpose(fb_output, [0, 2, 1])
    fb_output = tf.reshape(fb_output, [batch, 1, freq, frame])

    var fb_output_unfolded = unfold(fb_output, fb_num_neighbors)
    fb_output_unfolded = tf.reshape(fb_output_unfolded, [batch, freq, fb_num_neighbors*2+1, frame])

    // Sub Band
    var noisy_mag_unfolded = unfold(noisy_mag, sb_num_neighbors)
    noisy_mag_unfolded = tf.reshape(noisy_mag_unfolded, [batch, frqe, sb_num_neighbors*2+1, frame])

    var sb_input = tf.concat([noisy_mag_unfolded, fb_output_unfolded], 2)
    sb_input = norm(sb_input)
    sb_input = tf.transpose(sb_input, [0, 2, 1])

    var sb_mask = sb_model.predict(sb_input)
    sb_mask = tf.transpose(sb_mask, [0, 2, 1])
    sb_mask = tf.reshape(sb_mask, [batch, freq, 2, frame])
    sb_mask = tf.transpose(sb_mask, [0, 2, 1, 3])

    var output = sb_mask.slice([0, 0, 0, 2], sb_mask.shape)
    return output
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
        let temp = x.stridedSlice(
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

async function depress_cIRM(noisy_complex_real, noisy_complex_imag, pred_crm){
    var freq_temp = pred_crm.shape[1]
    var frame_temp = pred_crm.shape[2]

    var pred_crm_real = pred_crm.slice([0,0,0,0], [1, freq_temp, frame_temp, 1])
    var pred_crm_imag = pred_crm.slice([0,0,0,1], [1, freq_temp, frame_temp, 1])

    var enhanced_real = pred_crm_real*noisy_complex_real - pred_crm_imag*noisy_complex_imag
    var enhanced_imag = pred_crm_imag*noisy_complex_real + pred_crm_real*noisy_complex_imag

    var enhanced_complex = tf.complex(enhanced_real, enhanced_imag)
    var enhanced = enhanced_complex.squeeze(0)

    return enhanced
}

// Inferece Function
async function inference(noisy){
    await tf.setBackend('cpu');
    setInitial()

    // Add STFT
    // var noisy_complex = await stft(noisy, n_fft, hop_length, win_length)
    var noisy_complex = await customSTFT(noisy) // e.g. [freqs : 257, frames : 193]
    var noisy_mag = mag(noisy_complex)
    noisy_mag = tf.expandDims(0) // add virtual batch
    noisy_mag = tf.expandDims(0) // add virtual channel

    var pred_crm = enhancement(noisy_mag)
    pred_crm = pred_crm.transpose([0, 2, 3, 1])
    pred_crm = decompress_cIRM(pred_crm)
    var [noisy_complex_real, noisy_complex_imag] = sepComplex(pred_crm)

    var enhanced = depress_cIRM(noisy_complex_real, noisy_complex_imag, pred_crm)

    // Add Inverse STFT
    enhanced = await customISTFT(enhanced)
    return enhanced
}

// Temporary - tfjs is not exist istft
function stft(input, n_fft, hop_length, win_length){
    let x = tf.signal.stft(
        input,
        n_fft,
        hop_length,
        win_length,
        tf.signal.hannWindow
    );
    return x;
}

// custom STFT function
async function customSTFT(input, n_fft, hop_length, win_length){
    // assume window is hann
    let window = tf.signal.hannWindow(win_length) // shape : 512
    window = window.reshape([1, win_length])
    /*
        params
        input : e.g Tensor[49601] about 3s audio
        n_fft : fft length
        hop_length : length of overlap
        win_length : window length 

        Generally n_fft equals win_length(my experience)

        output : [257, 193] contain reflect padding
    */
    let length = input.shape[0]
    let concat = null

    for (var i = 0; i < length; i += hop_length) {
        if (i + hop_length > length){
            break;
        }

        let temp = x.slice([i], [n_fft]);
        temp = window.mul(temp); // window * frame
        // temp.print();
        temp = temp.reshape([1, temp.shape[0]]);
        temp = temp.mul(window); //element-wise multiply
        
        let temp_rfft = temp.rfft(); // none axis parameter
        // console.log(temp_rfft.shape); // for debugging
        // temp_rfft.print(); //for debugging
        if (concat == null) {
            concat = temp_rfft;
        } else {
            concat = tf.concat([concat, temp_rfft], 0);
        }
    }

    concat = concat.transpose([1, 0]) // [num_freqs, num_frames]
    return concat
}

function setWindowPow(window){
    // some code...
    let window_pow = window.pow(2)

    //1. create empty Tensor

    //2. add to overlapping


    return window
}

async function customISTFT(input, n_fft, hop_length, win_length){
    let window = tf.signal.hannWindow(512) // [512]
    window = window.reshape([1, win_length]) // [1, 512]

    //Need to pow window
    let window_pow = setWindowPow(window)

    // irfft

    // divided by window_pow

    // add to overlapping
}

// For testing
module.exports = {
    inference: (context) => {
        console.log(context)
    }
}

// class testProcessor extends AudioWorkletProcessor {
//     constructor () {
//         super()
//         // current sample-frame and time at the moment of instantiation
//         // to see values change, you can put these two lines in process method
//         console.log(currentFrame)
//         console.log(currentTime)
//       }
//     // the process method is required - output silence,
//     // which the outputs are already filled with
//     process (inputs, outputs, parameters) {
//         console.log('test');
//         // return true
//     }
// }
// registerProcessor('processor', testProcessor)
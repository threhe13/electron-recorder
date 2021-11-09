const { permute } = require('@tensorflow/tfjs-layers/dist/exports_layers')
const tf = require('@tensorflow/tfjs-node')

const fb_model = null,
    sb_model = null,
    fb_num_neighbors = null,
    sb_num_neighbors = null,
    look_ahead = null;

async function setInitial(){
    fb_model = tf.loadLayersModel('./FullSubNet/fb_model/model.json')
    sb_model = tf.loadLayersModel('./FullSubNet/sb_model/model.json')

    // Basic Setting
    fb_num_neighbors = 0
    sb_num_neighbors = 15
    look_ahead = 2
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
    const num_freq_padded = input.shape[1]
    const num_frame = input.shape[2]

    const stride_row = stride.shape[1]
    const stride_col = stride.shape[2]

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
    setInitial()

    // Add STFT
    

    var noisy_mag = mag(noisy)
    noisy_mag = tf.expandDims(0) // add virtual batch
    noisy_mag = tf.expandDims(0) // add virtual channel

    var pred_crm = enhancement(noisy_mag)
    pred_crm = pred_crm.transpose([0, 2, 3, 1])
    pred_crm = decompress_cIRM(pred_crm)
    var [noisy_complex_real, noisy_complex_imag] = sepComplex(pred_crm)

    var enhanced = depress_cIRM(noisy_complex_real, noisy_complex_imag, pred_crm)
    // Add Inverse STFT


    return enhanced
}

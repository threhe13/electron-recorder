const { permute } = require('@tensorflow/tfjs-layers/dist/exports_layers')
const tf = require('@tensorflow/tfjs-node')

const fb_model = tf.loadLayersModel('./FullSubNet/fb_model/model.json')
const sb_model = tf.loadLayersModel('./FullSubNet/sb_model/model.json')

// Basic Setting
const fb_num_neighbors = 0
const sb_num_neighbors = 15
const look_ahead = 2

function unfold(input, num_neighbor){
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
    
    // how to create tf.image.extract_patches function...
    // output = tf.image.extract_patches(output, sizes=[1, 257, 1, 1], strides=[1,1,1,1], rates=[1,1,1,1], padding='VALID')
}

// Normalization 
function norm(input){
    var mu = tf.mean(input, axis=[1, 2, 3], keepdims=true)
    var normed = input/(mu+1e-5)

    return normed
}

function enhancement(noisy_mag){
    noisy_mag = tf.pad(noisy_mag, [[0,0], [0,0], [0,0], [0, look_ahead]])
    
    var batch = noisy_mag.shape[0]
    var channel = noisy_mag.shape[1]
    var freq = noisy_mag.shape[2]
    var frame = noisy_mag.shape[3]

    // Full Band
    var fb_input = norm(noisy_mag)
    fb_input = tf.reshape(fb_input, [batch, channel*freq, frame])
    fb_input = tf.transpose(fb_input, [0, 2, 1])

    var fb_output = fb_model(fb_input)
    fb_output = tf.transpose(fb_output, [0, 2, 1])
    fb_output = tf.reshape(fb_output, [batch, 1, freq, frame])

    var fb_output_unfolded = unfold(fb_output, fb_num_neighbors)
    fb_output_unfolded = tf.reshape(fb_output_unfolded, [batch, freq, fb_num_neighbors*2+1, frame])

    // Sub Band
    var noisy_mag_unfolded = unfold(noisy_mag, sb_num_neighbors)
    noisy_mag_unfolded = tf.reshape(noisy_mag_unfolded, [batch, frqe, sb_num_neighbors*2+1, frame])

    var sb_input = tf.concat([noisy_mag_unfolded, fb_output_unfolded], axis=2)
    sb_input = norm(sb_input)
    sb_input = tf.transpose(sb_input, [0, 2, 1])

    var sb_mask = sb_model(sb_input)
    sb_mask = tf.transpose(sb_mask, [0, 2, 1])
    sb_mask = tf.reshape(sb_mask, [batch, freq, 2, frame])
    sb_mask = tf.transpose(sb_mask, [0, 2, 1, 3])

    //how to set output...
    // var output
}

function inference(noisy){

}

function extract_patches(input, ksize, stride, rate, padding){
    const x = input

    /*
        params
        input : padded stft result [batch, in_rows, in_cols, depth] ex. Tensor(1, 1, 287, 193)
        ksize : kernel size [1, size_rows, size_cols, 1]
        stride : movement [1, stride_rows, stride_cols, 1]
        rate : input stride, specifying how far two consecutive patch samples are in the input
        padding : type of padding algorithm to use

        patch_sizes_eff : patch_sizes + (patch_sizes - 1)*(rates - 1)

        input : (1, 1, 287, 193) padded / 4Dims
        output : (1, 31, 257, 193) need to match freq to 257 / 4Dims
    */
    

}
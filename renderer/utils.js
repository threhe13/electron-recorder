const tf = require('@tensorflow/tfjs')

// Convert Float32Array to Uint8Array
function convert_uint8(f32a){
    var output = new Uint8Array(f32a.length);

    for (var i = 0; i < f32a.length; i++) {
    var tmp = Math.max(-1, Math.min(1, f32a[i]));
        tmp = tmp < 0 ? (tmp * 0x8000) : (tmp * 0x7FFF);
        tmp = tmp / 256;
        output[i] = tmp + 128;
    }

    return output;
}

// Modern Method -> Convert url object to ArrayBuffer
async function recover(url){
    /*
        param
        url : URL of blob created by URL.createObjectURL();
        .. e.g. const media = document.getElementById('media').innerText .then media == url

        return : Float32Array (for using Tensor)
    */

    let blob = await fetch(url).then(r => r.blob()); // Blob .. important using await

    // Convert blob to ArrayBuffer
    // let fileReader = new FileReader(),
    //     array;

    // fileReader.onload = function(e){
    //     array = this.result;
    //     console.log("ArrayBuffer contains", array.byteLength, "bytes.");
    // }
    // fileReader.readAsArrayBuffer(blob)
    // Upper function is same to below line
    let arrayBuffer = blob.arrayBuffer(); 

    // But it's type is Int8Array... we need to Float32Array
    return arrayBuffer
}

function sepComplex(noisy_complex) {
    var _real = tf.real(noisy_complex);
    var _imag = tf.imag(noisy_complex);

    return [_real, _imag];
}

// custom STFT function  - complete
async function customSTFT(input, n_fft, hop_length, win_length){
    /*
        params
        input : e.g Tensor[49601] about 3s audio
        n_fft : fft length
        hop_length : length of overlap
        win_length : window length 

        Generally n_fft equals win_length(my experience)

        output : [257, 193] contain reflect padding
    */
    let window = tf.signal.hannWindow(win_length); // 512

    let temp_frame = tf.signal.frame(input, n_fft, hop_length);
    
    let rfft_input = tf.mul(temp_frame, window);
    let temp_rfft = tf.spectral.rfft(rfft_input, n_fft);
    
    return temp_rfft;
}

//  - complete
function setWindowPow(window_function) {
    let window_pow = window_function.square(); // pow of window function
    //1. concat window
    let window_pow_temp = window_pow.concat(window_pow);
    //2. zero padding at window
    let zeros_temp = tf.zeros([256]);
    let window_padding_temp = zeros_temp.concat(window_pow.concat(zeros_temp));

    let output_window_pow = window_pow_temp.add(window_padding_temp);
    let output = output_window_pow.slice(256, 512); //slice to 512 tensor from 256 index
    return output;
}

// - complete
async function customISTFT(input, n_fft, hop_length, win_length) {
    /*
        params
        input : e.g [192, 257] means frames, frequencythat is dtype complex tensor
        n_fft : fft length
        hop_length : length of overlap
        win_length : window length 

        Generally n_fft equals win_length(my experience)

        output : [49601] time domain signal that is dtype float32 tensor
    */
    // @pararm input : [num_freqs, num_frames], complex matrix
    let window_function = tf.signal.hannWindow(win_length); // [512]
    //Need to pow window for divide
    let window_pow = await setWindowPow(window_function);

    // set [num_freq, frames] to [frames, num_freq]
    let input_irfft = input.irfft();
    let frames = input_irfft.shape[0];

    let output = null;
    let slice_backward;
    for (var i = 0; i < frames; i++) {
        let temp_irfft = input_irfft.slice([i, 0], [1, n_fft]).reshape([n_fft]);
        let temp_output = temp_irfft.mul(window_function);
        temp_output = temp_output.div(window_pow);

        let slice_forward;
        slice_forward = temp_output.slice([0], [hop_length]);

        if (output == null) {
            output = slice_forward;
            slice_backward = temp_output.slice([hop_length], [hop_length]);
        } else {
            let temp_concat = slice_forward.add(slice_backward);
            output = tf.concat([output, temp_concat]);
            slice_backward = temp_output.slice([hop_length], [hop_length]);
        }
    }

    output = tf.concat([output, slice_backward]);
    return output
}

module.exports = {
    customSTFT,
    customISTFT
};

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
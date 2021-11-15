//Notification Function(for Pracitce)
window.showNotification('앱이 실행되었습니다.')

// Audio Player
// const audio = document.getElementById('microphone')
const play_btn = document.getElementById('play')
// Play/Pause Button
const play_pause = document.getElementById('PlayPause')
// Record Button
const record_start_btn = document.getElementById('record-status-start')
const record_end_btn = document.getElementById('record-status-stop')
// Media Url
const url = document.getElementById('media')
// WaveForm
const waveform = document.getElementById('waveform')
// Save Button
const saveButton = document.getElementById('save')

//init call Record Setting
let mediaStream,
    buffer = [],
    AudioContext,
    audioCtx,
    bufferSize = 4096,
    processor,
    audioSourceNode;

const constraints = {
    audio: {
        //audio option
        autoGainControls : false,
        echoCancellation : false,
        noiseSuppression : false,
        channelCount : 1,
        sampleRate : 16000,
    },
    video: false,
} // Receive only audio when running stream

// Add Record Event
record_start_btn.addEventListener('click', startRec)
record_end_btn.addEventListener('click', stopRec)

function init(){
    AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext({
        sampleRate: 16000, //Set SampleRate
    });

    console.log(audioCtx.destination)

    processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
    processor.connect(audioCtx.destination);
    audioCtx.resume();
}

// Start Record Function
async function startRec() {
    record_start_btn.hidden = true
    record_end_btn.hidden = false

    await init();
    navigator.mediaDevices.getUserMedia(constraints).then(
        (stream) => {
            //Using AudioContext
            mediaStream = stream;
            audioSourceNode = audioCtx.createMediaStreamSource(stream);
            audioSourceNode.connect(processor);
            processor.onaudioprocess = function(e){
                let temp = e.inputBuffer.getChannelData(0);
                console.log(e.inputBuffer.numberOfChannels)
                handleDataAvailable(temp);
            }
        }
    );

    // if (stream) {
    //     //Start Recording...
    //     mediaStream = new MediaStream(stream.getAudioTracks())
        
    //     mic = new MediaRecorder(mediaStream)
    //     mic.ondataavailable = handleDataAvailable
    //     mic.onstop = handleStop
    //     mic.start()
    //     // console.log(mic)
    //     console.log("Recording has started...")
    // }
}

function handleDataAvailable(e){
    // Input data in array named buffer
    for(let i = 0; i < e.length; i++){
        buffer.push(e[i]);
    }
}

let f32a;
// let uint8a;

// Recorder Stop Event
function handleStop(chunks){
    f32a = new Float32Array(chunks); // Set ArrayBuffer(Float32Array)
    // let uint8a = convert_uint8(f32a)
    let f32a_buffer = f32a.buffer; // array.buffer

    // Tester
    // uint8a = new Uint8Array(f32a_buffer).buffer
    // console.log(uint8a);

    let blob = new Blob([f32a_buffer], {type: 'audio/ogg'});
    console.log(blob instanceof Blob)
    const audioURL = URL.createObjectURL(blob);
    url.innerHTML = audioURL;
    waveVisualize(audioURL);
    // Exit Stream
    mediaStream.getTracks().forEach(track => track.stop());
}

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

// Stop Record Function
async function stopRec(){
    // mic.stop()
    // Set buffer to Float32Array
    await handleStop(buffer);

    console.log("Processor Disconnect called.");
    audioSourceNode.disconnect(processor);
    processor.disconnect(audioCtx.destination);
    audioCtx.close().then(function(){
        audioSourceNode = null;
        processor = null;
        audioCtx = null;
        AudioContext = null;
        buffer = [];
    })

    record_start_btn.hidden = false
    record_end_btn.hidden = true
    console.log("Recording Stopped...")

    play_pause.disabled = false
    saveButton.disabled = false
}

// Add Recorded Audio File
saveButton.addEventListener('click', addList)
// Click List
function addList(){
    const newLi = document.createElement('li') // parents node
    // Add file uploaded on player to the list
    const newAudio = document.createElement('span')
    newAudio.innerText = url.innerText //need to actual download
    newAudio.setAttribute('hidden', true) // set invisible

    // Add in list child
    newLi.appendChild(newAudio)

    const date = new Date()
    const name = date.getFullYear()+"_"+date.getMonth()+"_"+date.getDate()+"-"+date.getHours()+"_"+date.getMinutes()+"_"+date.getSeconds()
    const newName = document.createElement('span')
    newName.innerText = name
    newName.addEventListener('click', function(e){
        const target = e.target
        const parent = target.parentElement
        const target_audio = parent.children[0]
        waveVisualize(target_audio.innerText)
    })

    // Add in list child name
    newLi.appendChild(newName)
    newLi.setAttribute('class', 'list_child')

    const ul = document.getElementById('list')
    ul.appendChild(newLi)
}

// Modern Method 
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

//Need to create Function that convert Blob to Float32Array

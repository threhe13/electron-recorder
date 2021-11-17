const preload = require('./preload.js');
// const cc = require('./FullSubNet/model.js'); //for test

//Notification Function(for Pracitce)
showNotification.create('앱이 실행되었습니다.');

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

let mediaStream,
    streamNode,
    mic,
    chunks = [],
    AudioContext,
    audioCtx,
    processor,
    buffer = [];

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

const process_parameters = {
    processorOptions: {
        bufferSize : 4096,
    },
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 1,
};

//for exporting to model.js
async function init(){
    AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext({
        sampleRate: 16000, //Set SampleRate
    });// Create AudioContext

    // Create createScrioptProcessor function
    await audioCtx.audioWorklet.addModule('./FullSubNet/model.js');
    processor = new AudioWorkletNode(audioCtx, 'processor', process_parameters);
    processor.connect(audioCtx.destination);
    audioCtx.resume();
}

async function startRec(){
    record_start_btn.hidden = true;
    record_end_btn.hidden = false;
    mediaStream = null;

    //import test -> ok!
    // cc.inference('test');

    init();
    navigator.mediaDevices.getUserMedia(constraints).then(
        (stream) => {
            // console.log(stream);
            mediaStream = stream
            // console.log(mediaStream);
            streamNode = audioCtx.createMediaStreamSource(stream);
            streamNode.connect(processor);

            mic = new MediaRecorder(stream);
            mic.ondataavailable = handleDataAvailable;
            mic.onstop = handleStop;
            mic.start(); // Start Recording
            console.log("Recording has started...");
        }
    );
}

function handleDataAvailable(e){
    chunks.push(e.data);
}

function handleStop(){
    let blob = new Blob(chunks, {type: 'audio/wav'});
    let audioURL = URL.createObjectURL(blob);
    url.innerHTML = audioURL;
    waveVisualize.create(audioURL);

    console.log(processor);

    // Reset Arg
    chunks = [];
    mic = null; 
    // streamNode = null;

    // Exit Stream
    mediaStream.getTracks().forEach(track => track.stop());
}

function stopRec(){
    mic.stop();
    audioCtx.close();

    record_start_btn.hidden = false;
    record_end_btn.hidden = true;
    console.log("Recording Stopped...");

    play_pause.disabled = false
    saveButton.disabled = false
}

// Add Record Event
record_start_btn.addEventListener('click', startRec);
record_end_btn.addEventListener('click', stopRec);

// Add Recorded Audio File
saveButton.addEventListener('click', addList);
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
        waveVisualize.create(target_audio.innerText)
    })

    // Add in list child name
    newLi.appendChild(newName)
    newLi.setAttribute('class', 'list_child')

    const ul = document.getElementById('list')
    ul.appendChild(newLi)
}
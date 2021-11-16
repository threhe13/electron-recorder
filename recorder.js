const preload = require('./preload.js');
const model = require('./model.js');

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
    mic,
    chunks = [],
    AudioContext,
    audioCtx,
    processor;

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

//for exporting to model.js
async function init(){
    AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext({
        sampleRate: 16000, //Set SampleRate
    });// Create AudioContext

    await audioCtx.audioWorklet.addModule('model.js')
    processor = new AudioWorkletNode(audioCtx, 'processor')
    processor.connect(audioCtx.destination);
    audioCtx.resume();
}

async function startRec(){
    record_start_btn.hidden = true
    record_end_btn.hidden = false

    init();
    console.log(audioCtx);

    navigator.mediaDevices.getUserMedia(constraints).then(
        (stream) => {
            // console.log(stream);
            mediaStream = stream
            // console.log(mediaStream);
            mic = new MediaRecorder(stream);
            mic.ondataavailable = handleDataAvailable;
            mic.onstop = handleStop;
            mic.start(); // Start Recording
            console.log("Recording has started...");
        }
    );
}

function handleDataAvailable(e){
    console.log(e)
    console.log(e.data)
    chunks.push(e.data);
}

function handleStop(){
    let blob = new Blob(chunks, {type: 'audio/wav'});
    let audioURL = URL.createObjectURL(blob);
    url.innerHTML = audioURL;
    waveVisualize.create(audioURL);

    chunks = [];
    mic = null; 
    // console.log(mic);
    // Exit Stream
    mediaStream.getTracks().forEach(track => track.stop());
}

function stopRec(){
    mic.stop();
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
// Audio Player
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
    AudioContext = window.AudioContext || window.webkitAudioContext,
    audioDest,
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
        bufferSize : 1024,
        channelCount: 1,
    },
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 1,
};

//for exporting to model.js
// async function init(){
//     AudioContext = window.AudioContext || window.webkitAudioContext;
//     audioCtx = new AudioContext({
//         sampleRate: 16000, //Set SampleRate
//     });// Create AudioContext

//     // Create createScrioptProcessor function
//     await audioCtx.audioWorklet.addModule('renderer/bufferProcess.js');
//     processor = new AudioWorkletNode(audioCtx, 'processor', process_parameters);
//     processor.port.onmessage = function(e){
//         console.log(e.data.message);
//         console.log(e.data.output)

//         for (let i = 0; i < process_parameters.processorOptions.bufferSize; i++){
//             buffer.push(e.data.output[i]);
//         }// Set Stream Float32Array
//     }
//     audioCtx.resume();
// }

// async function startRec(){
//     record_start_btn.hidden = true;
//     record_end_btn.hidden = false;
//     //import test -> ok!
//     // cc.inference('test');

//     init();
//     navigator.mediaDevices.getUserMedia(constraints).then(
//         async (stream) => {
//             // console.log(stream);
//             mediaStream = stream
//             // console.log(mediaStream);

//             // https://stackoverflow.com/questions/55165335/how-do-you-combine-many-audio-tracks-into-one-for-mediarecorder-api
//             streamNode = await audioCtx.createMediaStreamSource(stream);
//             streamNode.connect(processor);

//             mic = new MediaRecorder(stream);
//             mic.ondataavailable = handleDataAvailable;
//             mic.onstop = await handleStop;
//             mic.start(); // Start Recording
//             console.log("Recording has started...");
//         }
//     );
// }

function startRec() {
    record_start_btn.disabled = true;
    buffer = [];

    audioCtx = new AudioContext({ sampleRate: 16000 });
    audioDest = audioCtx.createMediaStreamDestination();
    let startAt = 0;

    navigator.mediaDevices.getUserMedia(constraints).then(async (stream) => {
        audioCtx.resume();
        mediaStream = stream;
        streamNode = audioCtx.createMediaStreamSource(stream);
        audioCtx.audioWorklet.addModule("renderer/bufferProcess.js").then(() => {
            // reference : renderer/bufferProcess.js
            record_start_btn.hidden = true;
            record_end_btn.hidden = false;

            processor = new AudioWorkletNode(
                audioCtx,
                "processor",
                process_parameters
            );
            processor.port.onmessage = function (e) {
                console.log(e.data.buffer);

                let floats = new Float32Array(e.data.buffer);
                let source = audioCtx.createBufferSource();
                let buffer = audioCtx.createBuffer(1, floats.length, constraints.audio.sampleRate)

                buffer.getChannelData(0).set(floats);
                source.buffer = buffer;
                source.connect(audioDest);
                source.start();
            };
            streamNode.connect(processor)
            
            mic = new MediaRecorder(audioDest.stream);
            mic.ondataavailable = handleDataAvailable;
            mic.onstop = handleStop;
            mic.start();
        }).catch((err) => console.error(err));
    });
}

function handleDataAvailable(e){
    chunks.push(e.data);
}

async function handleStop(){
    console.log(mic)
    let blob = new Blob(chunks, {type: 'audio/wav'});
    let audioURL = URL.createObjectURL(blob);
    url.innerHTML = audioURL;
    window.waveVisualize(audioURL);
}

// let test_result;
async function stopRec(){
    //Set AudioContext Disconnect & Close
    // console.log(mic)
    audioCtx.close().then(async ()  => {
        mic.stop();
        await mediaStream.getTracks().forEach(track => track.stop());

        mediaStream = null;
        streamNode = null;
        audioDest = null;
        mic = null;
        chunks = [];
        audioCtx = null;
        processor = null;
    })

    record_start_btn.hidden = false;
    record_end_btn.hidden = true;
    record_start_btn.disabled = false;
    console.log("Recording Stopped...");

    play_pause.disabled = false;
    saveButton.disabled = false;

    // for debugging
    // await convert.inference(temp_buffer);
    // temp_buffer = [];
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
        window.waveVisualize(target_audio.innerText)
    })

    // Add in list child name
    newLi.appendChild(newName)
    newLi.setAttribute('class', 'list_child')

    const ul = document.getElementById('list')
    ul.appendChild(newLi)
}
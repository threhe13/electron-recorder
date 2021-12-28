// Audio Player
const play_btn = document.getElementById('play')
// Play/Pause Button
const play_pause = document.getElementById('PlayPause')
// Record Button
const record_start_btn = document.getElementById('record-status-start')
const record_end_btn = document.getElementById('record-status-stop')
const enhance = document.getElementById('enhance')
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
    global_buffer = null;

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

const mimeType = 'audio/webm;codecs=opus'

async function startRec() {
    record_start_btn.disabled = true;
    console.log("recording started...");

    audioCtx = new AudioContext({ sampleRate: 16000 });
    audioDest = audioCtx.createMediaStreamDestination();

    // await register(await connect());

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
                // console.log(e.data.buffer);
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
            // console.log(MediaRecorder.isTypeSupported("audio/wav;codes=MS_PCM"));
            // console.log(audioDest.stream)
            mic.ondataavailable = handleDataAvailable;
            mic.onstop = handleStop;
            mic.start();
        }).catch((err) => console.error(err));
    });
}

function handleDataAvailable(e){
    // console.log(e.data)
    chunks.push(e.data);
}

function handleStop(){
    let blob = new Blob(chunks, {"type": mimeType});
    let audioURL = URL.createObjectURL(blob);
    global_buffer = blob;
    waveVisualize(audioURL);
    chunks.pop(); // chunks = [Blob]
}

// let test;
// async function enhancement(){
//     console.log('enhanced...')
//     let tfjs_input = new Float32Array(global_buffer);
//     let tfjs_output = await convert.inference(tfjs_input);
    
//     test = tfjs_output; // for debugging

//     audioCtx = new AudioContext({sampleRate: 16000});
//     audioCtx.resume();

//     // applied_result = new Uint16Array(tfjs_output.buffer);

//     audioDest = audioCtx.createMediaStreamDestination();
//     // let buffer = audioCtx.createBuffer(1, applied_result.length, constraints.audio.sampleRate);
//     let buffer = audioCtx.createBuffer(1, tfjs_output.length, constraints.audio.sampleRate);
//     buffer.getChannelData(0).set(tfjs_output);

//     let source = audioCtx.createBufferSource();
//     source.buffer = buffer
//     source.connect(audioDest);
    
//     mic = new MediaRecorder(audioDest.stream);
//     // console.log(chunks)
//     mic.ondataavailable = handleDataAvailable;
//     mic.onstop = handleStop;

//     mic.start();
//     source.start();

//     source.onended = e => {
//         audioCtx.close().then(() => {
//             mic.stop();
//             audioCtx = null;
//             audioDest = null;
//             mic = null;
//         })
//     }

//     // delete enhancement button
//     enhance.disabled = true;
//     console.log('complete enhancement')
// }

// Debugging Code
// let test_file;
// enhance.addEventListener('click', () => {
//     let webm_file = "storage/2021_11_27-18_2_19.webm";
//     test_file = python.inference(webm_file);
// });


async function stopRec(){
    //Set AudioContext Disconnect & Close
    audioCtx.close().then(async ()  => {
        mic.stop();
        await mediaStream.getTracks().forEach(track => track.stop());

        mediaStream = null;
        streamNode = null;
        audioDest = null;
        mic = null;
        audioCtx = null;
        processor = null;
    })

    record_start_btn.hidden = false;
    record_end_btn.hidden = true;
    record_start_btn.disabled = false;

    console.log("Recording Stopped...");

    play_pause.disabled = false;
    saveButton.disabled = false;
    enhance.disabled = false;

    // for debugging
    // await convert.inference(temp_buffer);
    // temp_buffer = [];
}

// Add Record Event
record_start_btn.addEventListener('click', startRec);
record_end_btn.addEventListener('click', stopRec);

// Add Recorded Audio File
saveButton.addEventListener('click', download);

async function download(){
    let path = "storage/";

    // if path is not exist, then create folder
    utils.mkdir(path);

    // Download function
    let webm_file = global_buffer;
    let fileName = await utils.download(webm_file); //fileName == storage/[fileName]
    console.log(fileName);

    // Add file at list => move to list page
    // let files = utils.loadList();
    // console.log(files);
}

function aDownload(blob){
    // Download Setting
    let aElement = document.createElement("a");
    aElement.href = blob;

    // Naming part
    const date = new Date()
    const name = date.getFullYear()+"_"+date.getMonth()+"_"+date.getDate()+"-"+date.getHours()+"_"+date.getMinutes()+"_"+date.getSeconds()
    
    // Donwload function
    aElement.download = name + ".webm";
    aElement.click();
}

let addList = (fileName) => {
    // parentElement
    let listDiv = document.getElementById('list');
    // console.log(fileName);

    // to upload setting name
    // let displayName = fileName.split('/')[1];

    // childElement setting
    let liElement = document.createElement('li');
    let spanElement = document.createElement('span');
    spanElement.innerText = displayName;
    spanElement.addEventListener('click', (e) => {
        let target = e.target;
        // console.log(target) == <span>fileName</span>
        // console.log(target.tagName);
        if(target.tagName === "SPAN") waveVisualize(fileName);
    });
    liElement.appendChild(spanElement);
    listDiv.appendChild(liElement);
}
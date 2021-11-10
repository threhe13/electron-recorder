import "./model"

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
let mic = null,
    stream = null,
    mediaStream = null,
    chunks = [];

const constraints = {
    audio: {
        //audio option
        echoCancellation : false,
        noiseSuppression : false,
        channelCount : 1,
        sampleRate : 16000,
    }
} // Receive only audio when running stream

record_start_btn.addEventListener('click', startRec)
record_end_btn.addEventListener('click', stopRec)

// Start Record Function
async function startRec() {
    record_start_btn.hidden = true
    record_end_btn.hidden = false

    stream = await navigator.mediaDevices.getUserMedia(constraints)

    if (stream) {
        //Start Recording...
        mediaStream = new MediaStream(stream.getTracks())
        mic = new MediaRecorder(mediaStream)
        mic.ondataavailable = handleDataAvailable
        mic.onstop = handleStop
        mic.start()
        // console.log(mic)
        console.log("Recording has started...")
    }
}

function handleDataAvailable(e){
    // Input data in array named chunks
    chunks.push(e.data)
}

// MediaRecorder stop event
function handleStop(e){
    console.log("data available after MediaRecorder.stop() called.");
    const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' })
    const audioURL = window.URL.createObjectURL(blob);
    url.innerHTML = audioURL
    waveVisualize(audioURL)
    // Exit Stream
    stream.getTracks().forEach(track => track.stop());
    // Reset chunks array
    chunks = []
}

// Stop Record Function
function stopRec(){
    mic.stop()
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
function recover(url){
    /*
        param
        url : URL of blob created by URL.createObjectURL();
        .. e.g. const media = document.getElementById('media').innerText .then media == url

        return : Float32Array (for using Tensor)
    */

    let blob = await fetch(url).then(r => r.blob());
    return blob
}

//Need to create Function that convert Blob to Float32Array
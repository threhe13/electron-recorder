const { contextBridge } = require('electron')
const WaveSurfer = require('wavesurfer.js')

// Notification Function
contextBridge.exposeInMainWorld('showNotification', (contents) => {
    new Notification(
        "Electron-Dev",
        { 
            body: contents,
        }
    );
})

// Audio Visualization
contextBridge.exposeInMainWorld('waveVisualize', (wave) => {
    // Delete previous waveform
    const waveform = document.getElementById('waveform')
    if(waveform.childElementCount > 0){
        const child = waveform.children[0]
        waveform.removeChild(child)
    }

    // Create New Waveform
    const wavesurfer = WaveSurfer.create({
        container: "#waveform",
        waveColor: "#1D201F",
        progressColor: "#C58882",
        height: 128,
        normalize: true,
        interact: false,
    })

    // wave visualization
    wavesurfer.load(wave)

    // Connect wavesurfer option with player play/pause button
    const audio = document.getElementById('microphone')
    audio.onplay = connectPlay
    audio.onpause = connectPause
    audio.onended = connectPause

    // if click player play button
    function connectPlay(){
        wavesurfer.play()
    }

    // if click player pause button
    function connectPause(){
        wavesurfer.pause()
    }
})

// Record Function
contextBridge.exposeInMainWorld('recorder', () => {
    const record_btn = document.getElementById('record')    
    const constraints = {audio: true} // Receive only audio when running stream

    // start, stop image
    const btn_img = document.getElementById('record-status')

    if(btn_img.alt == "start"){ //start record
        //Visualize record state
        btn_img.src = "./assets/images/stop.png"
        btn_img.alt = "stop" // Status

        // Record
        const wave = navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            const mediaRecorder = new MediaRecorder(stream)

            mediaRecorder.start()
            console.log("Recording...") // for debug

            record_btn.addEventListener('click', function(){

                btn_img.src = "./assets/images/record.png"
                btn_img.alt = "start" // Status
                mediaRecorder.stop() //Stop recording
                console.log("Stop Recording")

                // Load Recording file on player
                var chunks = [];
                mediaRecorder.onstop = function(e) {
                    console.log("data available after MediaRecorder.stop() called.");
                    var audio = document.getElementById('microphone')
                    var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
                    var audioURL = window.URL.createObjectURL(blob);
                    audio.src = audioURL;
                    console.log("recorder stopped");

                    // Exit Stream
                    stream.getTracks().forEach(function(track){
                        track.stop();
                    })
                }

                mediaRecorder.ondataavailable = function(e){
                    chunks.push(e.data)
                }
            }, {once: true})

        })
        .catch(err => { // Stream error
            alert('Couldn\'t connect stream\n'+err)
        })
    }

})


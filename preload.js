const { contextBridge } = require('electron')
const WaveSurfer = require('wavesurfer.js')

contextBridge.exposeInMainWorld('showNotification', (contents) => {
    const noti = new Notification(
        "Electron-Dev",
        { 
            body: contents,
        }
    );
    noti.show();
})

// audio analyser
contextBridge.exposeInMainWorld('waveVisualize', (wave) => {
    const wavesurfer = WaveSurfer.create({
        container: "#waveform",
        waveColor: "violet",
        progressColor: "purple",
    })

    wavesurfer.load(wave)
})

contextBridge.exposeInMainWorld('recorder', () => {
    const record_btn = document.getElementById('record')    
    const constraints = {audio: true}

    const btn = document.getElementById('record-status')
    let record_state = btn.alt
    console.log(record_state)

    if(record_state == "start"){ //start record
        //Visualize record state
        btn.src = "./assets/images/stop.png"
        btn.alt = "stop" // Status

        // Record
        const wave = navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            const mediaRecorder = new MediaRecorder(stream)

            mediaRecorder.start()
            console.log("Recording...")

            record_btn.onclick = function(){

                btn.src = "./assets/images/record.png"
                btn.alt = "start" // Status
                mediaRecorder.stop()
                record_btn.removeEventListener("click", this)
                console.log("Stop Recording")

                var chunks = [];

                mediaRecorder.onstop = function(e) {
                    console.log("data available after MediaRecorder.stop() called.");
                    var audio = document.getElementById('microphone')
                    var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
                    var audioURL = window.URL.createObjectURL(blob);
                    audio.src = audioURL;
                    console.log("recorder stopped");
                }

                mediaRecorder.ondataavailable = function(e){
                    chunks.push(e.data)
                }
            }

        })
        .catch(err => {
            alert('Couldn\'t connect stream\n'+err)
        })
    }

})

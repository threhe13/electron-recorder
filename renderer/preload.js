const { contextBridge } = require('electron');
const WaveSurfer = require('wavesurfer.js');
const { convertTensor, inference } = require('./model');
const tf = require('@tensorflow/tfjs');
const child = require('child_process').spawn;


// Notification Function
contextBridge.exposeInMainWorld(
    'showNoti',
    {
        create: (contents) => {
            new Notification("Electron-Dev", { body: contents });
        }
    }
)

// Audio Visualization
contextBridge.exposeInMainWorld('waveVisualize', (wave) => {
    // Delete previous waveform
    const waveform = document.getElementById('waveform');
    if(waveform.childElementCount > 0){
        const child = waveform.children[0];
        waveform.removeChild(child);
    }

    // check darkmode
    let isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let color = null;

    if(isDark){
        color = '#FFFFFF';
    }
    else{
        color = "#1D201F";
    }

    // Create New Waveform
    const wavesurfer = WaveSurfer.create({
        container: "#waveform",
        waveColor: color,
        progressColor: "#C58882",
        height: 128,
        normalize: true,
        interact: false,
    })
    // wave visualization
    wavesurfer.load(wave)

    const play_btn = document.getElementById('play');
    const pause_btn = document.getElementById('pause');
    play_btn.removeAttribute('hidden');
    pause_btn.setAttribute('hidden', true);

    // Activate Play and Pause Button
    play_btn.onclick = function(){
        wavesurfer.play();
        play_btn.setAttribute('hidden', true);
        pause_btn.removeAttribute('hidden');
    }
    pause_btn.onclick = function(){
        wavesurfer.pause();
        play_btn.removeAttribute('hidden');
        pause_btn.setAttribute('hidden', true);
    }
    wavesurfer.on('finish', function() { // When finish to play audio, change pause icon to play icon
        play_btn.removeAttribute('hidden');
        pause_btn.setAttribute('hidden', true);
    })
})

// Set convert tensor and inference function
contextBridge.exposeInMainWorld(
    'convert', 
    {
        tensor : async (input) => {
            let tensor = await convertTensor(input);
            return tensor;
        },

        inference : async (input) => {
            let output;
            let tfjs_result = await inference(input);
            // console.log(tfjs_result.print());
            output = tfjs_result.dataSync();
            return output
        }
    }
)

contextBridge.exposeInMainWorld(
    'python',
    {
        // Complete Test 
        test : async (comment) => {
            let create_log = child("python", ["inference/test.py", comment]);
            create_log.stdout.on('data', (data) => {
                console.log(data);
            })
        },
        
        inference : async (wav_file) => {
            let enhanced_wav = child("python", ["inference/model.py", wav_file]);
            enhanced_wav.stdout.on('data', (data) => {
                console.log(data);
            })
        }
    }
)

contextBridge.exposeInMainWorld(
    'utils',
    {
        download : async (blob) => {
            let aElement = document.createElement("a");
            aElement.href = blob;
            const date = new Date()
            const name = date.getFullYear()+"_"+date.getMonth()+"_"+date.getDate()+"-"+date.getHours()+"_"+date.getMinutes()+"_"+date.getSeconds()
            aElement.download = name + ".webm";
            aElement.click();
        }
    }
)
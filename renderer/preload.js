const { contextBridge } = require('electron');
const fs = require('fs');
const WaveSurfer = require('wavesurfer.js');
const { convertTensor, inference } = require('./model');
const tf = require('@tensorflow/tfjs');
const child = require('child_process').spawnSync;


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
        
        inference : async (webmFile, savedName) => {
            console.log("python script started...");
            let enhanced_wav = child("python", ["inference/main.py", webmFile, savedName]);
            return enhanced_wav;
        }
    }
)

contextBridge.exposeInMainWorld(
    'utils',
    {
        download : async (blob, inputName=null) => {
            //Setting file name using Date
            let path = "storage/";

            // Setting Name saved file
            let fileName;
            let type = ".webm";
            
            if (inputName == null){
                let date = new Date();
                let name = date.getFullYear()+"_"+date.getMonth()+"_"+date.getDate()+"-"+date.getHours()+"_"+date.getMinutes()+"_"+date.getSeconds();
                fileName = path+name;
            }
            else fileName = path+inputName;

            // Append File in Directory
            let reader = new FileReader();
            reader.onload = () => {
                let buffer = Buffer.from(reader.result);
                // Save webm file in storage folder
                fs.writeFile(fileName+type, buffer, (err, result) => {
                    if(err) { 
                        console.log("error:", err);
                        return; // if occurs error, stop and return
                    }
                    return fileName+type
                });
            };
            reader.readAsArrayBuffer(blob);

            // Run enhancement external scriopt
            let enhanced_wav = child("python", ["inference/main.py", fileName+type, fileName+".wav"])
            return enhanced_wav;
        },

        mkdir : (dirPath) => {
            const isExist = fs.existsSync(dirPath);
            if(!isExist) fs.mkdirSync(dirPath, {recursive: true});
        },

        loadList : () => {
            const listDiv = document.getElementById('list');
            let path = "storage/";
            let files;

            // Read files in "storage" folder
            listDiv.innerHTML = "";
            fs.readdir(path, (err, fileList) => {
                if(err) console.log("error:", err);
                // Set return value
                files = fileList;
        
                fileList = fileList.filter(item => !(/(^|\/)\.[^\/\/.]/g.test(item))); // ignore hidden junk file
                fileList.forEach(element => {
                    // console.log(element);
                    let liElement = document.createElement('li');
                    let spanElement = document.createElement('span');

                    spanElement.innerText = element;
                    liElement.appendChild(spanElement);
                    listDiv.appendChild(liElement);
                });
            });
            return files;
        }
    }
)
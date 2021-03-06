const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const WaveSurfer = require('wavesurfer.js');
const { spawn } = require('child_process');


// Notification Function
contextBridge.exposeInMainWorld(
    'functional',
    {
        create: (contents) => {
            new Notification("Recorder", { body: contents });
        },
    }
)

// Audio Visualization
contextBridge.exposeInMainWorld(
    'wave',
    {
        atMain: (wave) => {
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
        },

        atList : (wave, box) => {
            if(box.childElementCount > 1){
                const child = box.children[1];
                box.removeChild(child);
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
                container: box,
                waveColor: color,
                progressColor: "#C58882",
                height: 128,
                normalize: true,
                interact: false,
            })
            // wave visualization
            wavesurfer.load(wave)
        }
    }
)

// Set convert tensor and inference function
// contextBridge.exposeInMainWorld(
//     'convert', 
//     {
//         tensor : async (input) => {
//             let tensor = await convertTensor(input);
//             return tensor;
//         },

//         inference : async (input) => {
//             let output;
//             let tfjs_result = await inference(input);
//             // console.log(tfjs_result.print());
//             output = tfjs_result.dataSync();
//             return output
//         }
//     }
// )

contextBridge.exposeInMainWorld(
    'python',
    {
        // Complete Test 
        test : async (comment) => {
            let create_log = spawn("python", ["inference/test.py", comment]);
            create_log.stdout.on('data', (data) => {
                console.log(data);
            })
        },
        
        inference : async (webmFile, savedName) => {
            // console.log("python script started...");
            let enhanced_wav = spawn("python", ["inference/main.py", webmFile, savedName]);
            enhanced_wav.stdout.on('data', (data) => {
                //data //it is buffer(ArrayBuffer) 
                return savedName;
            })
        }
    }
)

contextBridge.exposeInMainWorld(
    'modal',
    {
        send : (messeage, value) => {
            ipcRenderer.sendSync(messeage, value);
        }
    }
)

contextBridge.exposeInMainWorld(
    'list',
    {
        open : () => {
            ipcRenderer.send('open-list');
        },

        load : () => {

        },

        wave : () => {

        }
    }
)

contextBridge.exposeInMainWorld(
    'utils',
    {
        download : async (blob) => {
            //Setting file name using Date
            let path = "storage/";

            // Setting Name saved file
            let fileName = ipcRenderer.sendSync('electron-modal');
            let type = ".webm";
            
            if (fileName == ""){
                let date = new Date();
                let name = date.getFullYear()+"_"+date.getMonth()+"_"+date.getDate()+"-"+date.getHours()+"_"+date.getMinutes()+"_"+date.getSeconds();
                fileName = name;
            }
            else if (fileName == null){
                return null;
            }

            // Append File in Directory
            let reader = new FileReader();
            reader.onload = () => {
                let buffer = Buffer.from(reader.result);
                // Save webm file in storage folder
                fs.writeFile(path+fileName+type, buffer, (err, result) => {
                    if(err) { 
                        console.log("error:", err);
                        return null; // if occurs error, stop and return
                    }
                });
            };
            reader.readAsArrayBuffer(blob);

            return fileName;
        },

        mkdir : (dirPath) => {
            const isExist = fs.existsSync(dirPath);
            if(!isExist) fs.mkdirSync(dirPath, {recursive: true});
        },

        loadList : (listElement) => {
            let path = "storage/";
            // console.log(path);
            const downArrowPath = "../../assets/images/down-arrow.png"

            // Read files in "storage" folder
            // listElement.innerHTML = "";
            let inputPath = "../../storage/"
            fs.readdir(path, (err, fileList) => {
                if(err) console.log("error:", err);
                // Set return value
                fileList = fileList.filter(item => !(/(^|\/)\.[^\/\/.]/g.test(item))); // ignore hidden junk file ex. .DS_Store
                fileList.forEach(element => {
                    let liElement = document.createElement('li');

                    let spanElement = document.createElement('span');
                    spanElement.classList.add('fileName');
                    spanElement.innerText = element.toString();
                    
                    let imgElement = document.createElement('img');
                    imgElement.setAttribute('src', downArrowPath);

                    // div
                    let divElement = document.createElement('div');
                    divElement.classList.add('audio');

                    let audioElement = document.createElement('audio');
                    audioElement.setAttribute("src", inputPath+element.toString()) ;
                    audioElement.setAttribute("controls", "controls")
                    divElement.appendChild(audioElement);

                    liElement.classList.add('childList');
                    liElement.appendChild(spanElement)
                    liElement.appendChild(imgElement)
                    liElement.appendChild(divElement);
                    listElement.appendChild(liElement);
                });
            });
        }
    }
)
# Electron-dev
Desktop Application included Speech Enhancement Model<br>

## Demo
<p align="center">
    <img src="./assets/images/demo4.png" alt="demo image" width="329px">
    <img src="./assets/images/demo_gif.gif" alt="demo video" width="320px">
</p>

## Reference
> Speech Enhancement Model<br>
> - Github : <a href="https://github.com/haoxiangsnr/FullSubNet" target="_blank">FullSubNet</a> (tensorflow)<br> 

> Desktop Application<br>
> - Electron : <a href="https://www.electronjs.org" target="_blank">Electron.org</a><br>
> - WaveForm : <a href="https://wavesurfer-js.org/" target="_black">Wavesurfer.js</a>
> - Images : <a href="https://www.flaticon.com/" target="_blank">Flaticon</a>

### Develop Environment
1. MacOS(~~Big Sur~~ Monterey, <code>Intel</code>)
2. Visual Studio Code
3. Vanila JS

### How to Start
<code>brew install node</code><br>
<code>npm install electron --save-dev</code><br>
Also can use <code>electron-quick-start</code> uploaded on <a href="https://github.com/electron/electron-quick-start" target="_blank">Github</a>

# Information
- process : main(Backend), renderer(Frontend)
- communication module : ipcMain, ipcRenderer, remote

# Requirement
- node
- npm
- electron@15.3.0
- electron-is-dev@2.0.0 <code>npm install electron-is-dev</code>
- electron-builder@22.13.1 <code>npm install electron-builder</code>
- wavesurfer.js@5.2.0 <code>npm install wavesurfer.js --save</code>
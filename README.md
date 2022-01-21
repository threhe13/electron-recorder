# Electron Recorder

Desktop Application included Speech Enhancement Model<br>

## Demo

<p align="center">
    <!-- Getting Ready... -->
    <img src="./assets/images/demo7.png" alt="demo" width="200px">
    <img src="./assets/images/demo7_list.png" alt="demo" width="200px">
    <img src="./assets/images/demo7_file.png" alt="demo" width="200px">
</p>

## Reference

> Speech Enhancement Model<br>
>
> - <a href="https://arxiv.org/abs/2010.15508" target="_blank">FullSubNet</a><br>
> - <a href="https://deep-hearing.ai/" target="_blank">DeepHearing Algorithm</a>

> Desktop Application<br>
>
> - Electron : <a href="https://www.electronjs.org/" target="_blank">Electron.org</a><br>
> - Node : <a href="https://nodejs.org/en/" target="_blank">NodeJS</a>
> - WaveForm : <a href="https://wavesurfer-js.org/" target="_blank">Wavesurfer.js</a>
> - Tensorflow : <a href="https://www.tensorflow.org/js/" target="_blank">Tensorflow.js</a>
> - Images : <a href="https://www.flaticon.com/" target="_blank">Flaticon</a>

### Develop Environment

1. MacOS(~~Big Sur~~ Monterey, <code>Intel</code>), WindowOS(window10)
2. Visual Studio Code
3. Vanila JS
4. Python

## How to set Electron environment

<code>brew install node</code><br>
<code>npm install electron --save-dev</code><br>
Also can install <code>electron-quick-start</code> uploaded on <a href="https://github.com/electron/electron-quick-start" target="_blank">Github</a>

# Information

- process : main(Backend), renderer(Frontend)
- communication module : ipcMain, ipcRenderer, remote
  <br>

# Requirement

- node@17.0.1
- npm@8.1.0
- electron@15.3.0
- electron-is-dev@2.0.0 <code>npm install electron-is-dev</code>
- electron-builder@22.13.1 <code>npm install electron-builder</code>
- wavesurfer.js@5.2.0 <code>npm install wavesurfer.js --save</code>
- ~~tensorflow.js@3.11.0 <code>npm install @tensorflow/tfjs</code>~~

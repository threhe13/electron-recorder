// const NOTIFICATION_TITLE = 'Electron-Dev'
// const NOTIFICATION_BODY = 'Notification from the Renderer process.'

//Notification Function
window.showNotification('앱이 실행되었습니다.')

// need to select mic type
const audio = document.getElementById('microphone')
const record_btn = document.getElementById('record')
const waveform = document.getElementById('waveform')
record_btn.addEventListener('click', recorder)

//visualization function
audio.addEventListener('loadeddata', function(){
    waveVisualize(audio.src)
})
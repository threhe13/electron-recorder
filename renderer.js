// const NOTIFICATION_TITLE = 'Electron-Dev'
// const NOTIFICATION_BODY = 'Notification from the Renderer process.'

//Notification Function
// window.showNotification('앱이 실행되었습니다.')

// need to select mic type
const audio = document.getElementById('microphone')
const record_btn = document.getElementById('record')
record_btn.onclick = recorder //=> audio.onchange = waveVisualize(audio.src)

//visualization function
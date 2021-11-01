// const NOTIFICATION_TITLE = 'Electron-Dev'
// const NOTIFICATION_BODY = 'Notification from the Renderer process.'

//Notification Function
// window.showNotification('앱이 실행되었습니다.')

// record.onclick = function() {
//     mediaRecorder.start();
//     console.log("recorder started");
//   }

// need to select mic type
window.navigator.mediaDevices.getUserMedia(
    {
        audio: true,
    }
).then(function(stream){
    // // Video option test
    // video = document.getElementById('camera')

    // if ('srcObject' in video) {
    //     video.srcObject = stream;
    // } 
    // else {
    // // Avoid using this in new browsers, as it is going away.
    //     video.src = URL.createObjectURL(stream);
    // }

    // Audio option test



}).catch(function(){
    alert('Couldn\'t connect stream')
})
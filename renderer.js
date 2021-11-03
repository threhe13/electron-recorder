//Notification Function(for Pracitce)
window.showNotification('앱이 실행되었습니다.')

// need to select mic type
// function ~

// Audio Player
const audio = document.getElementById('microphone')

// Record Button
const record_btn = document.getElementById('record')

// WaveForm
const waveform = document.getElementById('waveform')

// call Record Function
record_btn.addEventListener('click', recorder)

// call Visualization function
audio.addEventListener('loadeddata', function(){
    waveVisualize(audio.src)
})

// Add Recorded Audio File
audio.addEventListener('loadeddata', function(){
    var newLi = document.createElement('li')

    // Add file uploaded on player to the list
    var newAudio = document.createElement('audio')
    newAudio.setAttribute('src', audio.src)
    newAudio.setAttribute('visible', 'none') // set invisible

    
})
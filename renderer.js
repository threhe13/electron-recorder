//Notification Function(for Pracitce)
window.showNotification('앱이 실행되었습니다.')

// need to select mic type
// function ~

// Audio Player
// const audio = document.getElementById('microphone')
const audio = document.getElementById('play')

// Play/Pause Button
const play_pause = document.getElementById('PlayPause')

// Record Button
const record_btn = document.getElementById('record')

// WaveForm
const waveform = document.getElementById('waveform')

// Save Button
const saveButton = document.getElementById('save')

// call Record Function
record_btn.addEventListener('click', recorder)

// call Visualization function


// alt.addEventListener('change', function(){
//     waveVisualize(audio.src)
// })

// alt.addEventListener('change', function(){
//     saveButton.removeAttribute('disabled')
//     play_pause.removeAttribute('disabled')
// }, {once:true})


// Add Recorded Audio File
saveButton.addEventListener('click', addList)

// Click List
function addList(){
    const newLi = document.createElement('li') // parents node
    // Add file uploaded on player to the list
    const newAudio = document.createElement('span')
    newAudio.innerHTML = audio.alt //need to actual download
    newAudio.setAttribute('hidden', true) // set invisible

    // Add in list child
    newLi.appendChild(newAudio)

    const date = new Date()
    const name = date.getFullYear()+"_"+date.getMonth()+"_"+date.getDate()+"-"+date.getHours()+"_"+date.getMinutes()+"_"+date.getSeconds()
    const newName = document.createElement('span')
    newName.innerHTML = name
    newName.addEventListener('click', function(e){
        const target = e.target
        const parent = target.parentElement

        const target_audio = parent.children[0]

        waveVisualize(target_audio.innerHTML)
    })

    // Add in list child name
    newLi.appendChild(newName)
    newLi.setAttribute('class', 'list_child')

    const ul = document.getElementById('list')
    ul.appendChild(newLi)
}
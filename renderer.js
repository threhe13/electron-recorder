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

// Save Button
const saveButton = document.getElementById('save')

// call Record Function
record_btn.addEventListener('click', recorder)

// call Visualization function
audio.addEventListener('loadeddata', function(){
    waveVisualize(audio.src)
})

audio.addEventListener('loadeddata', function(){ saveButton.removeAttribute('disabled') }, {once:true})

// Add Recorded Audio File
saveButton.addEventListener('click', addList)

// Click List
function addList(){
    const newLi = document.createElement('li') // parents node
    // Add file uploaded on player to the list
    const newAudio = document.createElement('audio')
    newAudio.setAttribute('src', audio.src) //need to actual download
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

        waveVisualize(target_audio.src)
        audio.src = target_audio.src
    })

    // Add in list child name
    newLi.appendChild(newName)
    newLi.setAttribute('class', 'list_child')

    const ul = document.getElementById('list')
    ul.appendChild(newLi)
}
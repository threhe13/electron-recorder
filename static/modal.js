const { ipcRenderer } = require("electron");

// HTML Componenet
const submitBtn = document.getElementById('modal-submit');
const cancelBtn = document.getElementById('modal-cancel');

//HTML function
document.addEventListener("DOMContentLoaded", function (e) {
    document.getElementById('input').focus();
});

let Submit = () => {
    let val = document.getElementById('input').value;
    ipcRenderer.sendSync('electron-modal-value', val);
}

let Cancel = () => {
    ipcRenderer.sendSync('electron-modal-value', null);
}

submitBtn.addEventListener('click', Submit);
cancelBtn.addEventListener('click', Cancel);


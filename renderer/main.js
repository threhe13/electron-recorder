const {app, BrowserWindow, systemPreferences, ipcMain} = require('electron')
const isDev = require('electron-is-dev')
const path = require('path'); 

let win;
function createWindow(){
    // make browser window
    win = new BrowserWindow(
        {
            width: 400,
            height: 500,
            resizable: false,
            disableHtmlFullscreenWindowResize: true,
            webPreferences: {
                //a security risk only when you're executing some untrusted remote code on your application.  
                // nodeIntegration: true, 
                // contextIsolation: false,
                preload: path.join(__dirname, 'preload.js'),
            },
        }
    )
    // load main html
    // Delete win.loadURL function for security
    win.loadFile(path.join(__dirname, '../index.html'))
    
    // open DevTool option
    if (isDev) {
        win.webContents.openDevTools()
    }



    // event when window closed
    win.on('closed', () => {
        win = null
    })

    // Permission to Access Microphone
    // console.log(systemPreferences.getMediaAccessStatus('microphone')) // not determined -> NSMicrophone.. plist..
    const status = systemPreferences.getMediaAccessStatus('microphone')
    console.log(status)
    const access = systemPreferences.askForMediaAccess('microphone')
    console.log(access)
}

/* Electron */
app.whenReady().then(() => {
    createWindow();
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
})

// On mac, command+Q
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
})
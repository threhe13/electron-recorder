const { create } = require('domain')
const {app, BrowserWindow, systemPreferences} = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
const url = require('url')

// window object. if not, be closed automatically
// let win

function createWindow(){
    // make browser window
    const win = new BrowserWindow(
        {
            width: 400,
            height: 600,
            resizable: true,
            webPreferences: {
                nodeIntegration: true, //a security risk only when you're executing some untrusted remote code on your application.
                contextIsolation: false,
            },
        }
    )
    
    // load window using url
    // load main html
    win.loadURL(
        // can use also 'process.env.ELECTRON_START_URL'
        url.format(
            {
                pathname: path.join(__dirname, 'renderer/index.html'),
                protocol: 'file:',
                slashes: true,
            }
        )
    )
    // win.loadFile('index.html')
    
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
app.whenReady().then(createWindow)

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.on('window-all-closed', () => {
    app.quit()
})
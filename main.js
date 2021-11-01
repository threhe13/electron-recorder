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
            width: 800,
            height: 600,
            resizable: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js')
            },
        }
    )
    
    // load window using url
    // load main html
    win.loadURL(
        // can use also 'process.env.ELECTRON_START_URL'
        url.format(
            {
                pathname: path.join(__dirname, 'index.html'),
                protocol: 'file:',
                slashes: true,
            }
        )
    )
    // win.loadFile('index.html')
    
    // open DevTool for using
    if (isDev) {
        win.webContents.openDevTools()
    }
    // event when window closed
    win.on('closed', () => {
        win = null
    })

    // Access Microphone
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
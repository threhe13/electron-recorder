const { create } = require('domain')
const {app, BrowserWindow} = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
const url = require('url')

// window object. if not, be closed automatically
let win

function createWindow(){
    // make browser window
    win = new BrowserWindow(
        {
            width: 800,
            height: 600,
        }
    )

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
    
    // open DevTool for using
    if (isDev) {
        win.webContents.openDevTools()
    }
    // event when window closed
    win.on('closed', () => {
        win = null
    })
}

/* Electron */
app.on('ready', () => {
    createWindow()
})

app.on('window-all-closed', () => {
    app.quit()
})
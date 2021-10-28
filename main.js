const { create } = require('domain')
const {app, BrowserWindow, ipcMain, nativeTheme} = require('electron')
const isDev = require('electron-is-dev')
const path = require('path')
const url = require('url')

// window object. if not, be closed automatically
//let win

function createWindow(){
    // make browser window
    const win = new BrowserWindow(
        {
            width: 800,
            height: 600,
            resizable: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js')
            }
        }
    )
    
    /*
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
    )*/

    win.loadFile('index.html')

    ipcMain.handle('dark-mode:toggle', () => {
        if (nativeTheme.shouldUseDarkColors) {
            nativeTheme.themeSource = 'light'
        }
        else {
            nativeTheme.themeSource = 'dark'
        }
        return nativeTheme.shouldUseDarkColors
    })

    ipcMain.handle('dark-mode:system', () => {
        nativeTheme.themeSource = 'system'
    })
    
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
app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
const {app, BrowserWindow, systemPreferences, ipcMain, ipcRenderer} = require('electron')
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
                preload: path.join(__dirname, 'renderer/preload.js'),
            },
        }
    )
    // load main html
    // Delete win.loadURL function for security
    win.loadFile(path.join(__dirname, 'index.html'))
    
    // open DevTool option
    if (isDev) {
        win.webContents.openDevTools()
    }

    // event when window closed
    win.on('closed', () => {
        win = null
    })

    //dialog setting
    ipcMain.on('electron-modal', (event) => {
        //Modal Window Setting
        let modalWindow = new BrowserWindow({
            parent: win, // set child window
            width: 300,
            height: 100,
            resizable: false,
            modal: true, // when open child window, set parents window to untouchable
            titleBarStyle: 'hidden',
            webPreferences: {
                preload: path.join(__dirname, 'renderer/preload.js')
            }
        });
        //HTML File
        const modalHtml = path.join(__dirname, 'renderer/pages/modal.html');
        modalWindow.loadFile(modalHtml);

        modalWindow.show();
        //Modal Closed Option
        modalWindow.on('close', () => {
            modalWindow = null;
        })

        ipcMain.on('electron-modal-value', (e, value) => {
            if (value == null){
                modalWindow.close();
            }
            else{
                console.log("send?");
                modalWindow.webContents.send('electron-modal-value-reply', value);
                modalWindow.close();
            }
        })
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
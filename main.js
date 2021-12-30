const {app, BrowserWindow, systemPreferences, ipcMain, webContents} = require('electron')
const isDev = require('electron-is-dev');
const path = require('path'); 

let win;
function createWindow(){
    // make browser window
    win = new BrowserWindow(
        {
            width: 400,
            height: 500,
            resizable: false,
			fullscreenable: false,
			maximizable: false,
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
    let modalWindow
    ipcMain.on('electron-modal', (event) => {
        //Modal Window Setting
        modalWindow = new BrowserWindow({
            parent: win, // set child window
            title: "Save file",
            width: 300,
            height: 150,
            minimizable: false,
			fullscreenable: false,
			maximizable: false,
            resizable: false,
            skipTaskbar: true,
            modal: true, // when open child window, set parents window to untouchable
            // titleBarStyle: 'hidden',
            webPreferences: {
                preload: path.join(__dirname, 'renderer/preload.js'),
            }
        });
        //initial setting
        modalWindow.setMenu(null);
		modalWindow.setMenuBarVisibility(false);
        //HTML File
        modalWindow.loadFile(path.join(__dirname, 'renderer/pages/modal.html'));

        modalWindow.on('ready-to-show', () => {
            modalWindow.show();
        })
        //Modal Closed Option
        modalWindow.on('closed', () => { modalWindow = null; })
        ipcMain.on('electron-modal-value', (e, value) => {
            // console.log(modalWindow); // for debugging
            modalWindow.close();
            event.returnValue = value;
        })
    })

    let fileList;
    ipcMain.on('open-list', () => {
        fileList = new BrowserWindow({
            width: 400,
            height: 500,
            webPreferences: {
                preload: path.join(__dirname, 'renderer/preload.js'),
            },
        });
        //initial setting
        fileList.setMenu(null);
		fileList.setMenuBarVisibility(false);
        fileList.loadFile(path.join(__dirname, 'renderer/pages/fileList.html'));

        fileList.on('ready-to-show', () => {
            fileList.show();
        });
        // Window Close Option
        fileList.on('closed', () => { fileList = null; });
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
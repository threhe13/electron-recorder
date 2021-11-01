const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('showNotification', (contents) => {
    const noti = new Notification(
        "Electron-Dev",
        { 
            body: contents,
        }
    );
    noti.show();
})

// audio analyser
contextBridge.exposeInMainWorld('wave_visual', (microphone) => {
    
})
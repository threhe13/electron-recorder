const NOTIFICATION_TITLE = 'Electron-Dev'
const NOTIFICATION_BODY = 'Notification from the Renderer process.'

function showNotification(){
    new Notification(NOTIFICATION_TITLE, { body: NOTIFICATION_BODY }).show()
}
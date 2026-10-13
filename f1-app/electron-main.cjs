const { app, BrowserWindow, session } = require('electron')
const path = require('path')

// Disable GPU and Sandbox to prevent crashes in WSL2/Linux environments
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('disable-dev-shm-usage')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // Magic 1: Strip X-Frame-Options and Content-Security-Policy globally!
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const newHeaders = Object.assign({}, details.responseHeaders)
    
    delete newHeaders['x-frame-options']
    delete newHeaders['X-Frame-Options']
    delete newHeaders['content-security-policy']
    delete newHeaders['Content-Security-Policy']
    delete newHeaders['Cross-Origin-Opener-Policy']
    delete newHeaders['Cross-Origin-Embedder-Policy']
    
    callback({
      cancel: false,
      responseHeaders: newHeaders
    })
  })

  // Magic 2: Inject CSS into F1/F2/F3 to hide navigation headers
  session.defaultSession.setPreloads([path.join(__dirname, 'preload-css.cjs')])

  // Load the React local dev server
  win.loadURL('http://localhost:5174')
}

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

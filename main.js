const electron = require('electron')
const path = require ('path')
const ipc = electron.ipcMain
const app = electron.app
const Menu = electron.Menu
const BrowserWindow = electron.BrowserWindow

const debug = /--debug/.test(process.argv[2])

if (process.mas) app.setName('gRaPhiCview')

var mainWindow = null

function initialize () {

  function createWindow () {
    var windowOptions = {
      width: 1080,
      minWidth: 680,
      height: 840,
      title: app.getName()
    }

    mainWindow = new BrowserWindow(windowOptions)
    mainWindow.loadURL(path.join('file://', __dirname, '/index.html'))

    // Launch fullscreen with DevTools open, usage: npm run debug
    if (debug) {
      mainWindow.webContents.openDevTools()
      mainWindow.maximize()
      require('devtron').install()

    }
  }


  app.on('ready', function () {
    createWindow()
  })

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

}


initialize()

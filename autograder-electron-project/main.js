const {app, BrowserWindow, session} = require('electron');

let mainWindow;

function createWindow () {

  mainWindow = new BrowserWindow({
    minWidth: 1200, minHeight: 800,
    x:100, y:100,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  })

  mainWindow.on('closed', ()=>{
    mainWindow = null;
  });

  mainWindow.loadFile('index.html');

}

app.on('ready', createWindow);


const {app, BrowserWindow, ipcMain, MenuItem, dialog} = require('electron');
const AdmZip = require('adm-zip');
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

  mainWindow.webContents.openDevTools();

}

ipcMain.on('file-dropDown', (e, args) => {

  const zip = new AdmZip(args);

  const data = zip.getEntries().map((data) => {
    const container = {};
    container["name"] = data.name;
    container["body"] = data.getData().toString();
    return container;
  });

  e.sender.send('file-dropDown-response', data);
})

ipcMain.on('export-file',(e,args,location) =>{
  const zip = AdmZip();
  console.log(args);
  console.log(location);
  const file = args;
  dialog.showSaveDialog(mainWindow,
    {
      defaultPath: './test',
      filters:[
        {
          "name":"zip",
          "extensions":["zip"]
        }
      ]
    }).then(result => {

    if(!result.canceled){
    
      file.forEach(file => {
          zip.addFile(file.name,file.body);
      });

      zip.writeZip(result.filePath);
    
    }
      
  });

});

app.on('ready', createWindow);


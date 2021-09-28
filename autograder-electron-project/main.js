const {app, BrowserWindow, ipcMain, MenuItem, dialog} = require('electron');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const { readdir } = require('original-fs');
let mainWindow;

function createWindow () {

  mainWindow = new BrowserWindow({
    minWidth: 1200, minHeight: 900,
    x:2000, y:200,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  mainWindow.on('closed', ()=>{
    mainWindow = null;
  });

  mainWindow.loadFile('index.html');

  mainWindow.webContents.openDevTools();

}

ipcMain.on('populate-array', (e, args) => {

  const zip = AdmZip(args);
  
  const data = zip.getEntries().filter(file => (file.entryName.startsWith('tests/testcases/') && file.name.length > 0)).map((data) =>{
      const container = {};
      container["name"] = data.name;
      container["body"] = data.getData().toString();
      return container;
    })
  
    console.log(data);

    e.sender.send('populate-array-response', data);
});

ipcMain.on('populate-homework-array',(e,args) =>{
  const zip = AdmZip(args);
  
  const data = zip.getEntries().map((data) =>{
    const container = {};
    container["name"] = data.name;
    container["body"] = data.getData().toString();
    return container;
  })
  
  e.sender.send('populate-homeworkArray-response', data);

});

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


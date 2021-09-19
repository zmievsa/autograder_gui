const {app, BrowserWindow, ipcMain, MenuItem, dialog} = require('electron');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const { readdir } = require('original-fs');
let mainWindow;

function createWindow () {

  mainWindow = new BrowserWindow({
    minWidth: 1200, minHeight: 900,
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

ipcMain.on('populate-array', (e, args) => {

  const zip = AdmZip(args);
  
  const data = zip.getEntries().map((data) =>{
    const container = {};
    container["name"] = data.name;
    container["body"] = data.getData().toString();
    return container;
  })

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
  
  e.sender.send('populate-homework-array-response', data);


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

ipcMain.on('index-assignment', (e,args) =>{
  console.log(args);
  
  let zip = new AdmZip(args);

  zip.getEntries().filter(file => file.entryName.startsWith('testcases/')).forEach(function(entry){
    console.log(entry.entryName);
    console.log(entry.name);
    fs.writeFileSync(path.join(__dirname,'temp','testcases',entry.name),zip.readAsText(entry));
  });

  e.sender.send('index-assignment-response');

})

ipcMain.on('index-create-assignment',(e,args) =>{
  const folderDirectory = path.join(__dirname,'temp','testcases',args);
  
  fs.writeFile(folderDirectory,'',(err) =>{

    console.log("message has been written");
    e.sender.send('index-create-assignment-response');

  });
});

ipcMain.on('clear-temp',(e) =>{
  readdir(path.join(__dirname,'temp','testcases'),(err,files) =>{
    files.forEach(file =>{
      fs.unlinkSync(path.join(__dirname,'temp','testcases',file));
      console.log("file deleted");
    })
  })
});

app.on('ready', createWindow);


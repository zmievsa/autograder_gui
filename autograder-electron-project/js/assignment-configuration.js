const { ipcRenderer, session } = require('electron');

// Containers
let mainContainer = document.querySelector(".main-container");
let instructionsContainer = document.getElementById("instructions-container");
let editContainer = document.getElementById("edit-container");
let configContainer = document.getElementById("config-container");
let addContainer = document.getElementById("add-container");
let currentContainer = instructionsContainer;
let noItemsContainer = document.getElementById("no-items-container");

// Table
let table = document.getElementById("testcase-table");

// Globals
let currentIndex = 0;

let testcases = [

];

// Config Icon Buttons
let configButton = document.getElementById("config-button");
let inputButton = document.getElementById("input-button");
let outputButton = document.getElementById("output-button");
let configContent = document.getElementById("config-content");

// Buttons in add screen
let submitButton = document.getElementById("submit-button");

currentContainer.classList.add("show-window");



function initializeTable(items) {

    if(items.length == 0)
        noItemsContainer.classList.add("show-window");
}

function createTable(items) {
    let output = "";

    for (const item of items) {
        let image = "";
        let fileName = "";

        if (item.language == "c"){
            image = `<img style="height:20px; width:20px;" src="images/c.svg" />`;
            fileName = item.name+"."+"c";
        }
        else if (item.language == "java"){
            image = `<img style="height:20px; width:20px;" src="images/java.svg" />`;
            fileName = item.name+"."+"java"
        }
        else if (item.language == "c++"){
            image = `<img style="height:20px; width:20px;" src="images/c-plus.svg" />`;
            fileName = item.name+"."+"c++";
        }
        else{
            image = `<img style="height:20px; width:20px;" src="images/python.svg" />`;
            fileName = item.name+"."+"py";
        }

        output += `<tr>
                        <td data-action="row">${image}${fileName}</td>
                        <td data-action="row" class="buttons">
                            <i class="fas fa-edit fa-lg text-primary" data-action="edit"></i>
                            <i class="fas fa-cog fa-lg text-primary" data-action="config"></i>
                            <i class="fas fa-trash fa-lg text-primary" data-action="delete"></i>
                        </td>
                    </tr>
                `;
    }
    
    table.innerHTML = output;
}

function insertRow(item){
    let tr = document.createElement("tr");

    let image = "";
    let fileName = "";

    if (item.language == "c"){
        image = `<img style="height:20px; width:20px;" src="images/c.svg" />`;
        fileName = item.name+"."+"c";
    }
    else if (item.language == "java"){
        image = `<img style="height:20px; width:20px;" src="images/java.svg" />`;
        fileName = item.name+"."+"java"
    }
    else if (item.language == "c++"){
        image = `<img style="height:20px; width:20px;" src="images/c-plus.svg" />`;
        fileName = item.name+"."+"c++";
    }
    else{
        image = `<img style="height:20px; width:20px;" src="images/python.svg" />`;
        fileName = item.name+"."+"py";
    }

    let output = `
        <td data-action="row">${image}${fileName}</td>
        <td data-action="row" class="buttons">
            <i class="fas fa-edit fa-lg text-primary" data-action="edit"></i>
            <i class="fas fa-cog fa-lg text-primary" data-action="config"></i>
            <i class="fas fa-trash fa-lg text-primary" data-action="delete"></i>
        </td>`;

    tr.innerHTML = output;

    table.appendChild(tr);
    testcases.push({name:item.name, language:item.language,code:item.code});
}

function handleClick(evt) {
    var { action } = evt.target.dataset;
    console.log(action);
    
    if (action) {
    
        if (action == "edit") {
            let rowIndex = evt.target.closest("tr").rowIndex;
            // alert(`Edit user with ID of ${rowIndex}`);
            console.log(testcases);
            currentContainer.classList.remove("show-window");
            currentContainer = editContainer;
            currentContainer.classList.add("show-window");
            populateEditScreen(testcases,rowIndex);
        } 
        else if (action == "delete") {
            let rowIndex = evt.target.closest("tr").rowIndex;
            let name = testcases[rowIndex].name;
            console.log(evt.target.closest("tr").rowIndex);
            testcases = testcases.filter(testcase => testcase.name != name);
            evt.target.closest("tr").remove();
            currentContainer.classList.remove("show-window");
            currentContainer = instructionsContainer;
            currentContainer.classList.add("show-window");
            if(testcases.length == 0)
                noItemsContainer.classList.add("show-window");
            else
                noItemsContainer.classList.remove("show-window");
        } 
        else if (action == "config") {
            currentContainer.classList.remove("show-window");
            currentContainer = configContainer;
            currentContainer.classList.add("show-window");
            currentIndex = evt.target.closest("tr").rowIndex;
            let output = `<p>This is the config for ${testcases[currentIndex].name}</p>`;
            configContent.innerHTML = output;
        }
        else if(action == "add"){
            currentContainer.classList.remove("show-window");
            currentContainer = addContainer;
            currentContainer.classList.add("show-window");
        }
        else if(action == "row"){
            let rowIndex = evt.target.closest("tr").rowIndex;
            // alert(`Edit user with ID of ${rowIndex}`);
            console.log(testcases);
            currentContainer.classList.remove("show-window");
            currentContainer = editContainer;
            currentContainer.classList.add("show-window");
            populateEditScreen(testcases,rowIndex);
        }

    }
}

function populateEditScreen(testcases, index){
    let nameField = document.getElementById("file-name");
    nameField.value = testcases[index].name;

    let selectField = document.getElementById("language-select");
    
    selectField.selectedIndex = 1;

    if(testcases[index].language == 'c')
        selectField.selectedIndex = 0;
    else if(testcases[index].language == 'c++')
        selectField.selectedIndex = 1;
    else if(testcases[index].language == 'java')
        selectField.selectedIndex = 2;
    else if(testcases[index].language == 'py')
        selectField.selectedIndex = 3;
    

    let editCode = document.getElementById("edit-code");
    editCode.value = testcases[index].code;
}



configButton.addEventListener("click", (e)=>{
    let titleText = document.querySelector(".config-title");
    titleText.innerHTML = "Configuration";

    let output = `<p>This is the config for ${testcases[currentIndex].name}</p>`;
    configContent.innerHTML = output;
});

inputButton.addEventListener("click", (e)=>{
    let titleText = document.querySelector(".config-title");
    titleText.innerHTML = "Input";

    let output = `<p>This is the input for ${testcases[currentIndex].name}</p>`;
    configContent.innerHTML = output;
});

outputButton.addEventListener("click", (e) =>{
    let titleText = document.querySelector(".config-title");
    titleText.innerHTML = "Output";

    let output = `<p>This is the output for ${testcases[currentIndex].name}</p>`;
    configContent.innerHTML = output;
})

submitButton.addEventListener("click", (e) =>{
    e.preventDefault();
    let name = document.getElementById("add-filename");
    let language = document.getElementById("add-language-select");
    let code = document.getElementById("add-code");

    insertRow({name:name.value,language:language.value.toLowerCase(),code:code.value});
    name.value = "";
    language.selectedIndex = 0;
    code.value = "";

    currentContainer.classList.remove("show-window");
    currentContainer = instructionsContainer;
    currentContainer.classList.add("show-window");

    if(testcases.length == 0)
        noItemsContainer.classList.add("show-window");
    else
        noItemsContainer.classList.remove("show-window");


});

document.addEventListener("click", handleClick);

document.addEventListener("click", function(event){
    var isClickInside = mainContainer.contains(event.target);

    if(!isClickInside){
        currentContainer.classList.remove("show-window");
        currentContainer = instructionsContainer;
        currentContainer.classList.add("show-window");
    }
});

if(sessionStorage.getItem("assignment-baseFile") != null)
{
    document.querySelector("#assignment-text").innerHTML = "Assignment File: " + sessionStorage.getItem("assignment-baseFile");
}


let fileZipPath = './temp/testcases';
let exportButton = document.getElementById("export-container");

if(sessionStorage.getItem("assignment-directory") != null)
    ipcRenderer.send('populate-array', sessionStorage.getItem("assignment-directory"));
else
    initializeTable(testcases);


ipcRenderer.on('populate-array-response', (e, args) => {

    let files = args;

    for(let file of files)
    {
        let obj = {};
        let fullFileName = file.name.split(".");
        obj.name = fullFileName[0];
        obj.language = fullFileName[1];
        obj.code = file.body;

        testcases.push(obj);
    }

    initializeTable(testcases);
    createTable(testcases);
});


exportButton.addEventListener("click", (e) => {
    ipcRenderer.send('export-file', filesArray, sessionStorage.getItem("index"));
});

const { ipcRenderer, session } = require('electron');

// Globals
let currentIndex = 0;
let currentRow = null;

let globalData = {
                    assignmentName:'',
                    sourceFiles:'', 
                    timeout:'', 
                    testcaseWeight:'', 
                    totalPoints:'', 
                    generateResults:false, 
                    parallelGrading:false, 
                    stdoutGrading:false,
                    testcases:[],
};


// Containers
let mainContainer = document.querySelector(".main-container");
let instructionsContainer = document.getElementById("instructions-container");
let editContainer = document.getElementById("edit-container");
let configContainer = document.getElementById("config-container");
let addContainer = document.getElementById("add-container");
let currentContainer = instructionsContainer;
let noItemsContainer = document.getElementById("no-items-container");
let globalSettingsContainer = document.getElementById("global-settings-container");

// Subcontainers
let configIndividualContainer = document.getElementById("config-individual-container");
let inputContainer = document.getElementById("input-container");
let outputContainer = document.getElementById("output-container");

let currentConfigContainer = configIndividualContainer;

// Table
let table = document.getElementById("testcase-table");

// Config Icon Buttons
let configButton = document.getElementById("config-button");
let inputButton = document.getElementById("input-button");
let outputButton = document.getElementById("output-button");

// Add Screen Submit Button
let submitButton = document.getElementById("submit-button");

// Right Header Buttons
let globalIcons = document.querySelector(".global-icons");
let zipButton = document.getElementById("zip-button");
let globalSettingsButton = document.getElementById("global-settings-button");

// Popover 
let currentPopOver = $("#zip-button");

currentContainer.classList.add("show-window");

function showEmptyTable(items) {

    if(items.length == 0)
        noItemsContainer.classList.add("show-window");
}


// Creates the table on initial page load
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
                            <i class="fas fa-trash fa-lg text-primary" data-action="delete" data-toggle="modal" data-target="#exampleModalCenter"></i>
                        </td>
                    </tr>
                `;
    }
    
    table.innerHTML = output;
}

// Adds a new row to our table
function insertRow(item){
    let tr = document.createElement("tr");

    let image = "";
    let fileName = "";

    if (item.language == "c"){
        image = `<img style="height:20px; width:20px;" src="images/c.svg" />`;
        if(item.name.length >= 28)
            fileName = item.name.substring(0,25) + "...";
        else 
            fileName = item.name+"."+"c";
    }
    else if (item.language == "java"){
        image = `<img style="height:20px; width:20px;" src="images/java.svg" />`;
        if(item.name.length >= 28)
            fileName = item.name.substring(0,25) + "...";
        else 
            fileName = item.name+"."+"java"
    }
    else if (item.language == "c++"){
        image = `<img style="height:20px; width:20px;" src="images/c-plus.svg" />`;
        if(item.name.length >= 28)
            fileName = item.name.substring(0,25) + "...";
         else 
            fileName = item.name+"."+"c++";
    }
    else{
        image = `<img style="height:20px; width:20px;" src="images/python.svg" />`;
        
        if(item.name.length >= 28)
            fileName = item.name.substring(0,25) + "...";
        else 
            fileName = item.name+"."+"py";
    }

    let output = `
        <td data-action="row">${image}${fileName}</td>
        <td data-action="row" class="buttons">
            <i class="fas fa-edit fa-lg text-primary" data-action="edit"></i>
            <i class="fas fa-cog fa-lg text-primary" data-action="config"></i>
            <i class="fas fa-trash fa-lg text-primary" data-action="delete" data-toggle="modal" data-target="#exampleModalCenter"></i>
        </td>`;

    tr.innerHTML = output;

    table.appendChild(tr);
    globalData.testcases.push({name:item.name, language:item.language,code:item.code});
}

// Function that populates the edit screen window
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

function handleClick(evt) {
    var { action } = evt.target.dataset;
    console.log(evt.target.id);
    console.log(currentPopOver.attr('id'));
    
    if (action) {
        currentPopOver.popover('hide');
        if (action == "edit") {
            let rowIndex = evt.target.closest("tr").rowIndex;
            currentIndex = rowIndex;
            // alert(`Edit user with ID of ${rowIndex}`);
            // console.log(testcases);
            currentContainer.classList.remove("show-window");
            currentContainer = editContainer;
            currentContainer.classList.add("show-window");
            populateEditScreen(globalData.testcases,rowIndex);
        } 
        else if (action == "delete") {
            let rowIndex = evt.target.closest("tr").rowIndex;
            currentIndex = rowIndex;
            currentRow = evt.target.closest("tr");
            // let name = globalData.testcases[rowIndex].name;
            // console.log(evt.target.closest("tr").rowIndex);
            // globalData.testcases = globalData.testcases.filter(testcase => testcase.name != name);
            // evt.target.closest("tr").remove();
            // currentContainer.classList.remove("show-window");
            // currentContainer = instructionsContainer;
            // currentContainer.classList.add("show-window");
            // if(globalData.testcases.length == 0)
            //     noItemsContainer.classList.add("show-window");
            // else
            //     noItemsContainer.classList.remove("show-window");
        } 
        else if (action == "config") {
            let titleText = document.querySelector(".config-title");
            let rowIndex = evt.target.closest("tr").rowIndex;
            currentIndex = rowIndex;
            titleText.innerHTML = "Configuration";
            currentContainer.classList.remove("show-window");
            currentContainer = configContainer;
            currentContainer.classList.add("show-window");
            currentIndex = evt.target.closest("tr").rowIndex;
        
            currentConfigContainer.classList.remove("show-window");
            currentConfigContainer = configIndividualContainer;
            currentConfigContainer.classList.add("show-window");
        }
        else if(action == "add"){
            currentContainer.classList.remove("show-window");
            currentContainer = addContainer;
            currentContainer.classList.add("show-window");
        }
        else if(action == "row"){
            let rowIndex = evt.target.closest("tr").rowIndex;
            currentIndex = rowIndex;
            currentContainer.classList.remove("show-window");
            currentContainer = editContainer;
            currentContainer.classList.add("show-window");
            populateEditScreen(globalData.testcases,rowIndex);
        }
        else if(action == "globalTimeoutInfo"){
            currentPopOver = $("#globalTimeoutInfo");
            currentPopOver.popover('show');
        }
        else if(action == "zip-files"){
            currentPopOver.popover('hide');
            currentPopOver = $("#zip-button");
            currentPopOver.popover('show');
        }
        else if(action == "testcaseWeightInfo")
        {
            currentPopOver.popover('hide');
            currentPopOver = $("#testcaseWeightInfo");
            currentPopOver.popover('show');
        }
        else if(action == "assignmentNameInfo"){
            currentPopOver.popover('hide');
            currentPopOver = $("#assignmentNameInfo");
            currentPopOver.popover('show');
        }
        else if(action == "possibleSourceFileInfo"){
            currentPopOver.popover('hide');
            currentPopOver = $("#possibleSourceFileInfo");
            currentPopOver.popover('show');
        }
        else if(action == "globalTimeoutInfo"){
            currentPopOver.popover('hide');
            currentPopOver = $("#globalTimeoutInfo");
            currentPopOver.popover('show');
        }
        else if(action == "testcaseWeightInfo"){
            currentPopOver.popover('hide');
            currentPopOver = $("#testcaseWeightInfo");
            currentPopOver.popover('show');
        }
        else if(action == "totalPointsInfo"){
            currentPopOver.popover('hide');
            currentPopOver = $("#totalPointsInfo");
            currentPopOver.popover('show');
        }
        else if(action == "individualTimeoutInfo"){
            currentPopOver.popover('hide');
            currentPopOver = $("#individualTimeoutInfo");
            currentPopOver.popover('show');
        }
        else if(action == "individualTestcaseWeightInfo"){
            currentPopOver.popover('hide');
            currentPopOver = $("#individualTestcaseWeightInfo");
            currentPopOver.popover('show');
        }
    }
    else
        currentPopOver.popover('hide');
}



document.addEventListener("click", handleClick);


// Global Settings Form
let globalSettingsForm = document.querySelectorAll("#global-settings-form input");

for(let input of globalSettingsForm){
    console.log(input.type);

    if(input.type == "text"){
        input.addEventListener("change",(e)=>{
            globalData[input.dataset.name] = e.target.value;
        });
    }

    if(input.type == "checkbox"){
        input.addEventListener("change", (e) =>{
            console.log(input.checked);
            globalData[input.dataset.name] = e.target.checked;
        })
    }
}

// Edit Form Fields
let editFormFields = document.querySelectorAll("#edit-form input, #edit-form textarea,#edit-form select");

for(let input of editFormFields)
{
    if(input.type == "text"){
        input.addEventListener("keyup", (e) =>{
            let value = e.target.value;

            console.log(value.length);

            let image = "";
            let fileName = "";

            globalData.testcases[currentIndex][input.dataset.name] = value;

            if(value.length >= 28)
                value = value.substring(0,25) + "...";
        
            if (globalData.testcases[currentIndex].language == "c"){
                image = `<img style="height:20px; width:20px;" src="images/c.svg" />`;
                if(value.length >= 28)
                    fileName = value.substring(0,25) + "...";
                else
                    fileName = globalData.testcases[currentIndex].name+"."+"c";
            }
            else if (globalData.testcases[currentIndex].language == "java"){
                image = `<img style="height:20px; width:20px;" src="images/java.svg" />`;

                if(value.length >= 28)
                    fileName = value.substring(0,25) + "...";
                else
                    fileName = globalData.testcases[currentIndex].name+"."+"java"
            }
            else if (globalData.testcases[currentIndex].language == "c++"){
                image = `<img style="height:20px; width:20px;" src="images/c-plus.svg" />`;
                
                if(value.length >= 28)
                    fileName = value.substring(0,25) + "...";
                else
                    fileName = globalData.testcases[currentIndex].name+"."+"c++";
            }
            else{
                image = `<img style="height:20px; width:20px;" src="images/python.svg" />`;
                if(value.length >= 28)
                    fileName = value.substring(0,25) + "...";
                else
                    fileName = globalData.testcases[currentIndex].name+"."+"py";
            }

            let td = table.rows[currentIndex].getElementsByTagName("td");
            td[0].innerHTML = `${image}${fileName}`;
                
        });
    }
    else if(input.type == "textarea"){
        input.addEventListener("keyup", (e) =>{
            let value = e.target.value;
            globalData.testcases[currentIndex][input.dataset.name] = value;
        });
    }
    else if(input.type == "select-one"){
        input.addEventListener("change", (e) =>{
            let value = e.target.options[input.selectedIndex].value.toLowerCase();

            console.log(value);
            console.log(input.selectedIndex);
            if(value == 'c')
                globalData.testcases[currentIndex][input.dataset.name] = 'c';
            else if(value == 'c++')
                globalData.testcases[currentIndex][input.dataset.name] = 'c++';
            else if(value == 'python')
                globalData.testcases[currentIndex][input.dataset.name] = 'py';
            else if(value == 'java')
                globalData.testcases[currentIndex][input.dataset.name] = 'java';


            if (globalData.testcases[currentIndex].language == "c"){
                image = `<img style="height:20px; width:20px;" src="images/c.svg" />`;

                if(globalData.testcases[currentIndex].name.length >= 28)
                    fileName = globalData.testcases[currentIndex].name.substring(0,25) + "...";
                else
                fileName = globalData.testcases[currentIndex].name+"."+"c";
            }
            else if (globalData.testcases[currentIndex].language == "java"){
                image = `<img style="height:20px; width:20px;" src="images/java.svg" />`;
                if(globalData.testcases[currentIndex].name.length >= 28)
                    fileName = globalData.testcases[currentIndex].name.substring(0,25) + "...";
                else
                    fileName = globalData.testcases[currentIndex].name+"."+"java"
            }
            else if (globalData.testcases[currentIndex].language == "c++"){
                image = `<img style="height:20px; width:20px;" src="images/c-plus.svg" />`;

                if(globalData.testcases[currentIndex].name.length >= 28)
                    fileName = globalData.testcases[currentIndex].name.substring(0,25) + "...";
                else
                    fileName = globalData.testcases[currentIndex].name+"."+"c++";
            }
            else{
                image = `<img style="height:20px; width:20px;" src="images/python.svg" />`;
                if(globalData.testcases[currentIndex].name.length >= 28)
                    fileName = globalData.testcases[currentIndex].name.substring(0,25) + "...";
                 else
                    fileName = globalData.testcases[currentIndex].name+"."+"py";
            }

            let td = table.rows[currentIndex].getElementsByTagName("td");
            td[0].innerHTML = `${image}${fileName}`;
            
        });
    }
}

// Configuration Form Fields
let configFormFields = document.querySelectorAll("#config-form input");

for(input of configFormFields)
{
    if(input.dataset.name == "individualTimeout"){

        input.addEventListener("change", (e)=>{
                globalData.testcases[currentIndex].config.timeout = e.target.value;
        });
    }

    if(input.dataset.name == "testcaseWeights"){

        input.addEventListener("change", (e)=>{
                globalData.testcases[currentIndex].config.testcaseWeights = e.target.value;
        });
    }
}

// Input Form Fields
let inputFormFields = document.querySelectorAll("#input-form input");

for(let input of inputFormFields)
{
    if(input.dataset.name == "inputToggle"){
        input.addEventListener("change",(e)=>{
            console.log(e.target);
            globalData.testcases[currentIndex].input.state = e.target.checked;
        })
    }

    if(input.dataset.name == "inputText")
    {
        input.addEventListener("change",(e)=>{
            globalData.testcases[currentIndex].input.body = e.target.value;
        })
    }
}

// Output Form Fields
let outputFormFields = document.querySelectorAll("#output-form input");

for(let input of outputFormFields)
{
    if(input.dataset.name == "outputToggle"){
        input.addEventListener("change",(e)=>{
            globalData.testcases[currentIndex].input.state = e.target.checked;
        })
    }

    if(input.dataset.name == "outputText")
    {
        input.addEventListener("change",(e)=>{
            globalData.testcases[currentIndex].input.body = e.target.value;
        })
    }
}

// Configuration screen icon button
configButton.addEventListener("click", (e)=>{
    let titleText = document.querySelector(".config-title");
    titleText.innerHTML = "Configuration";
    currentContainer.classList.remove("show-window");
    currentContainer = configContainer;
    currentContainer.classList.add("show-window");

    currentConfigContainer.classList.remove("show-window");
    currentConfigContainer = configIndividualContainer;
    currentConfigContainer.classList.add("show-window");
});


// Configuration screen input button
inputButton.addEventListener("click", (e)=>{
    let titleText = document.querySelector(".config-title");
    titleText.innerHTML = "Input";

    currentContainer.classList.remove("show-window");
    currentContainer = configContainer;
    currentContainer.classList.add("show-window");

    currentConfigContainer.classList.remove("show-window");
    currentConfigContainer = inputContainer;
    currentConfigContainer.classList.add("show-window");
});


// Configuration screen output button
outputButton.addEventListener("click", (e) =>{
    let titleText = document.querySelector(".config-title");
    titleText.innerHTML = "Output";

    currentContainer.classList.remove("show-window");
    currentContainer = configContainer;
    currentContainer.classList.add("show-window");

    currentConfigContainer.classList.remove("show-window");
    currentConfigContainer = outputContainer;
    currentConfigContainer.classList.add("show-window");
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

    if(globalData.testcases.length == 0)
        noItemsContainer.classList.add("show-window");
    else
        noItemsContainer.classList.remove("show-window");

});

document.addEventListener("click", function(event){
    var isClickInside = mainContainer.contains(event.target) || globalIcons.contains(event.target);

    if(!isClickInside){
        currentContainer.classList.remove("show-window");
        currentContainer = instructionsContainer;
        currentContainer.classList.add("show-window");
    }
});

// if(sessionStorage.getItem("assignment-baseFile") != null)
// {
//     document.querySelector("#assignment-text").innerHTML = "Assignment File: " + sessionStorage.getItem("assignment-baseFile");
// }


// Show Global Settings
globalSettingsButton.addEventListener("click", (e) =>{
    currentContainer.classList.remove("show-window");
    currentContainer = globalSettingsContainer;
    currentContainer.classList.add("show-window");
});

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
  });

$(function () {
$('[data-toggle="popover"]').popover();
});


document.getElementById("confirmButton").addEventListener("click",(e)=>{
    let name = globalData.testcases[currentIndex].name;
    globalData.testcases = globalData.testcases.filter(testcase => testcase.name != name);
    currentRow.remove();
    currentContainer.classList.remove("show-window");
    currentContainer = instructionsContainer;
    currentContainer.classList.add("show-window");
    if(globalData.testcases.length == 0)
        noItemsContainer.classList.add("show-window");
    else
        noItemsContainer.classList.remove("show-window");

    $('#exampleModalCenter').modal('hide');
})


/* Backend Code */
// File I/O Scripts
let exportButton = document.getElementById("export-container");

if(sessionStorage.getItem("assignment-directory") != null)
    ipcRenderer.send('populate-array', sessionStorage.getItem("assignment-directory"));
else
    showEmptyTable(globalData.testcases);

// Request to populate our array using zip
ipcRenderer.on('populate-array-response', (e, args) => {

    let files = args;

    for(let file of files)
    {
        let obj = {};
        let fullFileName = file.name.split(".");
        obj.name = fullFileName[0];
        obj.language = fullFileName[1];
        obj.code = file.body;
        obj.config = {};
        obj.input ={};
        obj.output={};
        globalData.testcases.push(obj);
    }

    showEmptyTable(globalData.testcases);
    createTable(globalData.testcases);
});



exportButton.addEventListener("click", (e) => {
    ipcRenderer.send('export-file', globalData.testcases, sessionStorage.getItem("index"));
});

if(sessionStorage.getItem("assignment-baseFile") != null){
    zipButton.setAttribute("data-content", `<p>${sessionStorage.getItem("assignment-baseFile")}</p>`);
}

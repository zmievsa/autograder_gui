const { ipcRenderer, session } = require('electron');
console.log("hello world");

const dropZoneElement = document.querySelector(".upload-container");
const inputElement = document.querySelector(".drop-zone-input");

// Grade Button
let gradeButton = document.querySelector(".right-button-container");

// Global
let homeworkData = [];

let checkboxIds = 0;

// Table
let table = document.getElementById("homework-table");
createTable(homeworkData);

// Subcontainers
let noItemsContainer = document.getElementById("no-items-container");

if(homeworkData.length == 0)
    noItemsContainer.classList.add("show-window");

function showEmptyTable(items) {

    if(items.length == 0)
        noItemsContainer.classList.add("show-window");
    else
        noItemsContainer.classList.remove("show-window");
}

// Creates the table on initial page load
function createTable(items) {
    let output = "";

    for (const item of items) {
        let image = "";
        let fileName = "";
        

        if (item.extension == "c"){
            image = `<img style="height:20px; width:20px;" src="images/c.svg" />`;
            fileName = item.name+"."+"c";
        }
        else if (item.extension == "java"){
            image = `<img style="height:20px; width:20px;" src="images/java.svg" />`;
            fileName = item.name+"."+"java"
        }
        else if (item.extension == "c++"){
            image = `<img style="height:20px; width:20px;" src="images/c-plus.svg" />`;
            fileName = item.name+"."+"c++";
        }
        else{
            image = `<img style="height:20px; width:20px;" src="images/python.svg" />`;
            fileName = item.name+"."+"py";
        }

        output += `<tr>
                    
                        <td data-action="row">
                            <input data-action="check" class="check_box" type="checkbox" id="checkbox${checkboxIds}" checked />
                            <label for="checkbox${checkboxIds++}"></label>
                            ${image}${fileName}
                        </td>
                    </tr>
                `;
    }
    
    table.innerHTML = output;
}


function handleClick(evt) {
    var { action } = evt.target.dataset;
    // console.log(action);
    
    if (action) {
    
        if (action == "check") {
            let rowIndex = evt.target.closest("tr").rowIndex;
            homeworkData[rowIndex].state = !homeworkData[rowIndex].state;

            // alert(`Edit user with ID of ${rowIndex}`);
            // console.log(testcases);
        } 
    }
}

document.addEventListener("click", handleClick);

dropZoneElement.addEventListener("click", e => {
    inputElement.click();
});

inputElement.addEventListener("change", e =>{
    if(inputElement.files.length){
        // sessionStorage.setItem('assignment-baseFile', inputElement.files[0].name);
        // sessionStorage.setItem("assignment-directory",inputElement.files[0].path);
        ipcRenderer.send('populate-homework-array', inputElement.files[0].path);
        
    }
});


dropZoneElement.addEventListener("dragover", e => {
    e.preventDefault();
    dropZoneElement.classList.add("drop-zone--over");
});

["dragleave","dragend"].forEach((type) =>{
    dropZoneElement.addEventListener(type,(e) =>{
        dropZoneElement.classList.remove("drop-zone--over");
    })
})


dropZoneElement.addEventListener("drop", e =>{
    e.preventDefault();
    console.log(e.dataTransfer.files);
   
    sessionStorage.setItem('homework-directory', e.dataTransfer.files[0].path);
    sessionStorage.setItem('homework-baseFile',e.dataTransfer.files[0].name);

    ipcRenderer.send('populate-homework-array', e.dataTransfer.files[0].path);
    dropZoneElement.classList.remove("drop-zone--over");

});

// Backend

gradeButton.addEventListener("click", (e) =>{
    alert("Make call to backend code here.");

    // Your logic here - daniel



    location.href="grading-results.html";

})

ipcRenderer.on('populate-homeworkArray-response',(e,args)=>{

    let files = args;
    homeworkData = [];

    for(let file of files)
    {
        let obj = {};
        let fullFileName = file.name.split(".");
        obj.name = fullFileName[0];
        obj.extension = fullFileName[1];
        obj.state = true;
        homeworkData.push(obj);
    }

    createTable(homeworkData);
    showEmptyTable(homeworkData);

})

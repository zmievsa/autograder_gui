

function loadAssignmentPage(assignment) {
    console.log(assignment)
    if (assignment.testcases.length == 0)
        noItemsContainer.classList.add("show-window");
    for (const testcase of assignment.testcases)
        addTestcaseRow(testcase);
    globalAssignment = assignment
    populateDocumentWithConfig(assignment.global_config);

    $(".cfgtooltip").hover(function () {
        const span = $(this).next("span");
        console.log($("body").height);
        const top = ($(this).offset().top - span.height() * 0.6 - 200);
        span.css("top", `${top}px`)
        span.addClass("d-inline-table");
    }, function () {
        $(this).next("span").removeClass("d-inline-table");
    })

}


$(document).ready(function () {
    eel.get_assignment()(loadAssignmentPage);
});

function populateDocumentWithConfig(config) {
    let output = ""
    for (item of config.filter((i) => i.type !== "checkbox")) {
        if (item.is_per_testcase) {
            item.key = "Default " + item.key.toLowerCase();
        }
        output += `
        <div class="form-group">
            <i class="fas fa-info-circle text-primary cfgtooltip"></i><span class="tooltiptext">${item.description}</span>
            <label>${item.key}</label>
            <input type="${item.type}" spellcheck="false" value="${item.value}" class="form-control"
                data-name="${item.original_name}" data-description="${item.description}">
        </div>
    `
    }
    for (item of config.filter((i) => i.type === "checkbox")) {
        if (item.value)
            value = "on";
        else
            value = "off";
        output += `
            <div class="form-group">
                <i class="fas fa-info-circle text-primary cfgtooltip"></i><span class="tooltiptext">${item.description}</span>
                <span class="pr-2">${item.key}</span>
                <div class="custom-control custom-switch d-inline">
                    <input id="${item.original_name}"
                        type="${item.type}"
                        class="custom-control-input"
                        id="${item.original_name}"
                        data-name="${item.original_name}"
                        value="${value}"
                    />
                    <label class="custom-control-label" for="${item.original_name}"></label>
                </div>
            </div>
        `;
    }
    $("#global-settings-content").html(output)
}

function addTestcaseRow(item) {
    let image = `<img style="height:20px; width:20px;" src="../images/${item.language.toLowerCase()}.svg" />`;
    console.log(image);
    // TODO
    // if (item.name.length >= 28)
    //     fileName = item.name.substring(0, 25) + "...";
    // else
    //     fileName = item.name + "." + "py";
    let tr = document.createElement("tr");
    tr.innerHTML = `<tr>
        <td data-action="row">${image}${item.name}</td>
        <td data-action="row" class="buttons">
            <i class="fas fa-edit fa-lg text-primary" data-action="edit"></i>
            <i class="fas fa-cog fa-lg text-primary" data-action="config"></i>
            <i class="fas fa-trash fa-lg text-primary" data-action="delete" data-toggle="modal" data-target="#exampleModalCenter"></i>
        </td>
    </tr>
    `;
    table.appendChild(tr);
    globalAssignment.testcases.push({ name: item.name, language: item.language, code: item.code });
}

// Globals
let currentIndex = 0;
let currentRow = null;

let globalAssignment = {
    global_config: {},
    testcases: [],
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

// Add Screen references
let addFileName = document.getElementById("add-filename");
let submitButton = document.getElementById("submit-button");

// Right Header Buttons
let globalIcons = document.querySelector(".global-icons");
let zipButton = document.getElementById("zip-button");
let globalSettingsButton = document.getElementById("global-settings-button");

// Popover 
let currentPopOver = $("#zip-button");

let gradingButton = document.querySelector(".grading-container");

currentContainer.classList.add("show-window");

// Function that populates the edit screen window
function populateEditScreen(testcases, index) {
    let nameField = document.getElementById("file-name");
    nameField.value = testcases[index].name;

    let selectField = document.getElementById("language-select");

    selectField.selectedIndex = 1;

    if (testcases[index].language == 'c')
        selectField.selectedIndex = 0;
    else if (testcases[index].language == 'c++')
        selectField.selectedIndex = 1;
    else if (testcases[index].language == 'java')
        selectField.selectedIndex = 2;
    else if (testcases[index].language == 'py')
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
            // alert(`Edit user with ID of ${ rowIndex } `);
            // console.log(testcases);
            currentContainer.classList.remove("show-window");
            currentContainer = editContainer;
            currentContainer.classList.add("show-window");
            populateEditScreen(globalAssignment.testcases, rowIndex);
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
            populateIndividualConfig();
        }
        else if (action == "add") {
            currentContainer.classList.remove("show-window");
            currentContainer = addContainer;
            currentContainer.classList.add("show-window");
        }
        else if (action == "row") {
            let rowIndex = evt.target.closest("tr").rowIndex;
            currentIndex = rowIndex;
            currentContainer.classList.remove("show-window");
            currentContainer = editContainer;
            currentContainer.classList.add("show-window");
            populateEditScreen(globalAssignment.testcases, rowIndex);
        }
        // else if (action == "globalTimeoutInfo") {
        //     currentPopOver = $("#globalTimeoutInfo");
        //     currentPopOver.popover('show');
        // }
        // else if (action == "zip-files") {
        //     currentPopOver.popover('hide');
        //     currentPopOver = $("#zip-button");
        //     currentPopOver.popover('show');
        // }
        // else if (action == "testcaseWeightInfo") {
        //     currentPopOver.popover('hide');
        //     currentPopOver = $("#testcaseWeightInfo");
        //     currentPopOver.popover('show');
        // }
        // else if (action == "assignmentNameInfo") {
        //     currentPopOver.popover('hide');
        //     currentPopOver = $("#assignmentNameInfo");
        //     currentPopOver.popover('show');
        // }
        // else if (action == "possibleSourceFileInfo") {
        //     currentPopOver.popover('hide');
        //     currentPopOver = $("#possibleSourceFileInfo");
        //     currentPopOver.popover('show');
        // }
        // else if (action == "globalTimeoutInfo") {
        //     currentPopOver.popover('hide');
        //     currentPopOver = $("#globalTimeoutInfo");
        //     currentPopOver.popover('show');
        // }
        // else if (action == "testcaseWeightInfo") {
        //     currentPopOver.popover('hide');
        //     currentPopOver = $("#testcaseWeightInfo");
        //     currentPopOver.popover('show');
        // }
        // else if (action == "totalPointsInfo") {
        //     currentPopOver.popover('hide');
        //     currentPopOver = $("#totalPointsInfo");
        //     currentPopOver.popover('show');
        // }
        // else if (action == "individualTimeoutInfo") {
        //     currentPopOver.popover('hide');
        //     currentPopOver = $("#individualTimeoutInfo");
        //     currentPopOver.popover('show');
        // }
        // else if (action == "individualTestcaseWeightInfo") {
        //     currentPopOver.popover('hide');
        //     currentPopOver = $("#individualTestcaseWeightInfo");
        //     currentPopOver.popover('show');
        // }
    }
    // else
    //     currentPopOver.popover('hide');
}



// document.addEventListener("click", handleClick);


// Global Settings Form
let globalSettingsForm = document.querySelectorAll("#global-settings-form input");

// for (let input of globalSettingsForm) {
//     console.log(input.type);

//     if (input.type == "text") {
//         input.addEventListener("change", (e) => {
//             globalAssignment[input.dataset.name] = e.target.value;
//         });
//     }

//     if (input.type == "checkbox") {
//         input.addEventListener("change", (e) => {
//             console.log(input.checked);
//             globalAssignment[input.dataset.name] = e.target.checked;
//         })
//     }
// }

// Edit Form Fields
let editFormFields = document.querySelectorAll("#edit-form input, #edit-form textarea,#edit-form select");

// for (let input of editFormFields) {
//     if (input.type == "text") {

//         input.addEventListener("keydown", (e) => {

//             let key = e.key.toLowerCase().charCodeAt(0);

//             if (!((key >= 97 && key <= 122) || (key >= 48 && key <= 57) || key == 32 || key == 8)) {
//                 e.preventDefault();
//                 return;
//             }
//         })

//         input.addEventListener("keyup", (e) => {


//             console.log(input.value);


//             let value = e.target.value;

//             console.log(value.length);

//             let image = "";
//             let fileName = "";

//             globalAssignment.testcases[currentIndex][input.dataset.name] = value;

//             if (value.length >= 26)
//                 value = value.substring(0, 25) + "...";

//             if (globalAssignment.testcases[currentIndex].language == "c") {
//                 image = `< img style = "height:20px; width:20px;" src = "../images/c.svg" /> `;
//                 if (value.length >= 26)
//                     fileName = value.substring(0, 25) + "...";
//                 else
//                     fileName = globalAssignment.testcases[currentIndex].name + "." + "c";
//             }
//             else if (globalAssignment.testcases[currentIndex].language == "java") {
//                 image = `< img style = "height:20px; width:20px;" src = "../images/java.svg" /> `;

//                 if (value.length >= 26)
//                     fileName = value.substring(0, 25) + "...";
//                 else
//                     fileName = globalAssignment.testcases[currentIndex].name + "." + "java"
//             }
//             else if (globalAssignment.testcases[currentIndex].language == "c++") {
//                 image = `< img style = "height:20px; width:20px;" src = "../images/c-plus.svg" /> `;

//                 if (value.length >= 26)
//                     fileName = value.substring(0, 25) + "...";
//                 else
//                     fileName = globalAssignment.testcases[currentIndex].name + "." + "c++";
//             }
//             else {
//                 image = `< img style = "height:20px; width:20px;" src = "../images/python.svg" /> `;
//                 if (value.length >= 26)
//                     fileName = value.substring(0, 25) + "...";
//                 else
//                     fileName = globalAssignment.testcases[currentIndex].name + "." + "py";
//             }

//             let td = table.rows[currentIndex].getElementsByTagName("td");
//             td[0].innerHTML = `${image}${fileName} `;

//         });
//     }
//     else if (input.type == "textarea") {
//         input.addEventListener("keyup", (e) => {
//             let value = e.target.value;
//             globalAssignment.testcases[currentIndex][input.dataset.name] = value;
//         });
//     }
//     else if (input.type == "select-one") {
//         input.addEventListener("change", (e) => {
//             let value = e.target.options[input.selectedIndex].value.toLowerCase();

//             console.log(value);
//             console.log(input.selectedIndex);
//             if (value == 'c')
//                 globalAssignment.testcases[currentIndex][input.dataset.name] = 'c';
//             else if (value == 'c++')
//                 globalAssignment.testcases[currentIndex][input.dataset.name] = 'c++';
//             else if (value == 'python')
//                 globalAssignment.testcases[currentIndex][input.dataset.name] = 'py';
//             else if (value == 'java')
//                 globalAssignment.testcases[currentIndex][input.dataset.name] = 'java';


//             if (globalAssignment.testcases[currentIndex].language == "c") {
//                 image = `< img style = "height:20px; width:20px;" src = "../images/c.svg" /> `;

//                 if (globalAssignment.testcases[currentIndex].name.length >= 28)
//                     fileName = globalAssignment.testcases[currentIndex].name.substring(0, 25) + "...";
//                 else
//                     fileName = globalAssignment.testcases[currentIndex].name + "." + "c";
//             }
//             else if (globalAssignment.testcases[currentIndex].language == "java") {
//                 image = `< img style = "height:20px; width:20px;" src = "../images/java.svg" /> `;
//                 if (globalAssignment.testcases[currentIndex].name.length >= 28)
//                     fileName = globalAssignment.testcases[currentIndex].name.substring(0, 25) + "...";
//                 else
//                     fileName = globalAssignment.testcases[currentIndex].name + "." + "java"
//             }
//             else if (globalAssignment.testcases[currentIndex].language == "c++") {
//                 image = `< img style = "height:20px; width:20px;" src = "../images/c-plus.svg" /> `;

//                 if (globalAssignment.testcases[currentIndex].name.length >= 28)
//                     fileName = globalAssignment.testcases[currentIndex].name.substring(0, 25) + "...";
//                 else
//                     fileName = globalAssignment.testcases[currentIndex].name + "." + "c++";
//             }
//             else {
//                 image = `< img style = "height:20px; width:20px;" src = "../images/python.svg" /> `;
//                 if (globalAssignment.testcases[currentIndex].name.length >= 28)
//                     fileName = globalAssignment.testcases[currentIndex].name.substring(0, 25) + "...";
//                 else
//                     fileName = globalAssignment.testcases[currentIndex].name + "." + "py";
//             }

//             let td = table.rows[currentIndex].getElementsByTagName("td");
//             td[0].innerHTML = `${image}${fileName} `;

//         });
//     }
// }

// Configuration Form Fields
// let configFormFields = document.querySelectorAll("#config-form input");

// for (input of configFormFields) {
//     if (input.dataset.name == "individualTimeout") {

//         input.addEventListener("change", (e) => {
//             globalAssignment.testcases[currentIndex].config.timeout = e.target.value;
//         });
//     }

//     if (input.dataset.name == "testcaseWeights") {

//         input.addEventListener("change", (e) => {
//             globalAssignment.testcases[currentIndex].config.testcaseWeights = e.target.value;
//         });
//     }
// }

// Input Form Fields
// let inputFormFields = document.querySelectorAll("#input-form input");

// for (let input of inputFormFields) {
//     if (input.dataset.name == "inputText") {
//         input.addEventListener("change", (e) => {
//             globalAssignment.testcases[currentIndex].input.body = e.target.value;
//         })
//     }
// }

// // Output Form Fields
// let outputFormFields = document.querySelectorAll("#output-form input");

// for (let input of outputFormFields) {
//     if (input.dataset.name == "outputText") {
//         input.addEventListener("change", (e) => {
//             globalAssignment.testcases[currentIndex].input.body = e.target.value;
//         })
//     }
// }

// Configuration screen icon button
configButton.addEventListener("click", (e) => {
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
inputButton.addEventListener("click", (e) => {
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
outputButton.addEventListener("click", (e) => {
    let titleText = document.querySelector(".config-title");
    titleText.innerHTML = "Output";

    currentContainer.classList.remove("show-window");
    currentContainer = configContainer;
    currentContainer.classList.add("show-window");

    currentConfigContainer.classList.remove("show-window");
    currentConfigContainer = outputContainer;
    currentConfigContainer.classList.add("show-window");
})

addFileName.addEventListener("keydown", (e) => {

    let key = e.key.toLowerCase().charCodeAt(0);

    if (!((key >= 97 && key <= 122) || (key >= 48 && key <= 57) || key == 32 || key == 8)) {
        e.preventDefault();
        return;
    }

})


submitButton.addEventListener("click", (e) => {
    e.preventDefault();
    let name = document.getElementById("add-filename");
    let language = document.getElementById("add-language-select");
    let code = document.getElementById("add-code");

    addTestcaseRow({ name: name.value, language: language.value.toLowerCase(), code: code.value });

    name.value = "";
    language.selectedIndex = 0;
    code.value = "";

    currentContainer.classList.remove("show-window");
    currentContainer = instructionsContainer;
    currentContainer.classList.add("show-window");

    if (globalAssignment.testcases.length == 0)
        noItemsContainer.classList.add("show-window");
    else
        noItemsContainer.classList.remove("show-window");

});

document.addEventListener("click", function (event) {
    var isClickInside = mainContainer.contains(event.target) || globalIcons.contains(event.target);

    if (!isClickInside) {
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
globalSettingsButton.addEventListener("click", (e) => {
    currentContainer.classList.remove("show-window");
    currentContainer = globalSettingsContainer;
    currentContainer.classList.add("show-window");
    // populateGlobalSettings(); tbr
});

function populateGlobalSettings() {

    for (elem of document.getElementsByClassName("global_config"))
        elem.value = globalAssignment[elem.name];
    let assignmentNameField = document.getElementById("assignment-name");
    console.log(assignmentNameField.dataset.name);
    assignmentNameField.value = globalAssignment.assignmentName;

    let sourceFilesField = document.getElementById("source-files");

    sourceFilesField.value = globalAssignment.sourceFiles;

    let timeoutField = document.getElementById("global-timeout");

    timeoutField.value = globalAssignment.timeout;

    let testcaseWeights = document.getElementById("testcase-weights");

    testcaseWeights.value = globalAssignment.testcaseWeight;

    let totalPoints = document.getElementById("total-points");

    testcaseWeights.value = globalAssignment.totalPoints;

    let generateResultsField = document.getElementById("generate-results");

    generateResultsField.checked = globalAssignment.generateResults;

    let parallelGradingField = document.getElementById("parallel-grading");

    parallelGradingField.checked = globalAssignment.parallelGrading;

    let stdoutField = document.getElementById("stdout-grading");

    stdoutField.checked = globalAssignment.stdoutGrading;

    let memoryLeakField = document.getElementById("memory-leak");
    memoryLeakField.checked = globalAssignment.memoryLeak;

}


function populateIndividualConfig() {
    let individualConfigField = document.getElementById("time-out");

    individualConfigField.value = globalAssignment.testcases[currentIndex].config.timeout;

    let testcaseWeights = document.getElementById("testcase-weights");

    testcaseWeights.value = globalAssignment.testcases[currentIndex].config.testcaseWeight;
}

// $(function () {
//     $('[data-toggle="tooltip"]').tooltip()
// });

// $(function () {
//     $('[data-toggle="popover"]').popover();
// });


document.getElementById("confirmButton").addEventListener("click", (e) => {
    let name = globalAssignment.testcases[currentIndex].name;
    globalAssignment.testcases = globalAssignment.testcases.filter(testcase => testcase.name != name);
    currentRow.remove();
    currentContainer.classList.remove("show-window");
    currentContainer = instructionsContainer;
    currentContainer.classList.add("show-window");
    if (globalAssignment.testcases.length == 0)
        noItemsContainer.classList.add("show-window");
    else
        noItemsContainer.classList.remove("show-window");

    $('#exampleModalCenter').modal('hide');
})

inputButton.addEventListener("click", (e) => {
    let inputField = document.getElementById("input-code");
    inputField.value = globalAssignment.testcases[currentIndex].input;
})

outputButton.addEventListener("click", (e) => {
    let outputField = document.getElementById("input-code");
    outputField.value = globalAssignment.testcases[currentIndex].output;
})



/* Backend Code */
// File I/O Scripts


function saveAssignment() {
    console.log("SAVING ASSIGNMENT");
}


let exportButton = document.getElementById("export-container");


exportButton.addEventListener("click", (e) => {
    eel.export_assignment(globalAssignment.testcases, sessionStorage.getItem("index"));
});

if (sessionStorage.getItem("assignment-baseFile") != null) {
    zipButton.setAttribute("data-content", `< p > ${sessionStorage.getItem("assignment-baseFile")}</p > `);
}


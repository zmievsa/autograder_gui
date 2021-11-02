

function populateHomeworkArray(filesArray) {
    let output = "";
    filesArray.forEach((file, index) => {
        output += `<div class="checkbox-container">
        <input type="checkbox" class="check_box" id="checkbox${index}" />
        <label for="checkbox${index}"></label>
        <p class="checkbox_label">${file.name}</p>
    </div>`;
    });

    document.querySelector(".homework-checkbox-containers").innerHTML = output;
}

function populateResultsArray(files) {
    homeworkData = [];
    for (let file of files) {
        let obj = {};
        let fullFileName = file.name.split(".");
        obj.name = fullFileName[0];
        obj.extension = fullFileName[1];
        obj.state = true;
        homeworkData.push(obj);
    }

    createTable(homeworkData);
    showEmptyTable(homeworkData);

}
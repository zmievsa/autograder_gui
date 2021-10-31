eel.expose(populateHomeworkArray)
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

eel.expose(populateArray);
function populateArray(files) {

    for (let file of files) {
        let obj = {};
        let fullFileName = file.name.split(".");
        obj.name = fullFileName[0];
        obj.language = fullFileName[1];
        obj.code = file.body;
        obj.config = {
            timeout: "1",
            testcaseWeight: "test"
        };
        obj.input = "";
        obj.output = "";
        globalData.testcases.push(obj);
    }

    showEmptyTable(globalData.testcases);
    createTable(globalData.testcases);
};

eel.expose(populateHomeworkArray)
function populateHomeworkArray(files) {
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
const AVAILABLE_LANGUAGES = {
    "c": "text/x-csrc",
    "cpp": "text/x-c++src",
    "py": "python",
    "java": "text/x-java"
}
const MAX_TESTCASE_NAME_DISPLAY_LENGTH = 30;
// $(document).ready(function () {
//     window.resizeTo(1200, 900);
// });


function getSuffix(name) {
    let splitName = name.split(".");
    let suffix = splitName.length > 1 ? splitName[splitName.length - 1] : "";
    return suffix.toLowerCase();
}

function getTestcaseLanguageImage(name) {
    let suffix = getSuffix(name);
    if (AVAILABLE_LANGUAGES.hasOwnProperty(suffix))
        imgstem = suffix;
    else
        imgstem = "gear";
    return `<img style="height:20px; width:20px; margin-right: 5px" src="../images/${imgstem}.svg" />`;
}

function getTestcaseDisplayName(name) {
    if (name.length > MAX_TESTCASE_NAME_DISPLAY_LENGTH)
        return name.substring(0, MAX_TESTCASE_NAME_DISPLAY_LENGTH) + "...";
    else
        return name
}

function showContainer(currentContainer, container, alternativeContainer = null) {
    container = $(container);
    currentContainer.hide();
    if (container.is(currentContainer) && alternativeContainer)
        currentContainer = $(alternativeContainer);
    else
        currentContainer = container;
    currentContainer.show();
    return currentContainer;
}
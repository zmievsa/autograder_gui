let AVAILABLE_LANGUAGES = ["c", "cpp", "py", "java"]
// $(document).ready(function () {
//     window.resizeTo(1200, 900);
// });


function getTestcaseLanguageImage(name) {
    let splitName = name.split(".");
    let suffix = splitName.length > 1 ? splitName[splitName.length - 1] : "";
    suffix = suffix.toLowerCase();
    if (AVAILABLE_LANGUAGES.includes(suffix))
        imgstem = suffix;
    else
        imgstem = "gear";
    return `<img style="height:20px; width:20px; margin-right: 5px" src="../images/${imgstem}.svg" />`;
}

function getTestcaseDisplayName(name) {
    if (name.length >= 28)
        return name.substring(0, 25) + "...";
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
TESTHELPER_NAMES = ["PASS()", "FAIL()", "RESULT(0-100)", "CHECK_STDOUT()"];

const AVAILABLE_LANGUAGES = {
    "c": "text/x-csrc",
    "cpp": "text/x-c++src",
    "py": "python",
    "java": "text/x-java"
}
const MAX_TESTCASE_NAME_DISPLAY_LENGTH = 30;
const CODE_PLACEHOLDER = `
# Use PASS(), RESULT(0-100), FAIL(),
# and CHECK_STDOUT() to instruct
# autograder how to grade student's
# submission

def main():
    r = student_submission.any_function()

    EXPECTED_RESULT = 83
    if r == EXPECTED_RESULT:
        PASS()
    else:
        FAIL()


main()`.trim();
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

let currentContainer = null;
let currentSubContainer = null;
let currentTestcaseIndex = null;
let currentAssignment;

let ASSIGNMENT_ID_PREFIX = "ASS-"
let TESTCASE_ID_PREFIX = "TEST-"

$(document).ready(function () {
    eel.get_assignment()(loadAssignmentPage);
    currentContainer = $("#instructions-container");
    currentSubContainer = $("#edit-testcase-code");
    currentContainer.show();
});


$(window).bind('beforeunload', function () {
    saveAssignment();
});

function loadAssignmentPage(assignment) {
    console.log(assignment)
    currentAssignment = assignment;
    for (const testcase of assignment.testcases)
        addTestcaseRow(testcase);
    globalAssignment = assignment
    populateDocumentWithConfig(assignment.global_config);

    $(".cfgtooltip").hover(function () {
        const span = $(this).next("span");
        const top = ($(this).offset().top - span.height() * 0.6 - 200);
        span.css("top", `${top}px`);
        span.addClass("d-inline-table");
    }, function () {
        $(this).next("span").removeClass("d-inline-table");
    });

    $("#file-name").on("input", handleChangedFilename);
    $("#confirmButton").click(function () {
        $("#exampleModalCenter").modal('hide');
        getCurrentTestcaseRow().parent().remove();
        currentContainer = showContainer(currentContainer, "#instructions-container");
        currentAssignment.testcases.splice(currentTestcaseIndex, 1);
        currentTestcaseIndex = null;
    });
}

function handleChangedFilename(e) {
    let val = e.target.value.replace(" ", "").replace("\"", "").replace("'", ""); // Yeah, We could do it with a regex. But I'm tired.
    $(e.target).val(val);
    current_table_val = getCurrentTestcaseRow();
    current_table_val.attr("data-name", val);
    current_table_val.html(getTestcaseLanguageImage(val) + getTestcaseDisplayName(val));
    currentAssignment.testcases[currentTestcaseIndex].original_name = val;
    currentAssignment.testcases[currentTestcaseIndex].name = val;
}

async function saveAssignment() {
    saveCurrentTestcase();
    currentAssignment.global_config = gatherConfig("global-settings-content");
    await eel.save_assignment(currentAssignment)();
}

function gatherConfig(containerID) {
    let config = [];
    $("#" + containerID).find('input').each(function () {
        let elem = $(this);
        let type = elem.attr("type");
        let value = elem.val();
        value = type === "checkbox" ? this.checked : value;
        config.push({
            value: value,
            type: type,
            original_name: elem.attr("data-original_name"),
            key: elem.data("key"),
            is_per_testcase: elem.data("is_per_testcase"),
            is_list: elem.data("is_list"),
            section: elem.data("section")
        })
    });
    return config;
}

function populateDocumentWithConfig(config) {
    let globalConfigOutput = "";
    let perTestcaseConfigOutput = "";
    for (item of config) {
        if (item.type !== "checkbox") {
            if (item.is_per_testcase) {
                key = "Default " + item.key.toLowerCase();
                perTestcaseConfigOutput += newTextField(item, item.key, TESTCASE_ID_PREFIX);
            } else
                key = item.key;
            globalConfigOutput += newTextField(item, key, ASSIGNMENT_ID_PREFIX);
        }
        else {
            checked = item.value ? "checked" : "";
            if (item.is_per_testcase)
                perTestcaseConfigOutput += newCheckbox(item, "", TESTCASE_ID_PREFIX);
            globalConfigOutput += newCheckbox(item, checked, ASSIGNMENT_ID_PREFIX);
        }
    }
    $("#global-settings-content").html(globalConfigOutput);
    $("#testcase-config-content").html(perTestcaseConfigOutput);
}

function newTextField(item, key, idPrefix) {
    return `
        <div class="form-group">
            <i class="fas fa-info-circle text-primary cfgtooltip"></i><span class="tooltiptext">${item.description}</span>
            <label>${key}</label>
            <input id="${idPrefix}${item.original_name}"
                spellcheck="false"
                value="${item.value}"
                class="form-control"
                ${getMetadataAsDataset(item)}
                type="${item.type}"
                >
        </div>
    `
}

function newCheckbox(item, checked, idPrefix) {
    return `
            <div class="form-group">
                <i class="fas fa-info-circle text-primary cfgtooltip"></i><span class="tooltiptext">${item.description}</span>
                <span class="pr-2">${item.key}</span>
                <div class="custom-control custom-switch d-inline">
                    <input id="${idPrefix}${item.original_name}"
                        type="${item.type}"
                        class="custom-control-input"
                        ${getMetadataAsDataset(item)}
                        ${checked}
                    />
                    <label class="custom-control-label" for="${idPrefix}${item.original_name}"></label>
                </div>
            </div>
        `;
}

function getMetadataAsDataset(item) {
    return `
        data-original_name="${item.original_name}"
        data-key="${item.key}"
        data-is_per_testcase="${item.is_per_testcase}"
        data-is_list="${item.is_list}"
        data-section="${item.section}"
    `
}

function addTestcaseRow(item) {
    let tr = document.createElement("tr");
    tr.innerHTML = `<tr>
        <td data-action="row" data-name="${item.original_name}">
            ${getTestcaseLanguageImage(item.name)}${getTestcaseDisplayName(item.name)}
        </td>
        <td data-action="row" class="buttons">
            <i
            class="fas fa-trash fa-lg text-primary"
            data-action="delete"
            data-toggle="modal"
            data-target="#exampleModalCenter"></i>
        </td>
    </tr>
    `;
    $(tr).click(function () {
        chooseTestcase($(this).children(":first").attr('data-name'));
    })
    $(tr).css("cursor", "pointer");
    $("#testcase-table").append(tr);
}

function createTestcase() {
    let name = getUniqueTestcaseName();
    testcase = {
        name: name,
        original_name: name,
        text: "",
        input: "",
        output: "",
        config: getEmptyConfig(currentAssignment)
    }
    addTestcaseRow(testcase);
    currentAssignment.testcases.push(testcase);
}

function getEmptyConfig(assignment) {
    let config = [];
    for (const field of assignment.global_config)
        if (field.is_per_testcase) {
            config.push({
                value: "",
                type: field.type,
                original_name: field.original_name,
                key: field.key,
                is_list: field.is_list,
                is_per_testcase: field.is_per_testcase,
                section: field.section
            })
        }
    return config;
}

function getUniqueTestcaseName(name = null, n = "") {
    if (!name)
        name = "untitled_testcase";
    for (const t of currentAssignment.testcases)
        if (t.original_name.trim() === (name + n + ".py")) {
            n = n === "" ? 1 : n + 1;
            if (name)
                return getUniqueTestcaseName(name, n);
        }
    return name + n + ".py";
}

function getCurrentTestcaseRow() {
    let currentName = currentAssignment.testcases[currentTestcaseIndex].original_name;
    return $("#testcase-table").find(`[data-name='${currentName}']`);
}

function chooseTestcase(name) {
    testcase = currentAssignment.testcases.find(t => t.name === name);
    if (!testcase)
        window.alert("SOMETHING BROKE TERRIBLY. Please, restart autograder and try again or contact the author.");
    if (currentAssignment.testcases.indexOf(testcase) !== currentTestcaseIndex) {
        if (currentTestcaseIndex !== null) {
            getCurrentTestcaseRow().parent().css("background-color", "");
            saveCurrentTestcase();
        }
        $("#file-name").val(name);
        $("#edit-code").val(testcase.text);
        $("#input-code").val(testcase.input);
        $("#output-code").val(testcase.output);
        for (const entry of testcase.config) {
            let id = "#" + TESTCASE_ID_PREFIX + entry.original_name;
            let elem = $(id);
            if (entry.type === "checkbox")
                elem.prop("checked", entry.value);
            else
                elem.val(entry.value);
        }
        currentTestcaseIndex = currentAssignment.testcases.indexOf(testcase);
        getCurrentTestcaseRow().parent().css("background-color", "#e5f4fa");
    }
    currentContainer = showContainer(currentContainer, '#edit-testcase-container');
    currentSubContainer = showContainer(currentSubContainer, '#edit-testcase-code');
}

function saveCurrentTestcase() {
    let name = $("#file-name").val();
    new_testcase = {
        "name": name,
        "original_name": name,
        "text": $("#edit-code").val(),
        "input": $("#output-code").val(),
        "output": $("#input-code").val(),
        "config": gatherConfig("testcase-config-content")
    };
    currentAssignment.testcases[currentTestcaseIndex] = new_testcase;

}
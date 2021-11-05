let currentContainer = null;
let HOMEWORKS = null;

CHECKBOX_PREFIX = "checkbox";


$(document).ready(function () {
    eel.get_homeworks()(loadHomeworksPage);
});

$(window).bind('beforeunload', function () {
    eel.save_homeworks(HOMEWORKS);
});


function loadHomeworksPage(homeworks) {
    if (homeworks)
        createHomeworksTable(homeworks);
    HOMEWORKS = homeworks;
    $(".check_box").click(function (e) {
        let id = e.target.id.slice(CHECKBOX_PREFIX.length + 1);
        HOMEWORKS[id].enabled = e.target.checked;
    });

}


// Creates the table on initial page load
function createHomeworksTable(items, idPrefix) {
    let output = "";
    for (let i = 0; i < items.length; i++) {
        let checked = items[i].enabled ? "checked" : "";
        output += `
        <tr>
            <td data-action="row">
                <input class="check_box" type="checkbox" id="${idPrefix}${i}" ${checked} />
                <label for="${idPrefix}${i}"></label>
                ${getTestcaseLanguageImage(items[i].name)}${getTestcaseDisplayName(items[i].name)}
            </td>
        </tr>
        `;
    }
    $("#homework-table").html(output);

    if (items)
        currentContainer = $("#main-table");
    else
        currentContainer = $("#no-items-container");
    currentContainer.show();
}

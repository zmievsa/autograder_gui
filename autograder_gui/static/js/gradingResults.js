$(document).ready(async function () {
    $(".loading-text").show();
    let results
    eel.autograder_run()().then(r => {
        results = r
    }).catch(e => {
        if (e && e.error) {
            showError(e.error)
        }
        if (e && e.errorText) {
            showError(e.errorText)
        }
    })
    if (!results) {
        return
    }
    $(".loading-text").hide();
    console.log(results);
    let output = "";
    output += `<thead>
        <tr>
            <th>Testcases</th>
            <th>Grade</th>
        </tr>
    </thead>`;

    for (let file of results.submissions) {
        output += `<tr>
                        <td>${file.submission} </td>
                        <td>${file.final_grade}% </td>
                    </tr>`;
    }
    $(".table-content").html(output);
});

function exportGradingResults() {
    eel.export_grading_results()()
        .catch(e => {
            if (e && e.error) {
                showError(e.error)
            }
            if (e && e.errorText) {
                showError(e.errorText)
            }
        })

}


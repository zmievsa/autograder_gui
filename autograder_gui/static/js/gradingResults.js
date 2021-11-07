$(document).ready(async function () {
    $(".loading-text").show();
    let results = await eel.autograder_run()();
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


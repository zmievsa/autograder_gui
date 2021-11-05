$(document).ready(async function () {
    let results = await eel.autograder_run()();
    console.log(results);
    let output = "";
    for (let file of results.submissions) {
        output += `<tr>
                        <td>${file.submission} </td>
                        <td>${file.final_grade}% </td>
                    </tr>`;
    }
    $(".table-content").html(output);
});



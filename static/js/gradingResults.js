let array =
{
    average_score: 58,
    total_points_possible: 100,

    submissions: [
        {
            submission: "/home/ovsyanka/code/autograder-test/autograder/examples/fibonacci_c/average_student_homework.c",
            final_grade: 75,
            testcase_scores: [
                {
                    "name": "Test output",
                    "message": "50/50"
                },
                {
                    "name": "Test result",
                    "message": "100.0/100"
                },
                {
                    "name": "Test time",
                    "message": "Exceeded Time Limit"
                }
            ],
            precompilation_error: ""
        },
        {
            submission: "/home/ovsyanka/code/autograder-test/autograder/examples/fibonacci_c/failing_student_homework.c",
            final_grade: 0,
            testcase_scores: [],
            precompilation_error: "Failed to precompile:\n/.../failing_student_homework.c: In function ‘fibonacci’:\n.../failing_student_homework.c:2:15: error: ‘P’ undeclared (first use in this function)\n    2 |    if (n <= 1)P\n      |               ^\n.../failing_student_homework.c:2:15: note: each undeclared identifier is reported only once for each function it appears in\n.../failing_student_homework.c:2:16: error: expected ‘;’ before ‘return’\n    2 |    if (n <= 1)P\n      |                ^\n      |                ;\n    3 |       return n;\n      |       ~~~~~~    \n.../failing_student_homework.c:4:11: warning: implicit declaration of function ‘fib’ [-Wimplicit-function-declaration]\n    4 |    return fib(n-1) + fib(n-2);\n      |           ^~~"
        },
        {
            submission: "/home/ovsyanka/code/autograder-test/autograder/examples/fibonacci_c/perfect_student_homework.c",
            final_grade: 100,
            testcase_scores: [
                {
                    "name": "Test output",
                    "message": "50/50"
                },
                {
                    "name": "Test result",
                    "message": "100.0/100"
                },
                {
                    "name": "Test time",
                    "message": "Exceeded Time Limit"
                }
            ],
            precompilation_error: ""
        }

    ]
};


let table = document.querySelector(".table-content");

let output = "";


for (let file of array.submissions) {
    let filename = file.submission.split("/");
    filename = filename[filename.length - 1];


    output += `<tr>
                    <td>${filename} </td>
                    <td>${file.final_grade}% </td>
                </tr>`;

}
table.innerHTML = output;


function populateArray() {
    console.log("POPULATING RESULTS ARRAY");
}

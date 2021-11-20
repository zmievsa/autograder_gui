function handleAssignment() {
    eel.extract_assignment()(r => {
        if (r) {
            location.href = 'assignment-configuration.html'
        }
    });
}

function handleCreateAssignment() {
    eel.create_assignment()(r => {
        if (r) {
            location.href = 'assignment-configuration.html'
        }
    });
}
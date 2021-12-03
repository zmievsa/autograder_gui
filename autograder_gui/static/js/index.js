async function handleAssignment() {
    eel.extract_assignment()().then(r => {
        location.href = 'assignment-configuration.html'
    }).catch(e => {
        if (e && e.error) {
            showError(e.error)
        }
        if (e && e.errorText) {
            showError(e.errorText)
        }
    })
}

function handleCreateAssignment() {
    eel.create_assignment()().then(() => {
        location.href = 'assignment-configuration.html'
    }).catch(e => {
        if (e && e.error) {
            showError(e.error)
        }
        if (e && e.errorText) {
            showError(e.errorText)
        }
    })
}
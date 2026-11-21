'use strict';

const form = document.getElementById('session-form');
const rowsElement = document.getElementById('session-rows');
const messageElement = document.getElementById('message');
const assessmentSelect = document.getElementById('assessment-id');

let studySessions = [];
let assessments = [];

function showMessage(message, isError = false) {
    messageElement.textContent = message;
    messageElement.className = isError ? 'danger' : '';
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Request failed.');
    }

    return result;
}

function createCell(row, value) {
    const cell = document.createElement('td');
    cell.textContent = String(value ?? '');
    row.appendChild(cell);
}

function resetForm() {
    form.reset();
    document.getElementById('session-id').value = '';
    document.getElementById('form-heading').textContent =
        'Add Study Session';
}

function editStudySession(item) {
    document.getElementById('session-id').value =
        item.session_id;
    assessmentSelect.value = item.assessment_id;
    document.getElementById('session-date').value =
        item.session_date;
    document.getElementById('duration-min').value =
        item.duration_min;
    document.getElementById('productivity').value =
        item.productivity ?? '';

    document.getElementById('form-heading').textContent =
        'Edit Study Session';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteStudySession(item) {
    if (!confirm(
        'Delete study session on ' + item.session_date +
        ' for "' + item.assessment_title + '"? This cannot be undone.'
    )) {
        return;
    }

    try {
        await apiRequest(
            '/api/study-sessions/' +
                encodeURIComponent(item.session_id),
            { method: 'DELETE' }
        );

        showMessage('Study session deleted.');
        resetForm();
        await loadStudySessions();
    } catch (error) {
        showMessage(error.message, true);
    }
}

function renderTable() {
    rowsElement.replaceChildren();

    for (const item of studySessions) {
        const row = document.createElement('tr');

        createCell(row, item.course_name);
        createCell(row, item.assessment_title);
        createCell(row, item.session_date);
        createCell(row, item.duration_min);
        createCell(row, item.productivity ?? '-');

        const actions = document.createElement('td');

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            editStudySession(item);
        });

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            deleteStudySession(item);
        });

        actions.append(editButton, deleteButton);
        row.appendChild(actions);
        rowsElement.appendChild(row);
    }
}

function refreshAssessments() {
    const selected = assessmentSelect.value;

    assessmentSelect.replaceChildren(
        new Option('Choose an assessment', '')
    );

    for (const item of assessments) {
        assessmentSelect.add(
            new Option(
                item.course_name + ' — ' + item.title,
                item.assessment_id
            )
        );
    }

    if (assessments.some(item => item.assessment_id === selected)) {
        assessmentSelect.value = selected;
    }
}

async function loadStudySessions() {
    const [sessionData, assessmentData] = await Promise.all([
        apiRequest('/api/study-sessions'),
        apiRequest('/api/assessments')
    ]);

    studySessions = sessionData;
    assessments = assessmentData;
    refreshAssessments();
    renderTable();
}

document.getElementById('cancel-edit')
    .addEventListener('click', resetForm);

form.addEventListener('submit', async event => {
    event.preventDefault();

    const sessionId =
        document.getElementById('session-id').value;

    const productivityValue =
        document.getElementById('productivity').value;

    const data = {
        assessment_id: assessmentSelect.value,
        session_date: document.getElementById('session-date').value,
        duration_min: document.getElementById('duration-min').value,
        productivity: productivityValue === '' ? null : productivityValue
    };

    try {
        await apiRequest(
            sessionId
                ? '/api/study-sessions/' +
                    encodeURIComponent(sessionId)
                : '/api/study-sessions',
            {
                method: sessionId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        );

        showMessage(
            sessionId
                ? 'Study session updated successfully.'
                : 'Study session created successfully.'
        );

        resetForm();
        await loadStudySessions();
    } catch (error) {
        showMessage(error.message, true);
    }
});

loadStudySessions().catch(error => {
    showMessage(error.message, true);
});
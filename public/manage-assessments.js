
'use strict';

const form = document.getElementById('assessment-form');
const rowsElement = document.getElementById('assessment-rows');
const messageElement = document.getElementById('message');
const courseSelect = document.getElementById('course-id');
const prerequisiteSelect = document.getElementById('prerequisite');

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

function refreshPrerequisites() {
    const courseId = courseSelect.value;
    const editingId = document.getElementById('assessment-id').value;
    const previousValue = prerequisiteSelect.value;

    prerequisiteSelect.replaceChildren(
        new Option('None', '')
    );

    assessments
        .filter(item =>
            item.course_id === courseId &&
            item.assessment_id !== editingId
        )
        .forEach(item => {
            prerequisiteSelect.add(
                new Option(item.title, item.assessment_id)
            );
        });

    if ([...prerequisiteSelect.options].some(
        option => option.value === previousValue
    )) {
        prerequisiteSelect.value = previousValue;
    }
}

function resetForm() {
    form.reset();
    document.getElementById('assessment-id').value = '';
    document.getElementById('form-heading').textContent =
        'Add Assessment';
    refreshPrerequisites();
}

function editAssessment(item) {
    document.getElementById('assessment-id').value =
        item.assessment_id;
    document.getElementById('title').value = item.title;
    courseSelect.value = item.course_id;
    document.getElementById('weight').value =
        item.weight_percentage;
    document.getElementById('due-date').value =
        item.due_date;

    refreshPrerequisites();

    prerequisiteSelect.value =
        item.prereq_assessment_id || '';

    document.getElementById('form-heading').textContent =
        'Edit Assessment';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteAssessment(item) {
    if (!confirm(
        'Delete "' + item.title + '"? This cannot be undone.'
    )) {
        return;
    }

    try {
        await apiRequest(
            '/api/assessments/' +
                encodeURIComponent(item.assessment_id),
            { method: 'DELETE' }
        );

        showMessage('Assessment deleted.');
        resetForm();
        await loadAssessments();
    } catch (error) {
        showMessage(error.message, true);
    }
}

function renderTable() {
    rowsElement.replaceChildren();

    for (const item of assessments) {
        const row = document.createElement('tr');

        createCell(row, item.title);
        createCell(row, item.course_name);
        createCell(row, item.weight_percentage + '%');
        createCell(row, item.due_date);

        const actions = document.createElement('td');

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            editAssessment(item);
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            deleteAssessment(item);
        });

        actions.append(editButton, deleteButton);
        row.appendChild(actions);
        rowsElement.appendChild(row);
    }
}

function refreshCourses() {
    const selected = courseSelect.value;

    const courses = new Map();

    for (const item of assessments) {
        courses.set(item.course_id, item.course_name);
    }

    courseSelect.replaceChildren(
        new Option('Choose a course', '')
    );

    for (const [id, name] of courses) {
        courseSelect.add(new Option(name, id));
    }

    if (courses.has(selected)) {
        courseSelect.value = selected;
    }

    refreshPrerequisites();
}

async function loadAssessments() {
    assessments = await apiRequest('/api/assessments');
    refreshCourses();
    renderTable();
}

courseSelect.addEventListener('change', refreshPrerequisites);

document.getElementById('cancel-edit')
    .addEventListener('click', resetForm);

form.addEventListener('submit', async event => {
    event.preventDefault();

    const assessmentId =
        document.getElementById('assessment-id').value;

    const data = {
        title: document.getElementById('title').value,
        course_id: courseSelect.value,
        weight_percentage:
            document.getElementById('weight').value,
        due_date: document.getElementById('due-date').value,
        prereq_assessment_id:
            prerequisiteSelect.value || null
    };

    try {
        await apiRequest(
            assessmentId
                ? '/api/assessments/' +
                    encodeURIComponent(assessmentId)
                : '/api/assessments',
            {
                method: assessmentId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        );

        showMessage(
            assessmentId
                ? 'Assessment updated successfully.'
                : 'Assessment created successfully.'
        );

        resetForm();
        await loadAssessments();
    } catch (error) {
        showMessage(error.message, true);
    }
});

loadAssessments().catch(error => {
    showMessage(error.message, true);
});

const API_URL = '/students';

// DOM Elements
const studentTableBody = document.getElementById('studentTableBody');
const studentTable = document.getElementById('studentTable');
const emptyState = document.getElementById('emptyState');
const studentCount = document.getElementById('studentCount');
const studentModal = document.getElementById('studentModal');
const addStudentBtn = document.getElementById('addStudentBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const studentForm = document.getElementById('studentForm');
const modalTitle = document.getElementById('modalTitle');
const formMode = document.getElementById('formMode');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');

// Form Inputs
const inputId = document.getElementById('studentId');
const inputName = document.getElementById('studentName');
const inputAge = document.getElementById('studentAge');
const inputCourse = document.getElementById('studentCourse');

// State
let students = [];

// Initialize
document.addEventListener('DOMContentLoaded', fetchStudents);

// Event Listeners
addStudentBtn.addEventListener('click', openAddModal);
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
studentForm.addEventListener('submit', handleFormSubmit);

// Close modal when clicking outside
studentModal.addEventListener('click', (e) => {
    if (e.target === studentModal) {
        closeModal();
    }
});

// API Calls
async function fetchStudents() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch students');
        
        students = await response.json();
        renderStudents();
    } catch (error) {
        showToast('Error loading students', 'error');
        console.error(error);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const studentData = {
        id: parseInt(inputId.value),
        name: inputName.value,
        age: parseInt(inputAge.value),
        course: inputCourse.value
    };

    const isEditMode = formMode.value === 'edit';

    try {
        const method = isEditMode ? 'PUT' : 'POST';
        const url = isEditMode ? `${API_URL}/${studentData.id}` : API_URL;
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to save student');
        }

        showToast(isEditMode ? 'Student updated successfully!' : 'Student added successfully!');
        closeModal();
        fetchStudents();
        
    } catch (error) {
        showToast(error.message, 'error');
        console.error(error);
    }
}

async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete student');
        
        showToast('Student deleted successfully!');
        fetchStudents();
        
    } catch (error) {
        showToast(error.message, 'error');
        console.error(error);
    }
}

// UI Rendering
function renderStudents() {
    studentCount.textContent = students.length;
    
    if (students.length === 0) {
        studentTable.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    studentTable.style.display = 'table';
    emptyState.style.display = 'none';
    
    studentTableBody.innerHTML = '';
    
    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${student.id}</td>
            <td style="font-weight: 500;">${student.name}</td>
            <td>${student.age}</td>
            <td>${student.course}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn-edit" onclick="openEditModal(${student.id})">Edit</button>
                    <button class="btn-danger btn" onclick="deleteStudent(${student.id})">Delete</button>
                </div>
            </td>
        `;
        studentTableBody.appendChild(row);
    });
}

// Modal Management
function openAddModal() {
    modalTitle.textContent = 'Add New Student';
    formMode.value = 'add';
    studentForm.reset();
    inputId.readOnly = false;
    studentModal.classList.add('active');
}

window.openEditModal = function(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    modalTitle.textContent = 'Edit Student';
    formMode.value = 'edit';
    
    inputId.value = student.id;
    inputId.readOnly = true; // Don't allow changing ID on edit
    inputName.value = student.name;
    inputAge.value = student.age;
    inputCourse.value = student.course;
    
    studentModal.classList.add('active');
}

function closeModal() {
    studentModal.classList.remove('active');
}

// Toast Notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    if (type === 'error') {
        toast.classList.add('error');
        toastIcon.textContent = '✕';
    } else {
        toast.classList.remove('error');
        toastIcon.textContent = '✓';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

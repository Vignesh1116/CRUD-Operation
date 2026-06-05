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

const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIconLight = document.getElementById('themeIconLight');
const themeIconDark = document.getElementById('themeIconDark');

// Form Inputs
const inputId = document.getElementById('studentId');
const inputName = document.getElementById('studentName');
const inputAge = document.getElementById('studentAge');
const inputCourse = document.getElementById('studentCourse');

// State
let students = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchStudents();
});

// Event Listeners
addStudentBtn.addEventListener('click', openAddModal);
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
studentForm.addEventListener('submit', handleFormSubmit);
if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(currentTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
        themeIconLight.style.display = 'none';
        themeIconDark.style.display = 'block';
    } else {
        themeIconLight.style.display = 'block';
        themeIconDark.style.display = 'none';
    }
}

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

        showToast(isEditMode ? 'Student updated successfully' : 'Student added successfully');
        closeModal();
        fetchStudents();
        
    } catch (error) {
        showToast(error.message, 'error');
        console.error(error);
    }
}

async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student record?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete student');
        
        showToast('Student deleted successfully');
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
            <td style="font-weight: 500;">${student.id}</td>
            <td>${student.name}</td>
            <td>${student.age}</td>
            <td>
                <span class="badge badge-light">${student.course}</span>
            </td>
            <td class="text-right">
                <button class="btn btn-icon edit-icon" onclick="openEditModal(${student.id})" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn btn-icon" onclick="deleteStudent(${student.id})" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
        `;
        studentTableBody.appendChild(row);
    });
}

// Modal Management
function openAddModal() {
    modalTitle.textContent = 'Create Student';
    formMode.value = 'add';
    studentForm.reset();
    inputId.readOnly = false;
    studentModal.classList.add('show');
}

window.openEditModal = function(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    modalTitle.textContent = 'Edit Student';
    formMode.value = 'edit';
    
    inputId.value = student.id;
    inputId.readOnly = true; 
    inputName.value = student.name;
    inputAge.value = student.age;
    inputCourse.value = student.course;
    
    studentModal.classList.add('show');
}

function closeModal() {
    studentModal.classList.remove('show');
}

// Toast Notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    const iconSvg = type === 'error' 
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    
    document.getElementById('toastIcon').innerHTML = iconSvg;
    
    if (type === 'error') {
        toast.classList.add('error');
    } else {
        toast.classList.remove('error');
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

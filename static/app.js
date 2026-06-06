// Auth Check
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/static/login.html';
}

const API_URL = '/students';

// DOM Elements
const studentTableBody = document.getElementById('studentTableBody');
const studentTable = document.getElementById('studentTable');
const emptyState = document.getElementById('emptyState');
const studentForm = document.getElementById('studentForm');
const formTitle = document.getElementById('formTitle');
const formSubtitle = document.getElementById('formSubtitle');
const formMode = document.getElementById('formMode');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const refreshBtn = document.getElementById('refreshBtn');

const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIconLight = document.getElementById('themeIconLight');
const themeIconDark = document.getElementById('themeIconDark');

// Modal Elements
const confirmModal = document.getElementById('confirmModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Auth Elements
const logoutBtn = document.getElementById('logoutBtn');
const userNameDisplay = document.getElementById('userNameDisplay');
const userAvatar = document.getElementById('userAvatar');

// Form Inputs
const inputId = document.getElementById('studentId');
const inputName = document.getElementById('studentName');
const inputAge = document.getElementById('studentAge');
const inputCourse = document.getElementById('studentCourse');

// State
let students = [];
let studentToDelete = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    decodeTokenAndDisplayUser();
    fetchStudents();
});

// Event Listeners
studentForm.addEventListener('submit', handleFormSubmit);
refreshBtn.addEventListener('click', fetchStudents);
cancelBtn.addEventListener('click', resetForm);
if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

cancelDeleteBtn.addEventListener('click', closeConfirmModal);
confirmDeleteBtn.addEventListener('click', executeDelete);

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/static/login.html';
    });
}

function decodeTokenAndDisplayUser() {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const username = payload.sub;
        userNameDisplay.textContent = username;
        userAvatar.textContent = username.charAt(0).toUpperCase();
    } catch (e) {
        console.error("Invalid token");
    }
}

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

// Intercept fetch calls
async function apiFetch(url, options = {}) {
    if (!options.headers) {
        options.headers = {};
    }
    options.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
    
    const response = await fetch(url, options);
    
    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/static/login.html';
        throw new Error('Authentication expired. Please login again.');
    }
    
    return response;
}

// API Calls
async function fetchStudents() {
    try {
        const response = await apiFetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch students');
        
        students = await response.json();
        renderTable();
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
        
        const response = await apiFetch(url, {
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

        showToast(isEditMode ? 'Student record updated' : 'New student added');
        resetForm();
        fetchStudents();
        
    } catch (error) {
        showToast(error.message, 'error');
        console.error(error);
    }
}

// Modal handling for Delete
window.deleteStudent = function(id) {
    studentToDelete = id;
    confirmModal.classList.add('active');
}

function closeConfirmModal() {
    confirmModal.classList.remove('active');
    studentToDelete = null;
}

async function executeDelete() {
    if (studentToDelete === null) return;
    
    try {
        const response = await apiFetch(`${API_URL}/${studentToDelete}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete student');
        
        showToast('Student deleted');
        
        if (formMode.value === 'edit' && parseInt(inputId.value) === studentToDelete) {
            resetForm();
        }
        
        closeConfirmModal();
        fetchStudents();
        
    } catch (error) {
        showToast(error.message, 'error');
        console.error(error);
        closeConfirmModal();
    }
}

// UI Rendering
function renderTable() {
    if (students.length === 0) {
        studentTable.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    studentTable.style.display = 'table';
    emptyState.style.display = 'none';
    
    studentTableBody.innerHTML = '';
    
    students.forEach((student, index) => {
        const row = document.createElement('tr');
        row.className = 'row-enter';
        // Add staggered delay
        row.style.animationDelay = `${index * 0.05}s`;
        
        row.innerHTML = `
            <td><span class="id-badge">${student.id}</span></td>
            <td class="student-name">${student.name}</td>
            <td>${student.course}</td>
            <td>${student.age}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action edit" onclick="populateEditForm(${student.id})">Edit</button>
                    <button class="btn-action delete" onclick="deleteStudent(${student.id})">Delete</button>
                </div>
            </td>
        `;
        studentTableBody.appendChild(row);
    });
}

// Form Management (No Modals)
window.populateEditForm = function(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    formTitle.textContent = 'Edit Student Record';
    formSubtitle.textContent = `Updating information for ${student.name}`;
    formMode.value = 'edit';
    saveBtn.textContent = 'Update Record';
    cancelBtn.style.display = 'inline-flex';
    
    inputId.value = student.id;
    inputId.readOnly = true; 
    inputName.value = student.name;
    inputAge.value = student.age;
    inputCourse.value = student.course;
    
    if (window.innerWidth <= 900) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function resetForm() {
    studentForm.reset();
    formMode.value = 'add';
    inputId.readOnly = false;
    
    formTitle.textContent = 'Student Registration';
    formSubtitle.textContent = 'Add a new student or update an existing record.';
    saveBtn.textContent = 'Save Record';
    cancelBtn.style.display = 'none';
}

// Toast Notification
let toastTimeout;

function showToast(message, type = 'success') {
    clearTimeout(toastTimeout);
    
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
    
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

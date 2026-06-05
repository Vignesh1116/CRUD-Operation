const API_URL = '/students';

// DOM Elements
const studentTableBody = document.getElementById('studentTableBody');
const studentTable = document.getElementById('studentTable');
const emptyState = document.getElementById('emptyState');
const studentCountBadge = document.getElementById('studentCountBadge');
const visibleCount = document.getElementById('visibleCount');
const studentModal = document.getElementById('studentModal');
const addStudentBtn = document.getElementById('addStudentBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const studentForm = document.getElementById('studentForm');
const modalTitle = document.getElementById('modalTitle');
const formMode = document.getElementById('formMode');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const tableSearchInput = document.getElementById('tableSearchInput');

// KPI Elements
const kpiTotalStudents = document.getElementById('kpiTotalStudents');
const kpiActiveCourses = document.getElementById('kpiActiveCourses');
const kpiAvgAge = document.getElementById('kpiAvgAge');

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
let filteredStudents = [];
let chartInstance = null;

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
tableSearchInput.addEventListener('input', handleSearch);

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(currentTheme);
    if(chartInstance) updateChartTheme();
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
        filteredStudents = [...students];
        
        updateDashboard();
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

        showToast(isEditMode ? 'Student record updated' : 'New student added');
        closeModal();
        tableSearchInput.value = ''; // clear search on add/edit
        fetchStudents();
        
    } catch (error) {
        showToast(error.message, 'error');
        console.error(error);
    }
}

window.deleteStudent = async function(id) {
    if (!confirm('Are you sure you want to delete this student record? This action cannot be undone.')) return;
    
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

// Core Logic
function updateDashboard() {
    renderTable();
    updateKPIs();
    renderChart();
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm) || 
        student.course.toLowerCase().includes(searchTerm) ||
        student.id.toString().includes(searchTerm)
    );
    renderTable();
}

// UI Rendering
function renderTable() {
    studentCountBadge.textContent = `${students.length} total`;
    visibleCount.textContent = filteredStudents.length;
    
    if (filteredStudents.length === 0) {
        studentTable.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    studentTable.style.display = 'table';
    emptyState.style.display = 'none';
    
    studentTableBody.innerHTML = '';
    
    filteredStudents.forEach(student => {
        // Dynamic badge color based on course name hash
        const badgeClass = getBadgeColor(student.course);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight: 500; color: var(--text-primary);">#${student.id}</td>
            <td style="font-weight: 500;">${student.name}</td>
            <td>${student.age} yrs</td>
            <td>
                <span class="badge ${badgeClass}">${student.course}</span>
            </td>
            <td>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <div style="width:8px; height:8px; border-radius:50%; background-color:var(--success-color)"></div>
                    Enrolled
                </div>
            </td>
            <td class="text-right">
                <button class="btn btn-icon edit-icon" onclick="openEditModal(${student.id})" title="Edit Record">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn btn-icon delete-icon" onclick="deleteStudent(${student.id})" title="Delete Record">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
        `;
        studentTableBody.appendChild(row);
    });
}

function updateKPIs() {
    kpiTotalStudents.textContent = students.length;
    
    const uniqueCourses = new Set(students.map(s => s.course)).size;
    kpiActiveCourses.textContent = uniqueCourses;
    
    if(students.length > 0) {
        const totalAge = students.reduce((sum, s) => sum + s.age, 0);
        kpiAvgAge.textContent = Math.round(totalAge / students.length);
    } else {
        kpiAvgAge.textContent = "0";
    }
}

function renderChart() {
    const ctx = document.getElementById('courseChart').getContext('2d');
    
    // Aggregate data
    const courseCounts = {};
    students.forEach(s => {
        courseCounts[s.course] = (courseCounts[s.course] || 0) + 1;
    });
    
    const labels = Object.keys(courseCounts);
    const data = Object.values(courseCounts);
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#1e293b' : '#e2e8f0';

    if (chartInstance) {
        chartInstance.data.labels = labels;
        chartInstance.data.datasets[0].data = data;
        chartInstance.update();
        return;
    }

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Enrolled Students',
                data: data,
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, color: textColor },
                    grid: { color: gridColor, drawBorder: false }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { display: false, drawBorder: false }
                }
            }
        }
    });
}

function updateChartTheme() {
    if(!chartInstance) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#1e293b' : '#e2e8f0';
    
    chartInstance.options.scales.y.ticks.color = textColor;
    chartInstance.options.scales.y.grid.color = gridColor;
    chartInstance.options.scales.x.ticks.color = textColor;
    chartInstance.update();
}

// Helpers
function getBadgeColor(courseName) {
    const badges = ['badge-blue', 'badge-success', 'badge-warning', 'badge-purple'];
    // Simple hash to consistently assign a color to a specific course
    let hash = 0;
    for (let i = 0; i < courseName.length; i++) {
        hash = courseName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return badges[Math.abs(hash) % badges.length];
}

// Modal Management
function openAddModal() {
    modalTitle.textContent = 'Create Student Record';
    formMode.value = 'add';
    studentForm.reset();
    inputId.readOnly = false;
    studentModal.classList.add('show');
}

window.openEditModal = function(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    modalTitle.textContent = 'Edit Student Record';
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

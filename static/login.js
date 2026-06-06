document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (localStorage.getItem('token')) {
        window.location.href = '/';
        return;
    }
});

const authForm = document.getElementById('authForm');
const authMode = document.getElementById('authMode');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authError = document.getElementById('authError');

const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

window.switchTab = function(mode) {
    authMode.value = mode;
    authError.style.display = 'none';
    
    if (mode === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        authSubmitBtn.textContent = 'Sign In';
    } else {
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        authSubmitBtn.textContent = 'Create Account';
    }
}

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.style.display = 'none';
    
    const mode = authMode.value;
    const username = usernameInput.value;
    const password = passwordInput.value;
    
    if (mode === 'login') {
        // OAuth2 expects form data
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        try {
            const response = await fetch('/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Login failed');
            }
            
            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            window.location.href = '/';
            
        } catch (error) {
            authError.textContent = error.message;
            authError.style.display = 'block';
        }
    } else {
        // Register expects JSON
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Registration failed');
            }
            
            showToast('Account created successfully! Please sign in.');
            switchTab('login');
            passwordInput.value = '';
            
        } catch (error) {
            authError.textContent = error.message;
            authError.style.display = 'block';
        }
    }
});

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

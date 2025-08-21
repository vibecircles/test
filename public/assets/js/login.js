// Login Page functionality
class LoginPage {
    constructor() {
        this.api = new VibeCirclesAPI();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Login form submission
        const loginForm = document.querySelector('.theme-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Login button click
        const loginBtn = document.querySelector('.theme-form .btn-section .btn.btn-solid');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Password visibility toggle
        const passwordInput = document.getElementById('exampleInputPassword1');
        const eyeIcon = passwordInput?.nextElementSibling;
        if (eyeIcon && eyeIcon.getAttribute('data-feather') === 'eye') {
            eyeIcon.addEventListener('click', () => {
                this.togglePasswordVisibility(passwordInput, eyeIcon);
            });
        }

        // Social login buttons (placeholders)
        const socialButtons = document.querySelectorAll('.social-links a');
        socialButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNotification('Social login not implemented yet', 'info');
            });
        });
    }

    async handleLogin() {
        const email = document.getElementById('exampleInputEmail1').value.trim();
        const password = document.getElementById('exampleInputPassword1').value;
        const rememberMe = document.getElementById('exampleCheck1')?.checked || false;

        // Validation
        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        try {
            // Show loading state
            const loginBtn = document.querySelector('.theme-form .btn-section .btn.btn-solid');
            const originalText = loginBtn.textContent;
            loginBtn.textContent = 'Logging in...';
            loginBtn.disabled = true;

            // Call API
            const response = await this.api.auth.login(email, password);

            if (response.success) {
                // Store token
                if (rememberMe) {
                    localStorage.setItem('token', response.token);
                } else {
                    sessionStorage.setItem('token', response.token);
                }

                // Store user info
                localStorage.setItem('user', JSON.stringify(response.user));

                this.showNotification('Login successful!', 'success');
                
                // Redirect to index page
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.showNotification(response.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        } finally {
            // Reset button state
            const loginBtn = document.querySelector('.theme-form .btn-section .btn.btn-solid');
            loginBtn.textContent = 'login';
            loginBtn.disabled = false;
        }
    }

    checkAuthStatus() {
        // Check if user is already logged in
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            // Redirect to index if already logged in
            window.location.href = 'index.html';
        }
    }

    togglePasswordVisibility(input, icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.innerHTML = '<i class="input-icon iw-20 ih-20" data-feather="eye-off"></i>';
            feather.replace();
        } else {
            input.type = 'password';
            icon.innerHTML = '<i class="input-icon iw-20 ih-20" data-feather="eye"></i>';
            feather.replace();
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize login page
let loginPage;
document.addEventListener('DOMContentLoaded', () => {
    loginPage = new LoginPage();
});

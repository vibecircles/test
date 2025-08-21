// Register Page functionality
class RegisterPage {
    constructor() {
        this.api = new VibeCirclesAPI();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Register form submission
        const registerForm = document.querySelector('.theme-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Register button click
        const registerBtn = document.querySelector('.theme-form .btn-section .btn.btn-solid');
        if (registerBtn) {
            registerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleRegister();
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

        // Social register buttons (placeholders)
        const socialButtons = document.querySelectorAll('.social-links a');
        socialButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.showNotification('Social registration not implemented yet', 'info');
            });
        });
    }

    async handleRegister() {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('exampleInputEmail1').value.trim();
        const password = document.getElementById('exampleInputPassword1').value;
        const rememberMe = document.getElementById('exampleCheck1')?.checked || false;

        // Validation
        if (!name || !email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            // Show loading state
            const registerBtn = document.querySelector('.theme-form .btn-section .btn.btn-solid');
            const originalText = registerBtn.textContent;
            registerBtn.textContent = 'Creating Account...';
            registerBtn.disabled = true;

            // Call API
            const response = await this.api.auth.register(name, email, password);

            if (response.success) {
                this.showNotification('Registration successful! Please login.', 'success');
                
                // Redirect to login page
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                this.showNotification(response.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Registration failed. Please try again.', 'error');
        } finally {
            // Reset button state
            const registerBtn = document.querySelector('.theme-form .btn-section .btn.btn-solid');
            registerBtn.textContent = 'sign up';
            registerBtn.disabled = false;
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

// Initialize register page
let registerPage;
document.addEventListener('DOMContentLoaded', () => {
    registerPage = new RegisterPage();
});

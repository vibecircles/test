// Settings page functionality
class SettingsPage {
    constructor() {
        this.currentSettings = null;
        this.init();
    }

    async init() {
        // Check authentication
        if (!api.isAuthenticated()) {
            window.location.href = '/login';
            return;
        }

        await this.loadSettings();
        this.setupEventListeners();
    }

    async loadSettings() {
        try {
            const response = await api.settings.get();
            if (response.success) {
                this.currentSettings = response.data;
                this.populateSettingsForm();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showNotification('Failed to load settings', 'error');
        }
    }

    populateSettingsForm() {
        if (!this.currentSettings) return;

        // Profile settings
        this.setFormValue('full_name', this.currentSettings.full_name);
        this.setFormValue('bio', this.currentSettings.bio);
        this.setFormValue('location', this.currentSettings.location);
        this.setFormValue('website', this.currentSettings.website);
        this.setFormValue('phone', this.currentSettings.phone);
        this.setFormValue('gender', this.currentSettings.gender);
        this.setFormValue('birthday', this.currentSettings.birthday);
        this.setFormValue('profile_privacy', this.currentSettings.profile_privacy);

        // Notification settings
        this.setFormValue('email_notifications', this.currentSettings.email_notifications);
        this.setFormValue('push_notifications', this.currentSettings.push_notifications);
        this.setFormValue('profile_visibility', this.currentSettings.profile_visibility);
        this.setFormValue('post_visibility', this.currentSettings.post_visibility);

        // Display settings
        this.setFormValue('theme', this.currentSettings.theme);
        this.setFormValue('language', this.currentSettings.language);
        this.setFormValue('timezone', this.currentSettings.timezone);

        // Update profile display
        this.updateProfileDisplay();
    }

    setFormValue(fieldName, value) {
        const element = document.querySelector(`[name="${fieldName}"]`);
        if (!element) return;

        if (element.type === 'checkbox') {
            element.checked = Boolean(value);
        } else if (element.type === 'radio') {
            const radioElement = document.querySelector(`[name="${fieldName}"][value="${value}"]`);
            if (radioElement) radioElement.checked = true;
        } else {
            element.value = value || '';
        }
    }

    updateProfileDisplay() {
        // Update avatar
        const avatarElement = document.querySelector('.profile-avatar img');
        if (avatarElement && this.currentSettings.avatar_url) {
            avatarElement.src = this.currentSettings.avatar_url;
        }

        // Update cover photo
        const coverElement = document.querySelector('.profile-cover');
        if (coverElement && this.currentSettings.cover_url) {
            coverElement.style.backgroundImage = `url(${this.currentSettings.cover_url})`;
        }

        // Update profile info
        const nameElement = document.querySelector('.profile-name');
        if (nameElement) {
            nameElement.textContent = this.currentSettings.full_name || this.currentSettings.username;
        }

        const bioElement = document.querySelector('.profile-bio');
        if (bioElement) {
            bioElement.textContent = this.currentSettings.bio || 'No bio yet';
        }
    }

    setupEventListeners() {
        // Profile form submission
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfileSettings();
            });
        }

        // Notification settings form
        const notificationForm = document.getElementById('notification-form');
        if (notificationForm) {
            notificationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNotificationSettings();
            });
        }

        // Display settings form
        const displayForm = document.getElementById('display-form');
        if (displayForm) {
            displayForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDisplaySettings();
            });
        }

        // Avatar upload
        const avatarInput = document.getElementById('avatar-upload');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => {
                this.handleAvatarUpload(e.target.files[0]);
            });
        }

        // Cover photo upload
        const coverInput = document.getElementById('cover-upload');
        if (coverInput) {
            coverInput.addEventListener('change', (e) => {
                this.handleCoverUpload(e.target.files[0]);
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                this.updateTheme(e.target.checked ? 'dark' : 'light');
            });
        }

        // Save buttons
        const saveButtons = document.querySelectorAll('.save-settings-btn');
        saveButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const formType = button.getAttribute('data-form');
                switch (formType) {
                    case 'profile':
                        this.saveProfileSettings();
                        break;
                    case 'notifications':
                        this.saveNotificationSettings();
                        break;
                    case 'display':
                        this.saveDisplaySettings();
                        break;
                }
            });
        });
    }

    async saveProfileSettings() {
        const formData = this.getFormData('profile-form');
        
        try {
            const response = await api.settings.update(formData);
            if (response.success) {
                this.currentSettings = { ...this.currentSettings, ...response.data };
                this.showNotification('Profile settings saved successfully', 'success');
                this.updateProfileDisplay();
            }
        } catch (error) {
            console.error('Error saving profile settings:', error);
            this.showNotification('Failed to save profile settings', 'error');
        }
    }

    async saveNotificationSettings() {
        const formData = this.getFormData('notification-form');
        
        try {
            const response = await api.settings.updateNotifications(formData);
            if (response.success) {
                this.showNotification('Notification settings saved successfully', 'success');
            }
        } catch (error) {
            console.error('Error saving notification settings:', error);
            this.showNotification('Failed to save notification settings', 'error');
        }
    }

    async saveDisplaySettings() {
        const formData = this.getFormData('display-form');
        
        try {
            const response = await api.settings.updateDisplay(formData);
            if (response.success) {
                this.showNotification('Display settings saved successfully', 'success');
                this.applyTheme(formData.theme);
            }
        } catch (error) {
            console.error('Error saving display settings:', error);
            this.showNotification('Failed to save display settings', 'error');
        }
    }

    getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            if (formData.getAll(key).length > 1) {
                // Handle multiple values (checkboxes)
                if (!data[key]) data[key] = [];
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }

        // Handle checkboxes that weren't checked
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            if (!data.hasOwnProperty(checkbox.name)) {
                data[checkbox.name] = false;
            }
        });

        return data;
    }

    async handleAvatarUpload(file) {
        if (!file) return;

        try {
            // In a real app, you'd upload to a file service first
            // For now, we'll simulate with a data URL
            const reader = new FileReader();
            reader.onload = async (e) => {
                const avatarUrl = e.target.result;
                
                const response = await api.settings.updateAvatar(avatarUrl);
                if (response.success) {
                    this.currentSettings.avatar_url = avatarUrl;
                    this.updateProfileDisplay();
                    this.showNotification('Avatar updated successfully', 'success');
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading avatar:', error);
            this.showNotification('Failed to upload avatar', 'error');
        }
    }

    async handleCoverUpload(file) {
        if (!file) return;

        try {
            // In a real app, you'd upload to a file service first
            // For now, we'll simulate with a data URL
            const reader = new FileReader();
            reader.onload = async (e) => {
                const coverUrl = e.target.result;
                
                const response = await api.settings.updateCover(coverUrl);
                if (response.success) {
                    this.currentSettings.cover_url = coverUrl;
                    this.updateProfileDisplay();
                    this.showNotification('Cover photo updated successfully', 'success');
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading cover photo:', error);
            this.showNotification('Failed to upload cover photo', 'error');
        }
    }

    async updateTheme(theme) {
        try {
            const response = await api.settings.updateDisplay({ theme });
            if (response.success) {
                this.applyTheme(theme);
                this.showNotification('Theme updated successfully', 'success');
            }
        } catch (error) {
            console.error('Error updating theme:', error);
            this.showNotification('Failed to update theme', 'error');
        }
    }

    applyTheme(theme) {
        // Remove existing theme classes
        document.body.classList.remove('theme-light', 'theme-dark');
        
        // Add new theme class
        document.body.classList.add(`theme-${theme}`);
        
        // Update theme toggle if it exists
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.checked = theme === 'dark';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize settings page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SettingsPage();
});

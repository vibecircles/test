// Birthday page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize birthday page
    initBirthdayPage();
});

async function initBirthdayPage() {
    try {
        // Check if user is authenticated
        if (!api.isAuthenticated()) {
            window.location.href = '/login';
            return;
        }

        // Load upcoming birthdays
        await loadUpcomingBirthdays();
        
        // Load user's birthday info
        await loadUserBirthday();
        
        // Set up event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing birthday page:', error);
        showNotification('Error loading birthday data', 'error');
    }
}

async function loadUpcomingBirthdays() {
    try {
        const response = await api.events.getUpcomingBirthdays({
            limit: 10,
            days: 30
        });

        if (response.success) {
            displayUpcomingBirthdays(response.data.birthdays);
        }
    } catch (error) {
        console.error('Error loading upcoming birthdays:', error);
    }
}

function displayUpcomingBirthdays(birthdays) {
    const container = document.querySelector('.birthday-list');
    if (!container) return;

    if (birthdays.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <p class="text-muted">No upcoming birthdays in the next 30 days</p>
            </div>
        `;
        return;
    }

    const birthdayHTML = birthdays.map(birthday => {
        const user = birthday.users;
        const profile = birthday;
        const daysUntil = getDaysUntilBirthday(birthday.birthday);
        
        return `
            <div class="birthday-item d-flex align-items-center p-3 border-bottom">
                <div class="avatar me-3">
                    <img src="${profile.avatar_url || '../assets/images/user/1.jpg'}" 
                         alt="${profile.full_name || user.username}" 
                         class="rounded-circle" 
                         width="50" 
                         height="50">
                </div>
                <div class="birthday-info flex-grow-1">
                    <h6 class="mb-1">${profile.full_name || user.username}</h6>
                    <p class="text-muted mb-0">
                        <i class="icon-calendar me-1"></i>
                        ${formatBirthday(birthday.birthday)} 
                        <span class="badge bg-primary ms-2">${daysUntil} days</span>
                    </p>
                </div>
                <div class="birthday-actions">
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="sendBirthdayWish(${user.id})">
                        <i class="icon-heart me-1"></i> Wish
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = birthdayHTML;
}

async function loadUserBirthday() {
    try {
        const response = await api.auth.me();
        if (response.success) {
            const user = response.data.user;
            const profile = user.profile;
            
            if (profile && profile.birthday) {
                displayUserBirthday(profile);
            }
        }
    } catch (error) {
        console.error('Error loading user birthday:', error);
    }
}

function displayUserBirthday(profile) {
    const container = document.querySelector('.user-birthday-info');
    if (!container) return;

    const daysUntil = getDaysUntilBirthday(profile.birthday);
    const isToday = daysUntil === 0;
    
    const birthdayHTML = `
        <div class="user-birthday-card p-4 bg-light rounded">
            <div class="d-flex align-items-center">
                <div class="avatar me-3">
                    <img src="${profile.avatar_url || '../assets/images/user/1.jpg'}" 
                         alt="${profile.full_name}" 
                         class="rounded-circle" 
                         width="80" 
                         height="80">
                </div>
                <div class="birthday-info">
                    <h5 class="mb-2">${profile.full_name}</h5>
                    <p class="text-muted mb-2">
                        <i class="icon-calendar me-1"></i>
                        Birthday: ${formatBirthday(profile.birthday)}
                    </p>
                    ${isToday ? 
                        '<div class="alert alert-success mb-0"><i class="icon-gift me-1"></i> Happy Birthday! 🎉</div>' :
                        `<p class="text-primary mb-0"><strong>${daysUntil} days</strong> until your birthday</p>`
                    }
                </div>
            </div>
        </div>
    `;

    container.innerHTML = birthdayHTML;
}

function getDaysUntilBirthday(birthday) {
    const today = new Date();
    const birthdayDate = new Date(birthday);
    const birthdayThisYear = new Date(today.getFullYear(), birthdayDate.getMonth(), birthdayDate.getDate());
    
    // If birthday has passed this year, check next year
    if (birthdayThisYear < today) {
        birthdayThisYear.setFullYear(today.getFullYear() + 1);
    }
    
    const diffTime = birthdayThisYear - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

function formatBirthday(birthday) {
    const date = new Date(birthday);
    return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric' 
    });
}

async function sendBirthdayWish(userId) {
    try {
        // Create a birthday post
        const postData = {
            content: `Happy Birthday! 🎉🎂 Hope you have an amazing day!`,
            privacy: 'public'
        };

        const response = await api.posts.create(postData);
        
        if (response.success) {
            showNotification('Birthday wish sent! 🎉', 'success');
        }
    } catch (error) {
        console.error('Error sending birthday wish:', error);
        showNotification('Error sending birthday wish', 'error');
    }
}

function setupEventListeners() {
    // Birthday wish button
    const wishButtons = document.querySelectorAll('.btn-wish-birthday');
    wishButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.dataset.userId;
            sendBirthdayWish(userId);
        });
    });

    // Refresh birthdays button
    const refreshBtn = document.querySelector('.refresh-birthdays');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            this.disabled = true;
            this.innerHTML = '<i class="icon-refresh-cw spin"></i> Loading...';
            
            try {
                await loadUpcomingBirthdays();
                showNotification('Birthdays refreshed!', 'success');
            } catch (error) {
                showNotification('Error refreshing birthdays', 'error');
            } finally {
                this.disabled = false;
                this.innerHTML = '<i class="icon-refresh-cw"></i> Refresh';
            }
        });
    }

    // Create birthday event button
    const createEventBtn = document.querySelector('.create-birthday-event');
    if (createEventBtn) {
        createEventBtn.addEventListener('click', function() {
            showCreateEventModal();
        });
    }
}

function showCreateEventModal() {
    const modalHTML = `
        <div class="modal fade" id="createBirthdayEventModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Create Birthday Event</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="birthdayEventForm">
                            <div class="mb-3">
                                <label class="form-label">Event Title</label>
                                <input type="text" class="form-control" name="title" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Date & Time</label>
                                <input type="datetime-local" class="form-control" name="startDate" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Location</label>
                                <input type="text" class="form-control" name="location">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Privacy</label>
                                <select class="form-select" name="privacy">
                                    <option value="public">Public</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="createBirthdayEvent()">Create Event</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('createBirthdayEventModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('createBirthdayEventModal'));
    modal.show();
}

async function createBirthdayEvent() {
    try {
        const form = document.getElementById('birthdayEventForm');
        const formData = new FormData(form);
        
        const eventData = {
            title: formData.get('title'),
            description: formData.get('description'),
            startDate: formData.get('startDate'),
            location: formData.get('location'),
            privacy: formData.get('privacy')
        };

        const response = await api.events.create(eventData);
        
        if (response.success) {
            showNotification('Birthday event created successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('createBirthdayEventModal'));
            modal.hide();
            
            // Refresh events
            await loadUpcomingBirthdays();
        }
    } catch (error) {
        console.error('Error creating birthday event:', error);
        showNotification('Error creating birthday event', 'error');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Add to body
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Utility function to add spinning animation
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .spin {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    </style>
`);

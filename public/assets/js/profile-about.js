class ProfileAboutPage {
    constructor() {
        this.api = new VibeCirclesAPI();
        this.currentUserId = null;
        this.profileUserId = null;
        this.init();
    }

    async init() {
        try {
            // Check authentication
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            // Get current user
            const currentUser = await this.api.auth.me();
            this.currentUserId = currentUser.id;

            // Get profile user ID from URL or use current user
            const urlParams = new URLSearchParams(window.location.search);
            this.profileUserId = urlParams.get('id') || this.currentUserId;

            // Load profile data
            await this.loadProfileData();
            await this.loadFriends();
            this.setupEventListeners();

        } catch (error) {
            console.error('Profile about page init error:', error);
            this.showNotification('Failed to load profile data', 'error');
        }
    }

    async loadProfileData() {
        try {
            const response = await this.api.users.getById(this.profileUserId);
            const userData = response.data;
            const profile = userData.profiles?.[0] || {};
            const settings = userData.user_settings?.[0] || {};

            this.populateProfileAbout(profile);
            this.populateHobbies(profile);
            this.populateEducation(profile);
            this.updatePageTitle(profile.full_name || userData.username);

        } catch (error) {
            console.error('Load profile data error:', error);
            this.showNotification('Failed to load profile information', 'error');
        }
    }

    populateProfileAbout(profile) {
        const aboutContent = document.querySelector('.about-content ul');
        if (!aboutContent) return;

        const aboutData = [
            { icon: 'map-pin', title: 'Location', value: profile.location || 'Not specified' },
            { icon: 'calendar', title: 'Birthday', value: profile.birthday ? this.formatDate(profile.birthday) : 'Not specified' },
            { icon: 'phone', title: 'Phone', value: profile.phone || 'Not specified' },
            { icon: 'mail', title: 'Email', value: profile.email || 'Not specified' },
            { icon: 'globe', title: 'Website', value: profile.website || 'Not specified' },
            { icon: 'user', title: 'Gender', value: profile.gender || 'Not specified' },
            { icon: 'clock', title: 'Joined', value: profile.created_at ? this.formatDate(profile.created_at) : 'Not specified' },
            { icon: 'eye', title: 'Privacy', value: profile.privacy || 'public' },
            { icon: 'heart', title: 'Relationship Status', value: profile.relationship_status || 'Not specified' },
            { icon: 'briefcase', title: 'Occupation', value: profile.occupation || 'Not specified' }
        ];

        aboutContent.innerHTML = aboutData.map(item => `
            <li>
                <div class="icon">
                    <i data-feather="${item.icon}" class="iw-16 ih-16"></i>
                </div>
                <div class="details">
                    <h5>${item.title}</h5>
                    <h6>${item.value}</h6>
                </div>
            </li>
        `).join('');

        // Reinitialize feather icons
        if (window.feather) {
            feather.replace();
        }
    }

    populateHobbies(profile) {
        const hobbiesSection = document.querySelector('.about-profile:nth-of-type(1) .about-list');
        if (!hobbiesSection) return;

        const hobbies = profile.hobbies ? JSON.parse(profile.hobbies) : [];
        const hobbiesData = [
            { title: 'Hobbies', content: hobbies.join(', ') || 'No hobbies listed' },
            { title: 'Interests', content: profile.interests || 'No interests listed' },
            { title: 'Favorite Music', content: profile.favorite_music || 'No music preferences' },
            { title: 'Favorite Movies', content: profile.favorite_movies || 'No movie preferences' },
            { title: 'Favorite Books', content: profile.favorite_books || 'No book preferences' },
            { title: 'Sports', content: profile.sports || 'No sports listed' },
            { title: 'Languages', content: profile.languages || 'No languages listed' }
        ];

        hobbiesSection.innerHTML = hobbiesData.map(item => `
            <li>
                <h5 class="title">${item.title}</h5>
                <h6 class="content">${item.content}</h6>
            </li>
        `).join('');
    }

    populateEducation(profile) {
        const educationSection = document.querySelector('.about-profile:nth-of-type(2) .about-list');
        if (!educationSection) return;

        const education = profile.education ? JSON.parse(profile.education) : [];
        const educationData = [
            { title: 'High School', content: profile.high_school || 'Not specified' },
            { title: 'College/University', content: profile.college || 'Not specified' },
            { title: 'Degree', content: profile.degree || 'Not specified' },
            { title: 'Graduation Year', content: profile.graduation_year || 'Not specified' }
        ];

        educationSection.innerHTML = educationData.map(item => `
            <li>
                <h5 class="title">${item.title}</h5>
                <h6 class="content">${item.content}</h6>
            </li>
        `).join('');
    }

    async loadFriends() {
        try {
            const response = await this.api.users.getFriends(this.profileUserId);
            const friends = response.data.friends || [];
            
            this.renderFriends(friends);
        } catch (error) {
            console.error('Load friends error:', error);
            // Don't show error for friends loading as it might be private
        }
    }

    renderFriends(friends) {
        const friendsContainer = document.querySelector('.friend-list');
        if (!friendsContainer) return;

        if (friends.length === 0) {
            friendsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p>No friends to display</p>
                </div>
            `;
            return;
        }

        friendsContainer.innerHTML = friends.slice(0, 6).map(friend => `
            <div class="col-sm-6">
                <div class="friend-box">
                    <div class="media">
                        <img src="${friend.profiles?.[0]?.avatar_url || '../assets/images/user-sm/1.jpg'}" 
                             alt="${friend.profiles?.[0]?.full_name || friend.username}" 
                             class="img-fluid">
                        <div class="media-body">
                            <div>
                                <h5 class="mt-0">${friend.profiles?.[0]?.full_name || friend.username}</h5>
                                <h6>${friend.profiles?.[0]?.location || 'Location not specified'}</h6>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updatePageTitle(fullName) {
        const titleElement = document.querySelector('.profile-about .card-title h3');
        if (titleElement) {
            titleElement.textContent = `${fullName}'s About`;
        }

        // Update page title
        document.title = `${fullName} - About | VibeCircles`;
    }

    setupEventListeners() {
        // Edit profile button
        const editButtons = document.querySelectorAll('[data-bs-target="#editProfile"]');
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (this.profileUserId !== this.currentUserId) {
                    this.showNotification('You can only edit your own profile', 'warning');
                    return;
                }
                // This would open the edit profile modal
                this.showNotification('Edit profile functionality coming soon', 'info');
            });
        });

        // Friend request buttons
        const friendRequestButtons = document.querySelectorAll('.friend-list .action-btns button');
        friendRequestButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.textContent.toLowerCase();
                const friendId = e.target.closest('.friend-box').dataset.friendId;
                
                if (action === 'confirm') {
                    this.handleFriendRequest(friendId, 'accept');
                } else if (action === 'delete') {
                    this.handleFriendRequest(friendId, 'reject');
                }
            });
        });
    }

    async handleFriendRequest(friendId, action) {
        try {
            if (action === 'accept') {
                await this.api.users.acceptFriendRequest(friendId);
                this.showNotification('Friend request accepted', 'success');
            } else {
                await this.api.users.rejectFriendRequest(friendId);
                this.showNotification('Friend request rejected', 'info');
            }
            
            // Refresh friend requests
            this.loadFriendRequests();
        } catch (error) {
            console.error('Handle friend request error:', error);
            this.showNotification('Failed to handle friend request', 'error');
        }
    }

    async loadFriendRequests() {
        try {
            const response = await this.api.users.getPendingFriendRequests();
            const requests = response.data.requests || [];
            
            this.renderFriendRequests(requests);
        } catch (error) {
            console.error('Load friend requests error:', error);
        }
    }

    renderFriendRequests(requests) {
        const requestsContainer = document.querySelector('.friend-list');
        if (!requestsContainer) return;

        if (requests.length === 0) {
            requestsContainer.innerHTML = '<li><p>No pending friend requests</p></li>';
            return;
        }

        requestsContainer.innerHTML = requests.map(request => `
            <li>
                <div class="media">
                    <img src="${request.profiles?.[0]?.avatar_url || '../assets/images/user-sm/1.jpg'}" 
                         alt="${request.profiles?.[0]?.full_name || request.username}">
                    <div class="media-body">
                        <div>
                            <h5 class="mt-0">${request.profiles?.[0]?.full_name || request.username}</h5>
                            <h6>1 mutual friend</h6>
                        </div>
                    </div>
                </div>
                <div class="action-btns">
                    <button type="button" class="btn btn-solid" data-friend-id="${request.id}">confirm</button>
                    <button type="button" class="btn btn-outline ms-1" data-friend-id="${request.id}">delete</button>
                </div>
            </li>
        `).join('');
    }

    formatDate(dateString) {
        if (!dateString) return 'Not specified';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
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

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfileAboutPage();
});

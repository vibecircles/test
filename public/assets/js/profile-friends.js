class ProfileFriendsPage {
    constructor() {
        this.api = new VibeCirclesAPI();
        this.currentUserId = null;
        this.profileUserId = null;
        this.friends = [];
        this.pendingRequests = [];
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

            // Load friends data
            await this.loadFriends();
            await this.loadPendingRequests();
            this.setupEventListeners();
            this.updatePageTitle();

        } catch (error) {
            console.error('Profile friends page init error:', error);
            this.showNotification('Failed to load friends data', 'error');
        }
    }

    async loadFriends() {
        try {
            const response = await this.api.users.getFriends(this.profileUserId);
            this.friends = response.data.friends || [];
            
            this.renderFriends();
            this.updateFriendCount();
        } catch (error) {
            console.error('Load friends error:', error);
            // Don't show error for friends loading as it might be private
            this.renderFriends([]);
        }
    }

    async loadPendingRequests() {
        try {
            const response = await this.api.users.getPendingFriendRequests();
            this.pendingRequests = response.data.requests || [];
            
            this.renderPendingRequests();
        } catch (error) {
            console.error('Load pending requests error:', error);
            this.renderPendingRequests([]);
        }
    }

    renderFriends() {
        const friendsContainer = document.querySelector('.friend-list.friend-page-list ul');
        if (!friendsContainer) return;

        if (this.friends.length === 0) {
            friendsContainer.innerHTML = `
                <li class="text-center">
                    <div class="profile-box friend-box">
                        <div class="profile-content">
                            <div class="profile-detail">
                                <h2>No Friends Yet</h2>
                                <h5>This user hasn't added any friends yet.</h5>
                            </div>
                        </div>
                    </div>
                </li>
            `;
            return;
        }

        friendsContainer.innerHTML = this.friends.map(friend => `
            <li>
                <div class="profile-box friend-box">
                    <div class="profile-content">
                        <div class="image-section">
                            <div class="profile-img">
                                <img src="${friend.profiles?.[0]?.avatar_url || '../assets/images/user-sm/1.jpg'}" 
                                     alt="${friend.profiles?.[0]?.full_name || friend.username}" 
                                     class="img-fluid">
                            </div>
                        </div>
                        <div class="profile-detail">
                            <h2>${friend.profiles?.[0]?.full_name || friend.username}</h2>
                            <h5>${friend.profiles?.[0]?.location || 'Location not specified'}</h5>
                            <div class="counter-stats">
                                <span>${friend.profiles?.[0]?.bio || 'No bio available'}</span>
                            </div>
                            <div class="ldr-btn btn">
                                ${this.profileUserId === this.currentUserId ? 
                                    `<button type="button" class="btn btn-outline btn-sm" onclick="profileFriendsPage.removeFriend(${friend.id})">Remove Friend</button>` :
                                    `<button type="button" class="btn btn-solid btn-sm" onclick="profileFriendsPage.viewProfile(${friend.id})">View Profile</button>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </li>
        `).join('');
    }

    renderPendingRequests() {
        const requestsContainer = document.querySelector('.dropdown-content .friend-list');
        if (!requestsContainer) return;

        if (this.pendingRequests.length === 0) {
            requestsContainer.innerHTML = `
                <li class="text-center">
                    <p>No pending friend requests</p>
                </li>
            `;
            return;
        }

        requestsContainer.innerHTML = this.pendingRequests.map(request => `
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
                    <button type="button" class="btn btn-solid" onclick="profileFriendsPage.handleFriendRequest(${request.id}, 'accept')">confirm</button>
                    <button type="button" class="btn btn-outline ms-1" onclick="profileFriendsPage.handleFriendRequest(${request.id}, 'reject')">delete</button>
                </div>
            </li>
        `).join('');
    }

    updateFriendCount() {
        const friendCountElements = document.querySelectorAll('.post-stats li:nth-child(2) h3');
        friendCountElements.forEach(element => {
            element.textContent = this.friends.length;
        });
    }

    updatePageTitle() {
        const titleElement = document.querySelector('.friend-list-box .card-title h3');
        if (titleElement) {
            titleElement.textContent = this.profileUserId === this.currentUserId ? 
                'My Friends' : 'Friends';
        }

        // Update page title
        document.title = this.profileUserId === this.currentUserId ? 
            'My Friends | VibeCircles' : 'Friends | VibeCircles';
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterFriends(e.target.value);
            });
        }

        // Friend request dropdown
        const addFriendButton = document.querySelector('.add-friend');
        if (addFriendButton) {
            addFriendButton.addEventListener('click', () => {
                this.loadPendingRequests();
            });
        }
    }

    filterFriends(searchTerm) {
        const friendsContainer = document.querySelector('.friend-list.friend-page-list ul');
        if (!friendsContainer) return;

        const filteredFriends = this.friends.filter(friend => {
            const name = friend.profiles?.[0]?.full_name || friend.username || '';
            const location = friend.profiles?.[0]?.location || '';
            const searchLower = searchTerm.toLowerCase();
            
            return name.toLowerCase().includes(searchLower) || 
                   location.toLowerCase().includes(searchLower);
        });

        if (filteredFriends.length === 0) {
            friendsContainer.innerHTML = `
                <li class="text-center">
                    <div class="profile-box friend-box">
                        <div class="profile-content">
                            <div class="profile-detail">
                                <h2>No Friends Found</h2>
                                <h5>No friends match your search criteria.</h5>
                            </div>
                        </div>
                    </div>
                </li>
            `;
            return;
        }

        friendsContainer.innerHTML = filteredFriends.map(friend => `
            <li>
                <div class="profile-box friend-box">
                    <div class="profile-content">
                        <div class="image-section">
                            <div class="profile-img">
                                <img src="${friend.profiles?.[0]?.avatar_url || '../assets/images/user-sm/1.jpg'}" 
                                     alt="${friend.profiles?.[0]?.full_name || friend.username}" 
                                     class="img-fluid">
                            </div>
                        </div>
                        <div class="profile-detail">
                            <h2>${friend.profiles?.[0]?.full_name || friend.username}</h2>
                            <h5>${friend.profiles?.[0]?.location || 'Location not specified'}</h5>
                            <div class="counter-stats">
                                <span>${friend.profiles?.[0]?.bio || 'No bio available'}</span>
                            </div>
                            <div class="ldr-btn btn">
                                ${this.profileUserId === this.currentUserId ? 
                                    `<button type="button" class="btn btn-outline btn-sm" onclick="profileFriendsPage.removeFriend(${friend.id})">Remove Friend</button>` :
                                    `<button type="button" class="btn btn-solid btn-sm" onclick="profileFriendsPage.viewProfile(${friend.id})">View Profile</button>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </li>
        `).join('');
    }

    async handleFriendRequest(requestId, action) {
        try {
            if (action === 'accept') {
                await this.api.users.acceptFriendRequest(requestId);
                this.showNotification('Friend request accepted', 'success');
            } else {
                await this.api.users.rejectFriendRequest(requestId);
                this.showNotification('Friend request rejected', 'info');
            }
            
            // Refresh data
            await this.loadPendingRequests();
            await this.loadFriends();
        } catch (error) {
            console.error('Handle friend request error:', error);
            this.showNotification('Failed to handle friend request', 'error');
        }
    }

    async removeFriend(friendId) {
        try {
            if (confirm('Are you sure you want to remove this friend?')) {
                await this.api.users.removeFriend(friendId);
                this.showNotification('Friend removed successfully', 'success');
                await this.loadFriends();
            }
        } catch (error) {
            console.error('Remove friend error:', error);
            this.showNotification('Failed to remove friend', 'error');
        }
    }

    viewProfile(userId) {
        window.location.href = `/profile?id=${userId}`;
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
let profileFriendsPage;
document.addEventListener('DOMContentLoaded', () => {
    profileFriendsPage = new ProfileFriendsPage();
});

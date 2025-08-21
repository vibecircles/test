// Profile Tab functionality
class ProfileTabPage {
    constructor() {
        this.currentUser = null;
        this.profileUser = null;
        this.currentTab = 'timeline';
        this.posts = [];
        this.friends = [];
        this.gallery = [];
        this.init();
    }

    async init() {
        try {
            // Check authentication
            if (!api.isAuthenticated()) {
                window.location.href = '/login';
                return;
            }

            // Get current user
            this.currentUser = await api.auth.me();
            
            // Get profile user ID from URL or use current user
            const urlParams = new URLSearchParams(window.location.search);
            const profileUserId = urlParams.get('user') || this.currentUser.id;
            
            // Load profile user data
            this.profileUser = await api.users.getById(profileUserId);
            
            // Initialize page
            this.loadProfileData();
            this.loadPosts();
            this.loadFriends();
            this.loadGallery();
            this.setupEventListeners();
            this.updatePageTitle();
            
        } catch (error) {
            console.error('Error initializing profile tab page:', error);
            this.showNotification('Error loading profile data', 'error');
        }
    }

    async loadProfileData() {
        try {
            // Load user profile and settings
            const [profile, settings] = await Promise.all([
                api.users.getById(this.profileUser.id),
                api.settings.get()
            ]);

            // Update profile header
            this.updateProfileHeader(profile);
            
            // Update about section
            this.updateAboutSection(profile, settings);
            
            // Update stats
            this.updateStats(profile);
            
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }

    updateProfileHeader(profile) {
        // Update profile image
        const profileImg = document.querySelector('.profile-img');
        if (profileImg) {
            profileImg.innerHTML = `
                <img src="${profile.avatar_url || '../assets/images/user/1.jpg'}" 
                     alt="${profile.first_name} ${profile.last_name}" 
                     class="img-fluid blur-up lazyload">
            `;
        }

        // Update profile name and details
        const profileName = document.querySelector('.profile-detail h2');
        if (profileName) {
            profileName.textContent = `${profile.first_name} ${profile.last_name}`;
        }

        const profileSubtitle = document.querySelector('.profile-detail h5');
        if (profileSubtitle) {
            profileSubtitle.textContent = profile.bio || 'No bio available';
        }

        // Update page title
        document.title = `${profile.first_name} ${profile.last_name} - VibeCircles`;
    }

    updateAboutSection(profile, settings) {
        const aboutContent = document.querySelector('.about-content ul');
        if (!aboutContent) return;

        aboutContent.innerHTML = `
            <li>
                <div class="icon">
                    <i data-feather="map-pin"></i>
                </div>
                <div class="details">
                    <h5>Location</h5>
                    <h6>${profile.location || 'Not specified'}</h6>
                </div>
            </li>
            <li>
                <div class="icon">
                    <i data-feather="briefcase"></i>
                </div>
                <div class="details">
                    <h5>Work</h5>
                    <h6>${profile.work || 'Not specified'}</h6>
                </div>
            </li>
            <li>
                <div class="icon">
                    <i data-feather="graduation-cap"></i>
                </div>
                <div class="details">
                    <h5>Education</h5>
                    <h6>${profile.education || 'Not specified'}</h6>
                </div>
            </li>
            <li>
                <div class="icon">
                    <i data-feather="calendar"></i>
                </div>
                <div class="details">
                    <h5>Joined</h5>
                    <h6>${this.formatDate(profile.created_at)}</h6>
                </div>
            </li>
            <li>
                <div class="icon">
                    <i data-feather="users"></i>
                </div>
                <div class="details">
                    <h5>Friends</h5>
                    <h6>${profile.friend_count || 0} friends</h6>
                </div>
            </li>
        `;

        // Reinitialize feather icons
        if (window.feather) {
            feather.replace();
        }
    }

    updateStats(profile) {
        // Update post count
        const postCount = document.querySelector('.post-stats li:first-child h3');
        if (postCount) {
            postCount.textContent = profile.post_count || 0;
        }

        // Update friend count
        const friendCount = document.querySelector('.post-stats li:last-child h3');
        if (friendCount) {
            friendCount.textContent = profile.friend_count || 0;
        }
    }

    async loadPosts() {
        try {
            this.posts = await api.users.getPosts(this.profileUser.id);
            this.renderPosts();
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    renderPosts() {
        const postsContainer = document.querySelector('.timeline-content');
        if (!postsContainer) return;

        if (this.posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="text-center py-4">
                    <i data-feather="file-text" class="iw-48 ih-48 text-muted"></i>
                    <h5 class="mt-3">No posts yet</h5>
                    <p class="text-muted">When ${this.profileUser.first_name} shares something, it will appear here.</p>
                </div>
            `;
            return;
        }

        postsContainer.innerHTML = this.posts.map(post => this.createPostElement(post)).join('');
        
        // Reinitialize feather icons
        if (window.feather) {
            feather.replace();
        }
    }

    createPostElement(post) {
        const isLiked = post.likes && post.likes.some(like => like.user_id === this.currentUser.id);
        const likeCount = post.likes ? post.likes.length : 0;
        const commentCount = post.comments ? post.comments.length : 0;

        return `
            <div class="post-content" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="media">
                        <img src="${post.user.avatar_url || '../assets/images/user/1.jpg'}" 
                             alt="${post.user.first_name} ${post.user.last_name}" 
                             class="img-fluid blur-up lazyload">
                        <div class="media-body">
                            <h5>${post.user.first_name} ${post.user.last_name}</h5>
                            <h6>${this.formatDate(post.created_at)}</h6>
                        </div>
                    </div>
                    ${post.user.id === this.currentUser.id ? `
                        <div class="post-setting">
                            <div class="dropdown">
                                <a href="#" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i data-feather="more-horizontal"></i>
                                </a>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" onclick="profileTabPage.editPost(${post.id})">Edit</a></li>
                                    <li><a class="dropdown-item text-danger" href="#" onclick="profileTabPage.deletePost(${post.id})">Delete</a></li>
                                </ul>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="post-body">
                    <p>${this.escapeHtml(post.content)}</p>
                    ${post.media_url ? `
                        <div class="post-image">
                            <img src="${post.media_url}" alt="Post media" class="img-fluid blur-up lazyload">
                        </div>
                    ` : ''}
                </div>
                <div class="post-footer">
                    <div class="post-action">
                        <button class="btn btn-sm ${isLiked ? 'btn-primary' : 'btn-outline-primary'}" 
                                onclick="profileTabPage.toggleLike(${post.id})">
                            <i data-feather="heart" class="iw-16 ih-16"></i>
                            <span>${likeCount}</span>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="profileTabPage.showComments(${post.id})">
                            <i data-feather="message-circle" class="iw-16 ih-16"></i>
                            <span>${commentCount}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async loadFriends() {
        try {
            this.friends = await api.users.getFriends(this.profileUser.id);
            this.renderFriends();
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    }

    renderFriends() {
        const friendsContainer = document.querySelector('.friend-list-box');
        if (!friendsContainer) return;

        if (this.friends.length === 0) {
            friendsContainer.innerHTML = `
                <div class="text-center py-4">
                    <i data-feather="users" class="iw-48 ih-48 text-muted"></i>
                    <h5 class="mt-3">No friends yet</h5>
                    <p class="text-muted">When ${this.profileUser.first_name} adds friends, they will appear here.</p>
                </div>
            `;
            return;
        }

        const friendsList = this.friends.slice(0, 6).map(friend => `
            <li>
                <div class="media">
                    <img src="${friend.avatar_url || '../assets/images/user/1.jpg'}" 
                         alt="${friend.first_name} ${friend.last_name}" 
                         class="img-fluid blur-up lazyload">
                    <div class="media-body">
                        <div>
                            <h5 class="mt-0">${friend.first_name} ${friend.last_name}</h5>
                            <h6>${friend.mutual_friends || 0} mutual friends</h6>
                        </div>
                    </div>
                </div>
                <div class="action-btns">
                    <button type="button" class="btn btn-solid btn-sm" onclick="profileTabPage.viewProfile(${friend.id})">View</button>
                </div>
            </li>
        `).join('');

        friendsContainer.innerHTML = `
            <div class="card-title">
                <h3>Friends</h3>
                <div class="card-title-right">
                    <a href="profile-friends.html?user=${this.profileUser.id}" class="btn btn-sm btn-outline-primary">View All</a>
                </div>
            </div>
            <div class="container-fluid">
                <ul class="friend-list">
                    ${friendsList}
                </ul>
            </div>
        `;
    }

    async loadGallery() {
        try {
            // Get user's albums from media API
            const response = await api.media.getAlbums(this.profileUser.id);
            this.gallery = response.data || [];
            this.renderGallery();
        } catch (error) {
            console.error('Error loading gallery:', error);
            // Fallback to mock data if API fails
            this.gallery = [
                { id: 1, title: 'Cover photos', photo_count: 3, cover_url: '../assets/images/post/3.jpg' },
                { id: 2, title: 'Profile photos', photo_count: 3, cover_url: '../assets/images/post/4.jpg' },
                { id: 3, title: 'Family trip', photo_count: 3, cover_url: '../assets/images/post/10.jpg' }
            ];
            this.renderGallery();
        }
    }

    renderGallery() {
        const galleryContainer = document.querySelector('.gallery-album');
        if (!galleryContainer) return;

        const albums = this.gallery.map(album => `
            <div class="col-xl-3 col-lg-4 col-6">
                <a class="card collection" href="#" onclick="profileTabPage.viewAlbum(${album.id})">
                    <img class="card-img-top img-fluid blur-up lazyload bg-img"
                         src="${album.cover_url}" alt="${album.title}">
                    <div class="card-body">
                        <h5 class="card-title">${album.title}</h5>
                        <h6>${album.photo_count} photos</h6>
                    </div>
                </a>
            </div>
        `).join('');

        galleryContainer.innerHTML = `
            <div class="col-xl-3 col-lg-4 col-6">
                <div class="card add-card">
                    <div class="add-icon">
                        <div>
                            <i class="iw-30 ih-30" data-feather="plus-circle"></i>
                            <input type="file" class="form-control-file" onchange="profileTabPage.uploadPhoto(this)">
                            <h5 class="card-title">create album</h5>
                            <p>create album in just few minutes</p>
                        </div>
                    </div>
                </div>
            </div>
            ${albums}
        `;
    }

    setupEventListeners() {
        // Tab switching
        const tabLinks = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('href').substring(1);
                this.switchTab(tabId);
            });
        });

        // Search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterContent(e.target.value);
            });
        }

        // Friend request actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('confirm-friend')) {
                const userId = e.target.dataset.userId;
                this.confirmFriendRequest(userId);
            } else if (e.target.classList.contains('delete-friend')) {
                const userId = e.target.dataset.userId;
                this.deleteFriendRequest(userId);
            }
        });
    }

    switchTab(tabId) {
        this.currentTab = tabId;
        
        // Update active tab
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${tabId}"]`).classList.add('active');

        // Load tab-specific content
        switch (tabId) {
            case 'timeline':
                this.loadPosts();
                break;
            case 'about':
                this.loadProfileData();
                break;
            case 'friends':
                this.loadFriends();
                break;
            case 'gallery':
                this.loadGallery();
                break;
        }
    }

    filterContent(searchTerm) {
        if (!searchTerm) {
            this.renderPosts();
            return;
        }

        const filteredPosts = this.posts.filter(post => 
            post.content.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const postsContainer = document.querySelector('.timeline-content');
        if (postsContainer) {
            postsContainer.innerHTML = filteredPosts.map(post => this.createPostElement(post)).join('');
        }
    }

    async toggleLike(postId) {
        try {
            await api.posts.toggleLike(postId);
            await this.loadPosts(); // Reload posts to update like status
        } catch (error) {
            console.error('Error toggling like:', error);
            this.showNotification('Error updating like', 'error');
        }
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            await api.posts.delete(postId);
            await this.loadPosts(); // Reload posts
            this.showNotification('Post deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting post:', error);
            this.showNotification('Error deleting post', 'error');
        }
    }

    async confirmFriendRequest(userId) {
        try {
            await api.users.acceptFriendRequest(userId);
            this.showNotification('Friend request accepted', 'success');
            // Reload friend requests
            this.loadFriendRequests();
        } catch (error) {
            console.error('Error accepting friend request:', error);
            this.showNotification('Error accepting friend request', 'error');
        }
    }

    async deleteFriendRequest(userId) {
        try {
            await api.users.rejectFriendRequest(userId);
            this.showNotification('Friend request rejected', 'success');
            // Reload friend requests
            this.loadFriendRequests();
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            this.showNotification('Error rejecting friend request', 'error');
        }
    }

    viewProfile(userId) {
        window.location.href = `profile-tab.html?user=${userId}`;
    }

    viewAlbum(albumId) {
        // Navigate to album view
        window.location.href = `profile-gallery.html?album=${albumId}`;
    }

    uploadPhoto(input) {
        const file = input.files[0];
        if (!file) return;

        // Handle photo upload
        this.showNotification('Photo upload functionality coming soon', 'info');
    }

    showComments(postId) {
        // Show comments modal or expand comments section
        this.showNotification('Comments functionality coming soon', 'info');
    }

    editPost(postId) {
        // Show edit post modal
        this.showNotification('Edit post functionality coming soon', 'info');
    }

    updatePageTitle() {
        if (this.profileUser) {
            document.title = `${this.profileUser.first_name} ${this.profileUser.last_name} - VibeCircles`;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize profile tab page
let profileTabPage;
document.addEventListener('DOMContentLoaded', () => {
    profileTabPage = new ProfileTabPage();
});

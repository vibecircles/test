// Index Page functionality
class IndexPage {
    constructor() {
        this.currentUser = null;
        this.posts = [];
        this.friendRequests = [];
        this.notifications = [];
        this.init();
    }

    async init() {
        try {
            // Check authentication
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            // Load page data
            await this.loadPageData();
            this.setupEventListeners();
            this.updateUI();
        } catch (error) {
            console.error('Index page init error:', error);
            this.showNotification('Error loading page data', 'error');
        }
    }

    async loadPageData() {
        try {
            // Load current user
            const userResponse = await api.auth.getCurrentUser();
            this.currentUser = userResponse.data;

            // Load posts for feed
            const postsResponse = await api.posts.getAll();
            this.posts = postsResponse.data?.posts || [];

            // Load friend requests
            const requestsResponse = await api.users.getFriendRequests();
            this.friendRequests = requestsResponse.data || [];

            // Load notifications
            const notificationsResponse = await api.notifications.getAll();
            this.notifications = notificationsResponse.data || [];

            this.renderFeed();
            this.renderFriendRequests();
            this.renderNotifications();
        } catch (error) {
            console.error('Load page data error:', error);
            // Fallback to mock data if API fails
            this.loadMockData();
        }
    }

    loadMockData() {
        this.posts = [
            {
                id: 1,
                user: { id: 1, name: 'John Doe', avatar: 'assets/images/user-sm/1.jpg' },
                content: 'Just had an amazing day at the beach!',
                image: 'assets/images/post/1.jpg',
                likes_count: 15,
                comments_count: 5,
                created_at: new Date().toISOString(),
                is_liked: false
            },
            {
                id: 2,
                user: { id: 2, name: 'Jane Smith', avatar: 'assets/images/user-sm/2.jpg' },
                content: 'Working on some exciting new projects!',
                likes_count: 8,
                comments_count: 3,
                created_at: new Date(Date.now() - 3600000).toISOString(),
                is_liked: true
            }
        ];

        this.friendRequests = [
            {
                id: 1,
                user: { id: 3, name: 'Paige Turner', avatar: 'assets/images/user-sm/5.jpg' },
                mutual_friends: 1
            },
            {
                id: 2,
                user: { id: 4, name: 'Alice Johnson', avatar: 'assets/images/user-sm/6.jpg' },
                mutual_friends: 2
            }
        ];

        this.renderFeed();
        this.renderFriendRequests();
    }

    renderFeed() {
        const feedContainer = document.querySelector('.post-section');
        if (!feedContainer) return;

        feedContainer.innerHTML = this.posts.map(post => this.createPostElement(post)).join('');
    }

    createPostElement(post) {
        const timeAgo = this.getTimeAgo(post.created_at);
        const likeIcon = post.is_liked ? 'heart' : 'heart';
        const likeClass = post.is_liked ? 'liked' : '';

        return `
            <div class="post-section" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="media">
                        <img src="${post.user.avatar}" alt="${post.user.name}" class="img-fluid">
                        <div class="media-body">
                            <h5>${this.escapeHtml(post.user.name)}</h5>
                            <h6>${timeAgo}</h6>
                        </div>
                    </div>
                    <div class="post-setting">
                        <div class="dropdown">
                            <span class="dropdown-toggle" data-bs-toggle="dropdown">
                                <i class="icon-light stroke-width-3 iw-16 ih-16" data-feather="more-horizontal"></i>
                            </span>
                            <div class="dropdown-menu">
                                <a href="javascript:void(0)" onclick="indexPage.editPost(${post.id})">edit</a>
                                <a href="javascript:void(0)" onclick="indexPage.deletePost(${post.id})">delete</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="post-content">
                    <p>${this.escapeHtml(post.content)}</p>
                    ${post.image ? `<img src="${post.image}" alt="Post image" class="img-fluid">` : ''}
                </div>
                <div class="post-footer">
                    <div class="like-section">
                        <div class="like-emoji">
                            <a href="javascript:void(0)" onclick="indexPage.toggleLike(${post.id})" class="${likeClass}">
                                <i class="icon-light stroke-width-3 iw-16 ih-16" data-feather="${likeIcon}"></i>
                            </a>
                        </div>
                        <h6>${post.likes_count} likes</h6>
                    </div>
                    <div class="comment-section">
                        <a href="javascript:void(0)" onclick="indexPage.showComments(${post.id})">
                            <i class="icon-light stroke-width-3 iw-16 ih-16" data-feather="message-circle"></i>
                        </a>
                        <h6>${post.comments_count} comments</h6>
                    </div>
                    <div class="share-section">
                        <a href="javascript:void(0)" onclick="indexPage.sharePost(${post.id})">
                            <i class="icon-light stroke-width-3 iw-16 ih-16" data-feather="share-2"></i>
                        </a>
                        <h6>share</h6>
                    </div>
                </div>
            </div>
        `;
    }

    renderFriendRequests() {
        const requestsContainer = document.querySelector('.friend-list');
        if (!requestsContainer) return;

        requestsContainer.innerHTML = this.friendRequests.map(request => `
            <li data-request-id="${request.id}">
                <div class="media">
                    <img src="${request.user.avatar}" alt="${request.user.name}">
                    <div class="media-body">
                        <div>
                            <h5 class="mt-0">${this.escapeHtml(request.user.name)}</h5>
                            <h6>${request.mutual_friends} mutual friend${request.mutual_friends !== 1 ? 's' : ''}</h6>
                        </div>
                    </div>
                </div>
                <div class="action-btns">
                    <button type="button" class="btn btn-solid" onclick="indexPage.acceptFriendRequest(${request.id})">confirm</button>
                    <button type="button" class="btn btn-outline ms-1" onclick="indexPage.declineFriendRequest(${request.id})">delete</button>
                </div>
            </li>
        `).join('');
    }

    renderNotifications() {
        const notificationsContainer = document.querySelector('.notification-list');
        if (!notificationsContainer) return;

        const unreadCount = this.notifications.filter(n => !n.is_read).length;
        
        // Update notification badge
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }

        notificationsContainer.innerHTML = this.notifications.slice(0, 5).map(notification => `
            <li data-notification-id="${notification.id}">
                <div class="media">
                    <img src="${notification.sender?.avatar || 'assets/images/user-sm/1.jpg'}" alt="user">
                    <div class="media-body">
                        <div>
                            <h5 class="mt-0">${this.escapeHtml(notification.content)}</h5>
                            <h6>${this.getTimeAgo(notification.created_at)}</h6>
                        </div>
                    </div>
                </div>
            </li>
        `).join('');
    }

    async createPost(content, image = null) {
        try {
            const response = await api.posts.create({ content, image });
            const newPost = response.data;
            this.posts.unshift(newPost);
            this.renderFeed();
            this.showNotification('Post created successfully!', 'success');
        } catch (error) {
            console.error('Create post error:', error);
            this.showNotification('Error creating post', 'error');
        }
    }

    async toggleLike(postId) {
        try {
            const response = await api.posts.toggleLike(postId);
            const post = this.posts.find(p => p.id === postId);
            if (post) {
                post.is_liked = !post.is_liked;
                post.likes_count = response.data.likes_count;
                this.renderFeed();
            }
        } catch (error) {
            console.error('Toggle like error:', error);
            this.showNotification('Error updating like', 'error');
        }
    }

    async acceptFriendRequest(requestId) {
        try {
            await api.users.acceptFriendRequest(requestId);
            this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
            this.renderFriendRequests();
            this.showNotification('Friend request accepted!', 'success');
        } catch (error) {
            console.error('Accept friend request error:', error);
            this.showNotification('Error accepting friend request', 'error');
        }
    }

    async declineFriendRequest(requestId) {
        try {
            await api.users.declineFriendRequest(requestId);
            this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
            this.renderFriendRequests();
            this.showNotification('Friend request declined', 'info');
        } catch (error) {
            console.error('Decline friend request error:', error);
            this.showNotification('Error declining friend request', 'error');
        }
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            await api.posts.delete(postId);
            this.posts = this.posts.filter(p => p.id !== postId);
            this.renderFeed();
            this.showNotification('Post deleted successfully', 'success');
        } catch (error) {
            console.error('Delete post error:', error);
            this.showNotification('Error deleting post', 'error');
        }
    }

    showComments(postId) {
        // Navigate to post detail page or show comments modal
        window.location.href = `post-detail.html?id=${postId}`;
    }

    sharePost(postId) {
        // Implement share functionality
        this.showNotification('Share feature coming soon!', 'info');
    }

    editPost(postId) {
        // Navigate to edit post page
        window.location.href = `edit-post.html?id=${postId}`;
    }

    setupEventListeners() {
        // Post creation form
        const postForm = document.querySelector('#post-form');
        if (postForm) {
            postForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const content = postForm.querySelector('textarea').value;
                if (content.trim()) {
                    this.createPost(content);
                    postForm.querySelector('textarea').value = '';
                }
            });
        }

        // Search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Logout
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            });
        }
    }

    handleSearch(query) {
        if (query.trim()) {
            // Implement search functionality
            console.log('Searching for:', query);
        }
    }

    updateUI() {
        // Update user info in header
        if (this.currentUser) {
            const userNameElements = document.querySelectorAll('.user-name');
            userNameElements.forEach(el => {
                el.textContent = this.currentUser.name;
            });

            const userAvatarElements = document.querySelectorAll('.user-avatar');
            userAvatarElements.forEach(el => {
                el.src = this.currentUser.avatar || 'assets/images/user-sm/1.jpg';
            });
        }
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return past.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Add to page
        const container = document.querySelector('.container-fluid') || document.body;
        container.insertBefore(notification, container.firstChild);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize index page
let indexPage;
document.addEventListener('DOMContentLoaded', () => {
    indexPage = new IndexPage();
});

class ProfileActivityFeedPage {
    constructor() {
        this.api = new VibeCirclesAPI();
        this.currentUserId = null;
        this.profileUserId = null;
        this.activities = [];
        this.posts = [];
        this.init();
    }

    async init() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const currentUser = await this.api.auth.me();
            this.currentUserId = currentUser.id;

            const urlParams = new URLSearchParams(window.location.search);
            this.profileUserId = urlParams.get('id') || this.currentUserId;

            await this.loadUserActivity();
            await this.loadUserPosts();
            this.setupEventListeners();
            this.updatePageTitle();

        } catch (error) {
            console.error('Profile activity feed page init error:', error);
            this.showNotification('Failed to load activity data', 'error');
        }
    }

    async loadUserActivity() {
        try {
            // Get user activity from notifications and posts
            const [notificationsResponse, postsResponse] = await Promise.all([
                this.api.notifications.getAll(),
                this.api.users.getPosts(this.profileUserId)
            ]);

            const notifications = notificationsResponse.data || [];
            const posts = postsResponse.data?.posts || [];

            // Combine and format activities
            this.activities = this.formatActivities(notifications, posts);
            this.renderActivityFeed();
        } catch (error) {
            console.error('Load user activity error:', error);
            // Fallback to mock data if API fails
            this.activities = this.generateMockActivity();
            this.renderActivityFeed();
        }
    }

    formatActivities(notifications, posts) {
        const activities = [];

        // Add post activities
        posts.forEach(post => {
            activities.push({
                id: `post-${post.id}`,
                type: 'post',
                icon: 'file-text',
                text: 'created a new post',
                content: post.content,
                timestamp: post.created_at,
                timeAgo: this.getTimeAgo(post.created_at),
                relatedId: post.id
            });
        });

        // Add notification activities
        notifications.forEach(notification => {
            const activityType = this.getActivityTypeFromNotification(notification);
            activities.push({
                id: `notification-${notification.id}`,
                type: activityType.type,
                icon: activityType.icon,
                text: activityType.text,
                content: notification.content,
                timestamp: notification.created_at,
                timeAgo: this.getTimeAgo(notification.created_at),
                relatedId: notification.related_id,
                sender: notification.sender
            });
        });

        return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getActivityTypeFromNotification(notification) {
        const typeMap = {
            'friend_request': { type: 'friend', icon: 'user-plus', text: 'sent you a friend request' },
            'post_like': { type: 'like', icon: 'heart', text: 'liked your post' },
            'post_comment': { type: 'comment', icon: 'message-circle', text: 'commented on your post' },
            'photo_upload': { type: 'photo', icon: 'image', text: 'uploaded a photo' },
            'event_invite': { type: 'event', icon: 'calendar', text: 'invited you to an event' },
            'group_invite': { type: 'group', icon: 'users', text: 'invited you to join a group' }
        };

        return typeMap[notification.type] || { type: 'general', icon: 'bell', text: 'sent you a notification' };
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} days ago`;
        
        return date.toLocaleDateString();
    }

    async loadUserPosts() {
        try {
            const response = await this.api.users.getPosts(this.profileUserId);
            this.posts = response.data.posts || [];
            this.renderPosts();
        } catch (error) {
            console.error('Load user posts error:', error);
            this.renderPosts([]);
        }
    }

    generateMockActivity() {
        const activityTypes = [
            { type: 'post', icon: 'file-text', text: 'created a new post' },
            { type: 'photo', icon: 'image', text: 'uploaded a photo' },
            { type: 'friend', icon: 'user-plus', text: 'added a new friend' },
            { type: 'like', icon: 'heart', text: 'liked a post' },
            { type: 'comment', icon: 'message-circle', text: 'commented on a post' }
        ];

        const activities = [];
        const now = new Date();
        
        for (let i = 0; i < 8; i++) {
            const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
            activities.push({
                id: i + 1,
                type: activityType.type,
                icon: activityType.icon,
                text: activityType.text,
                timestamp: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                timeAgo: `${Math.floor(Math.random() * 24) + 1} hours ago`
            });
        }

        return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    renderActivityFeed() {
        const activityContainer = document.querySelector('.activity-content');
        if (!activityContainer) return;

        if (this.activities.length === 0) {
            activityContainer.innerHTML = '<div class="text-center"><p>No activity to display yet.</p></div>';
            return;
        }

        const activityHTML = `
            <div class="activity-title">
                <h4>Recent Activity</h4>
            </div>
            <ul>
                ${this.activities.map(activity => `
                    <li>
                        <div class="media">
                            <div class="img-part">
                                <i data-feather="${activity.icon}" class="iw-16 ih-16"></i>
                            </div>
                            <div class="media-body">
                                <h4>${activity.text}</h4>
                                <h6>${activity.timeAgo}</h6>
                            </div>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;

        activityContainer.innerHTML = activityHTML;

        if (window.feather) {
            feather.replace();
        }
    }

    renderPosts() {
        const postsContainer = document.querySelector('.post-wrapper');
        if (!postsContainer) return;

        if (this.posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="text-center">
                    <p>No posts to display yet.</p>
                    ${this.profileUserId === this.currentUserId ? 
                        '<button type="button" class="btn btn-solid btn-sm" onclick="profileActivityFeedPage.createPost()">Create Post</button>' : 
                        ''
                    }
                </div>
            `;
            return;
        }

        const postsHTML = this.posts.map(post => `
            <div class="post-panel">
                <div class="post-title">
                    <div class="profile">
                        <div class="media">
                            <div class="user-img">
                                <img src="${post.user?.profiles?.[0]?.avatar_url || '../assets/images/user-sm/1.jpg'}" 
                                     alt="${post.user?.profiles?.[0]?.full_name || post.user?.username}" 
                                     class="img-fluid">
                            </div>
                            <div class="media-body">
                                <h5>${post.user?.profiles?.[0]?.full_name || post.user?.username}</h5>
                                <h6>${this.formatDate(post.created_at)}</h6>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="post-content">
                    <p>${post.content || 'No content'}</p>
                </div>
                <div class="post-actions">
                    <button type="button" class="btn btn-outline btn-sm" onclick="profileActivityFeedPage.toggleLike(${post.id})">
                        <i data-feather="heart" class="iw-16 ih-16"></i>
                        <span>${post.likes_count || 0}</span>
                    </button>
                    ${this.profileUserId === this.currentUserId ? 
                        `<button type="button" class="btn btn-outline btn-sm" onclick="profileActivityFeedPage.deletePost(${post.id})">
                            <i data-feather="trash-2" class="iw-16 ih-16"></i>
                        </button>` : 
                        ''
                    }
                </div>
            </div>
        `).join('');

        postsContainer.innerHTML = postsHTML;

        if (window.feather) {
            feather.replace();
        }
    }

    updatePageTitle() {
        const titleElement = document.querySelector('.activity-list .card-title h3');
        if (titleElement) {
            titleElement.textContent = this.profileUserId === this.currentUserId ? 
                'My Activity Feed' : 'Activity Feed';
        }
    }

    setupEventListeners() {
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterActivity(e.target.value);
            });
        }
    }

    filterActivity(searchTerm) {
        const filteredActivities = this.activities.filter(activity => {
            const text = activity.text || '';
            return text.toLowerCase().includes(searchTerm.toLowerCase());
        });

        this.renderFilteredActivity(filteredActivities);
    }

    renderFilteredActivity(activities) {
        const activityContainer = document.querySelector('.activity-content');
        if (!activityContainer) return;

        if (activities.length === 0) {
            activityContainer.innerHTML = '<div class="text-center"><p>No activities match your search.</p></div>';
            return;
        }

        const activityHTML = `
            <div class="activity-title">
                <h4>Search Results</h4>
            </div>
            <ul>
                ${activities.map(activity => `
                    <li>
                        <div class="media">
                            <div class="img-part">
                                <i data-feather="${activity.icon}" class="iw-16 ih-16"></i>
                            </div>
                            <div class="media-body">
                                <h4>${activity.text}</h4>
                                <h6>${activity.timeAgo}</h6>
                            </div>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;

        activityContainer.innerHTML = activityHTML;

        if (window.feather) {
            feather.replace();
        }
    }

    createPost() {
        const content = prompt('What\'s on your mind?');
        if (!content) return;

        this.api.posts.create({
            content,
            media_url: null
        }).then(response => {
            this.showNotification('Post created successfully', 'success');
            this.loadUserPosts();
        }).catch(error => {
            console.error('Create post error:', error);
            this.showNotification('Failed to create post', 'error');
        });
    }

    async toggleLike(postId) {
        try {
            await this.api.posts.toggleLike(postId);
            this.loadUserPosts();
        } catch (error) {
            console.error('Toggle like error:', error);
            this.showNotification('Failed to like/unlike post', 'error');
        }
    }

    deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }

        this.api.posts.delete(postId).then(response => {
            this.showNotification('Post deleted successfully', 'success');
            this.loadUserPosts();
        }).catch(error => {
            console.error('Delete post error:', error);
            this.showNotification('Failed to delete post', 'error');
        });
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

let profileActivityFeedPage;
document.addEventListener('DOMContentLoaded', () => {
    profileActivityFeedPage = new ProfileActivityFeedPage();
});

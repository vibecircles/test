// Single Page functionality
class SinglePage {
    constructor() {
        this.api = new VibeCirclesAPI();
        this.currentUserId = null;
        this.groupId = null;
        this.group = null;
        this.posts = [];
        this.suggestedGroups = [];
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

            // Get group ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            this.groupId = urlParams.get('id');
            
            if (!this.groupId) {
                this.showNotification('No group ID provided', 'error');
                return;
            }

            await this.loadGroupDetails();
            await this.loadGroupPosts();
            await this.loadSuggestedGroups();
            this.setupEventListeners();
            this.updatePageTitle();

        } catch (error) {
            console.error('Single page init error:', error);
            this.showNotification('Failed to load group details', 'error');
        }
    }

    async loadGroupDetails() {
        try {
            const response = await this.api.groups.getById(this.groupId);
            this.group = response.data.group;
            this.renderGroupDetails();
        } catch (error) {
            console.error('Load group details error:', error);
            this.showNotification('Failed to load group details', 'error');
        }
    }

    async loadGroupPosts() {
        try {
            const response = await this.api.posts.getAll({ group_id: this.groupId });
            this.posts = response.data.posts || [];
            this.renderPosts();
        } catch (error) {
            console.error('Load group posts error:', error);
            this.renderPosts([]);
        }
    }

    async loadSuggestedGroups() {
        try {
            const response = await this.api.groups.getAll({ suggested: true, limit: 5 });
            this.suggestedGroups = response.data.groups || [];
            this.renderSuggestedGroups();
        } catch (error) {
            console.error('Load suggested groups error:', error);
            this.renderSuggestedGroups([]);
        }
    }

    renderGroupDetails() {
        if (!this.group) return;

        // Update cover image
        const coverImg = document.querySelector('.cover-img img');
        if (coverImg && this.group.cover_image_url) {
            coverImg.src = this.group.cover_image_url;
            coverImg.alt = this.group.name;
        }

        // Update group logo
        const logoImg = document.querySelector('.page-logo img');
        if (logoImg && this.group.avatar_url) {
            logoImg.src = this.group.avatar_url;
            logoImg.alt = this.group.name;
        }

        // Update group name and description
        const groupName = document.querySelector('.page-name h4');
        if (groupName) {
            groupName.textContent = this.group.name;
        }

        const groupEmail = document.querySelector('.page-name h6');
        if (groupEmail) {
            groupEmail.textContent = this.group.description || 'No description';
        }

        // Update stats
        const statsContainer = document.querySelector('.page-stats ul');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <li>
                    <h2>${this.group.members_count || 0}</h2>
                    <h6>members</h6>
                </li>
                <li>
                    <h2>${this.group.followers_count || 0}</h2>
                    <h6>followers</h6>
                </li>
                <li>
                    <h2>${this.group.posts_count || 0}</h2>
                    <h6>posts</h6>
                </li>
                <li>
                    <h2>${this.group.likes_count || 0}</h2>
                    <h6>likes</h6>
                </li>
                <li>
                    <h2><img src="../assets/images/flag.jpg" class="img-fluid blur-up lazyload" alt=""></h2>
                    <h6>${this.group.location || 'Unknown'}</h6>
                </li>
            `;
        }

        // Update follow button
        const followBtn = document.querySelector('.cover-btns .btn');
        if (followBtn) {
            if (this.group.is_member) {
                followBtn.innerHTML = '<i class="iw-18 ih-18" data-feather="user-minus"></i>Leave';
                followBtn.onclick = () => this.leaveGroup();
            } else {
                followBtn.innerHTML = '<i class="iw-18 ih-18" data-feather="user-plus"></i>Join';
                followBtn.onclick = () => this.joinGroup();
            }
        }

        // Update about section
        const aboutContent = document.querySelector('.about-content ul');
        if (aboutContent) {
            aboutContent.innerHTML = `
                <li>
                    <div class="details">
                        <h4>page info</h4>
                        <h6>created on ${this.formatDate(this.group.created_at)}</h6>
                    </div>
                </li>
                <li>
                    <div class="details">
                        <h4>about us</h4>
                        <h6>${this.group.description || 'No description available'}</h6>
                    </div>
                </li>
                <li>
                    <div class="details">
                        <h4>privacy</h4>
                        <h6>${this.group.privacy || 'public'}</h6>
                    </div>
                </li>
                <li>
                    <div class="details">
                        <h4>website</h4>
                        <h6><a href="${this.group.website || '#'}">${this.group.website || 'No website'}</a></h6>
                    </div>
                </li>
            `;
        }

        if (window.feather) {
            feather.replace();
        }
    }

    renderPosts() {
        const postsContainer = document.querySelector('.content-center');
        if (!postsContainer) return;

        if (this.posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="text-center">
                    <p>No posts to display yet.</p>
                    ${this.group?.is_member ? 
                        '<button type="button" class="btn btn-solid btn-sm" onclick="singlePage.createPost()">Create Post</button>' : 
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
                    ${post.media_url ? `<img src="${post.media_url}" class="img-fluid" alt="Post media">` : ''}
                </div>
                <div class="post-actions">
                    <button type="button" class="btn btn-outline btn-sm" onclick="singlePage.toggleLike(${post.id})">
                        <i data-feather="heart" class="iw-16 ih-16"></i>
                        <span>${post.likes_count || 0}</span>
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" onclick="singlePage.showComments(${post.id})">
                        <i data-feather="message-circle" class="iw-16 ih-16"></i>
                        <span>${post.comments_count || 0}</span>
                    </button>
                    ${this.group?.is_member && post.user_id === this.currentUserId ? 
                        `<button type="button" class="btn btn-outline btn-sm" onclick="singlePage.deletePost(${post.id})">
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

    renderSuggestedGroups() {
        const suggestedContainer = document.querySelector('.list-content ul');
        if (!suggestedContainer) return;

        if (this.suggestedGroups.length === 0) {
            suggestedContainer.innerHTML = '<li><p>No suggestions available</p></li>';
            return;
        }

        const groupsHTML = this.suggestedGroups.map(group => `
            <li>
                <div class="media">
                    <div class="img-part">
                        <img src="${group.avatar_url || '../assets/images/pages-logo/1.jpg'}" 
                             class="img-fluid blur-up lazyload bg-img" alt="${group.name}">
                    </div>
                    <div class="media-body">
                        <h4>${group.name}</h4>
                        <h6>${group.description || 'No description'}
                            <span><i data-feather="user" class="icon-font-color iw-13 ih-13"></i>${group.members_count || 0}</span>
                        </h6>
                    </div>
                </div>
                <div class="action-btns">
                    <a href="single-page.html?id=${group.id}" class="btn btn-solid btn-sm">View</a>
                    ${group.is_member ? 
                        `<button type="button" class="btn btn-outline btn-sm" onclick="singlePage.leaveSuggestedGroup(${group.id})">Leave</button>` :
                        `<button type="button" class="btn btn-solid btn-sm" onclick="singlePage.joinSuggestedGroup(${group.id})">Join</button>`
                    }
                </div>
            </li>
        `).join('');

        suggestedContainer.innerHTML = groupsHTML;

        if (window.feather) {
            feather.replace();
        }
    }

    updatePageTitle() {
        if (this.group) {
            document.title = `${this.group.name} - VibeCircles`;
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('.search-inmenu input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterPosts(e.target.value);
            });
        }

        // Tab switching
        const tabLinks = document.querySelectorAll('.profile-menu ul li a');
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = e.target.closest('a').getAttribute('href');
                if (href && href !== 'single-page.html') {
                    // Add group ID to other pages
                    const separator = href.includes('?') ? '&' : '?';
                    window.location.href = href + separator + 'id=' + this.groupId;
                }
            });
        });
    }

    filterPosts(searchTerm) {
        const filteredPosts = this.posts.filter(post => {
            const content = post.content || '';
            const userName = post.user?.profiles?.[0]?.full_name || post.user?.username || '';
            return content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   userName.toLowerCase().includes(searchTerm.toLowerCase());
        });

        this.renderFilteredPosts(filteredPosts);
    }

    renderFilteredPosts(posts) {
        const postsContainer = document.querySelector('.content-center');
        if (!postsContainer) return;

        if (posts.length === 0) {
            postsContainer.innerHTML = '<div class="text-center"><p>No posts match your search.</p></div>';
            return;
        }

        const postsHTML = posts.map(post => `
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
                    ${post.media_url ? `<img src="${post.media_url}" class="img-fluid" alt="Post media">` : ''}
                </div>
                <div class="post-actions">
                    <button type="button" class="btn btn-outline btn-sm" onclick="singlePage.toggleLike(${post.id})">
                        <i data-feather="heart" class="iw-16 ih-16"></i>
                        <span>${post.likes_count || 0}</span>
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" onclick="singlePage.showComments(${post.id})">
                        <i data-feather="message-circle" class="iw-16 ih-16"></i>
                        <span>${post.comments_count || 0}</span>
                    </button>
                </div>
            </div>
        `).join('');

        postsContainer.innerHTML = postsHTML;

        if (window.feather) {
            feather.replace();
        }
    }

    async joinGroup() {
        try {
            await this.api.groups.join(this.groupId);
            this.showNotification('Successfully joined the group', 'success');
            await this.loadGroupDetails();
        } catch (error) {
            console.error('Join group error:', error);
            this.showNotification('Failed to join group', 'error');
        }
    }

    async leaveGroup() {
        if (!confirm('Are you sure you want to leave this group?')) {
            return;
        }

        try {
            await this.api.groups.leave(this.groupId);
            this.showNotification('Successfully left the group', 'success');
            await this.loadGroupDetails();
        } catch (error) {
            console.error('Leave group error:', error);
            this.showNotification('Failed to leave group', 'error');
        }
    }

    async joinSuggestedGroup(groupId) {
        try {
            await this.api.groups.join(groupId);
            this.showNotification('Successfully joined the group', 'success');
            await this.loadSuggestedGroups();
        } catch (error) {
            console.error('Join suggested group error:', error);
            this.showNotification('Failed to join group', 'error');
        }
    }

    async leaveSuggestedGroup(groupId) {
        try {
            await this.api.groups.leave(groupId);
            this.showNotification('Successfully left the group', 'success');
            await this.loadSuggestedGroups();
        } catch (error) {
            console.error('Leave suggested group error:', error);
            this.showNotification('Failed to leave group', 'error');
        }
    }

    createPost() {
        const content = prompt('What\'s on your mind?');
        if (!content) return;

        this.api.posts.create({
            content,
            group_id: this.groupId,
            media_url: null
        }).then(response => {
            this.showNotification('Post created successfully', 'success');
            this.loadGroupPosts();
        }).catch(error => {
            console.error('Create post error:', error);
            this.showNotification('Failed to create post', 'error');
        });
    }

    async toggleLike(postId) {
        try {
            await this.api.posts.toggleLike(postId);
            this.loadGroupPosts();
        } catch (error) {
            console.error('Toggle like error:', error);
            this.showNotification('Failed to like/unlike post', 'error');
        }
    }

    showComments(postId) {
        // This would open a comments modal or navigate to comments page
        this.showNotification('Comments feature coming soon', 'info');
    }

    deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }

        this.api.posts.delete(postId).then(response => {
            this.showNotification('Post deleted successfully', 'success');
            this.loadGroupPosts();
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

let singlePage;
document.addEventListener('DOMContentLoaded', () => {
    singlePage = new SinglePage();
});

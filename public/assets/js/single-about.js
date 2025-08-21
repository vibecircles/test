// Single About functionality
class SingleAboutPage {
    constructor() {
        this.currentUser = null;
        this.group = null;
        this.members = [];
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
            
            // Get group ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            const groupId = urlParams.get('group');
            
            if (!groupId) {
                this.showNotification('Group ID not found in URL', 'error');
                return;
            }
            
            // Load group data
            this.group = await api.groups.getById(groupId);
            
            // Initialize page
            this.loadGroupData();
            this.loadMembers();
            this.setupEventListeners();
            this.updatePageTitle();
            
        } catch (error) {
            console.error('Error initializing single about page:', error);
            this.showNotification('Error loading group data', 'error');
        }
    }

    async loadGroupData() {
        try {
            // Update group header
            this.updateGroupHeader();
            
            // Update group about section
            this.updateAboutSection();
            
            // Update group stats
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading group data:', error);
        }
    }

    updateGroupHeader() {
        // Update cover image
        const coverImg = document.querySelector('.cover-img img');
        if (coverImg) {
            coverImg.src = this.group.cover_url || '../assets/images/cover/3.jpg';
            coverImg.alt = this.group.name;
        }

        // Update group logo
        const groupLogo = document.querySelector('.page-logo img');
        if (groupLogo) {
            groupLogo.src = this.group.avatar_url || '../assets/images/pages-logo/6.png';
            groupLogo.alt = this.group.name;
        }

        // Update group name and email
        const groupName = document.querySelector('.page-name h4');
        if (groupName) {
            groupName.textContent = this.group.name;
        }

        const groupEmail = document.querySelector('.page-name h6');
        if (groupEmail) {
            groupEmail.textContent = this.group.email || 'No email available';
        }

        // Update follow button
        const followBtn = document.querySelector('.cover-btns .btn:first-child');
        if (followBtn) {
            const isMember = this.group.members && this.group.members.some(member => member.user_id === this.currentUser.id);
            followBtn.innerHTML = isMember ? 
                '<i class="iw-18 ih-18" data-feather="user-minus"></i>leave' : 
                '<i class="iw-18 ih-18" data-feather="user-plus"></i>join';
            followBtn.onclick = () => this.toggleMembership();
        }

        // Update message button
        const messageBtn = document.querySelector('.cover-btns .btn:last-child');
        if (messageBtn) {
            messageBtn.onclick = () => this.sendMessage();
        }
    }

    updateAboutSection() {
        const aboutContent = document.querySelector('.about-content ul');
        if (!aboutContent) return;

        aboutContent.innerHTML = `
            <li>
                <h5 class="title">Description :</h5>
                <h6 class="content">${this.group.description || 'No description available'}</h6>
            </li>
            <li>
                <h5 class="title">Category :</h5>
                <h6 class="content">${this.group.category || 'General'}</h6>
            </li>
            <li>
                <h5 class="title">Privacy :</h5>
                <h6 class="content">${this.group.privacy === 'public' ? 'Public' : 'Private'}</h6>
            </li>
            <li>
                <h5 class="title">Location :</h5>
                <h6 class="content">${this.group.location || 'Not specified'}</h6>
            </li>
            <li>
                <h5 class="title">Website :</h5>
                <h6 class="content">
                    <a href="${this.group.website || '#'}" target="_blank">
                        ${this.group.website || 'No website'}
                    </a>
                </h6>
            </li>
            <li>
                <h5 class="title">Created :</h5>
                <h6 class="content">${this.formatDate(this.group.created_at)}</h6>
            </li>
            <li>
                <h5 class="title">Email :</h5>
                <h6 class="content">${this.group.email || 'No email available'}</h6>
            </li>
            <li>
                <h5 class="title">Phone :</h5>
                <h6 class="content">${this.group.phone || 'No phone available'}</h6>
            </li>
        `;
    }

    updateStats() {
        // Update follower count
        const followerCount = document.querySelector('.page-stats li:first-child h2');
        if (followerCount) {
            followerCount.textContent = this.group.member_count || 0;
        }

        // Update following count (if applicable)
        const followingCount = document.querySelector('.page-stats li:nth-child(2) h2');
        if (followingCount) {
            followingCount.textContent = this.group.following_count || 0;
        }

        // Update total count
        const totalCount = document.querySelector('.page-stats li:last-child h2');
        if (totalCount) {
            totalCount.textContent = (this.group.member_count || 0) + (this.group.following_count || 0);
        }
    }

    async loadMembers() {
        try {
            this.members = await api.groups.getMembers(this.group.id);
            this.renderMembers();
        } catch (error) {
            console.error('Error loading members:', error);
        }
    }

    renderMembers() {
        const membersContainer = document.querySelector('.member-list');
        if (!membersContainer) return;

        if (this.members.length === 0) {
            membersContainer.innerHTML = `
                <div class="text-center py-4">
                    <i data-feather="users" class="iw-48 ih-48 text-muted"></i>
                    <h5 class="mt-3">No members yet</h5>
                    <p class="text-muted">When people join this group, they will appear here.</p>
                </div>
            `;
            return;
        }

        const membersList = this.members.slice(0, 8).map(member => `
            <li>
                <div class="media">
                    <img src="${member.user.avatar_url || '../assets/images/user/1.jpg'}" 
                         alt="${member.user.first_name} ${member.user.last_name}" 
                         class="img-fluid blur-up lazyload">
                    <div class="media-body">
                        <div>
                            <h5 class="mt-0">${member.user.first_name} ${member.user.last_name}</h5>
                            <h6>${member.role || 'Member'}</h6>
                        </div>
                    </div>
                </div>
                <div class="action-btns">
                    <button type="button" class="btn btn-solid btn-sm" onclick="singleAboutPage.viewProfile(${member.user.id})">View</button>
                    ${this.group.owner_id === this.currentUser.id && member.user.id !== this.currentUser.id ? `
                        <button type="button" class="btn btn-outline btn-sm ms-1" onclick="singleAboutPage.removeMember(${member.user.id})">Remove</button>
                    ` : ''}
                </div>
            </li>
        `).join('');

        membersContainer.innerHTML = `
            <div class="card-title">
                <h3>Members</h3>
                <div class="card-title-right">
                    <a href="single-page.html?group=${this.group.id}" class="btn btn-sm btn-outline-primary">View All</a>
                </div>
            </div>
            <div class="container-fluid">
                <ul class="friend-list">
                    ${membersList}
                </ul>
            </div>
        `;
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterMembers(e.target.value);
            });
        }

        // Edit group button (if owner)
        const editBtn = document.querySelector('.edit-group-btn');
        if (editBtn && this.group.owner_id === this.currentUser.id) {
            editBtn.style.display = 'block';
            editBtn.onclick = () => this.editGroup();
        }
    }

    filterMembers(searchTerm) {
        if (!searchTerm) {
            this.renderMembers();
            return;
        }

        const filteredMembers = this.members.filter(member => 
            member.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const membersContainer = document.querySelector('.member-list');
        if (membersContainer) {
            // Render filtered members
            const membersList = filteredMembers.slice(0, 8).map(member => `
                <li>
                    <div class="media">
                        <img src="${member.user.avatar_url || '../assets/images/user/1.jpg'}" 
                             alt="${member.user.first_name} ${member.user.last_name}" 
                             class="img-fluid blur-up lazyload">
                        <div class="media-body">
                            <div>
                                <h5 class="mt-0">${member.user.first_name} ${member.user.last_name}</h5>
                                <h6>${member.role || 'Member'}</h6>
                            </div>
                        </div>
                    </div>
                    <div class="action-btns">
                        <button type="button" class="btn btn-solid btn-sm" onclick="singleAboutPage.viewProfile(${member.user.id})">View</button>
                        ${this.group.owner_id === this.currentUser.id && member.user.id !== this.currentUser.id ? `
                            <button type="button" class="btn btn-outline btn-sm ms-1" onclick="singleAboutPage.removeMember(${member.user.id})">Remove</button>
                        ` : ''}
                    </div>
                </li>
            `).join('');

            membersContainer.innerHTML = `
                <div class="card-title">
                    <h3>Members (${filteredMembers.length})</h3>
                    <div class="card-title-right">
                        <a href="single-page.html?group=${this.group.id}" class="btn btn-sm btn-outline-primary">View All</a>
                    </div>
                </div>
                <div class="container-fluid">
                    <ul class="friend-list">
                        ${membersList}
                    </ul>
                </div>
            `;
        }
    }

    async toggleMembership() {
        try {
            const isMember = this.group.members && this.group.members.some(member => member.user_id === this.currentUser.id);
            
            if (isMember) {
                await api.groups.leave(this.group.id);
                this.showNotification('Left group successfully', 'success');
            } else {
                await api.groups.join(this.group.id);
                this.showNotification('Joined group successfully', 'success');
            }
            
            // Reload group data
            this.group = await api.groups.getById(this.group.id);
            this.loadGroupData();
            this.loadMembers();
            
        } catch (error) {
            console.error('Error toggling membership:', error);
            this.showNotification('Error updating membership', 'error');
        }
    }

    async removeMember(userId) {
        if (!confirm('Are you sure you want to remove this member from the group?')) return;

        try {
            await api.groups.removeMember(this.group.id, userId);
            this.showNotification('Member removed successfully', 'success');
            await this.loadMembers();
        } catch (error) {
            console.error('Error removing member:', error);
            this.showNotification('Error removing member', 'error');
        }
    }

    viewProfile(userId) {
        window.location.href = `profile-tab.html?user=${userId}`;
    }

    sendMessage() {
        // Navigate to messenger with group
        window.location.href = `messanger.html?group=${this.group.id}`;
    }

    editGroup() {
        // Navigate to group edit page
        window.location.href = `single-page.html?group=${this.group.id}&edit=true`;
    }

    updatePageTitle() {
        if (this.group) {
            document.title = `${this.group.name} - About - VibeCircles`;
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

// Initialize single about page
let singleAboutPage;
document.addEventListener('DOMContentLoaded', () => {
    singleAboutPage = new SingleAboutPage();
});

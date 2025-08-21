// Page List functionality
class PageListPage {
    constructor() {
        this.api = new VibeCirclesAPI();
        this.currentUserId = null;
        this.groups = [];
        this.currentTab = 'followed'; // default tab
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

            await this.loadGroups();
            this.setupEventListeners();
            this.updatePageTitle();

        } catch (error) {
            console.error('Page list page init error:', error);
            this.showNotification('Failed to load pages', 'error');
        }
    }

    async loadGroups() {
        try {
            const response = await this.api.groups.getAll();
            this.groups = response.data.groups || [];
            this.renderGroups();
        } catch (error) {
            console.error('Load groups error:', error);
            this.renderGroups([]);
        }
    }

    renderGroups() {
        const groupsContainer = document.querySelector('.page-list-section .row');
        if (!groupsContainer) return;

        // Clear existing content except the create page button
        const createPageButton = groupsContainer.querySelector('.create-page').parentElement;
        groupsContainer.innerHTML = '';
        groupsContainer.appendChild(createPageButton);

        if (this.groups.length === 0) {
            const noGroupsHTML = `
                <div class="col-12">
                    <div class="text-center">
                        <p>No pages to display yet.</p>
                        <button type="button" class="btn btn-solid btn-sm" onclick="pageListPage.createPage()">Create Page</button>
                    </div>
                </div>
            `;
            groupsContainer.insertAdjacentHTML('beforeend', noGroupsHTML);
            return;
        }

        const groupsHTML = this.groups.map(group => `
            <div class="col-xl-3 col-lg-4 col-sm-6">
                <div class="list-box">
                    <div class="cover-img">
                        <img src="${group.cover_image_url || '../assets/images/cover/9.jpg'}" 
                             class="img-fluid blur-up lazyload bg-img" alt="${group.name}">
                        <div class="logo-img">
                            <a href="single-page.html?id=${group.id}">
                                <img src="${group.avatar_url || '../assets/images/pages-logo/6.png'}" 
                                     class="img-fluid blur-up lazyload bg-img" alt="${group.name}">
                            </a>
                        </div>
                    </div>
                    <div class="list-content">
                        <div class="page-name">
                            <a href="single-page.html?id=${group.id}">
                                <h4>${group.name}</h4>
                            </a>
                            <h6>${group.description || 'No description'}</h6>
                        </div>
                        <div class="counter-stats">
                            <ul>
                                <li>
                                    <h3 class="counter-value">${group.members_count || 0}</h3>
                                    <h5>members</h5>
                                </li>
                                <li>
                                    <h3 class="counter-value">${group.posts_count || 0}</h3>
                                    <h5>posts</h5>
                                </li>
                                <li>
                                    <h3 class="counter-value">${group.followers_count || 0}</h3>
                                    <h5>followers</h5>
                                </li>
                            </ul>
                        </div>
                        <div class="bottom-btn">
                            ${group.is_member ? 
                                `<button type="button" class="btn btn-solid" onclick="pageListPage.leaveGroup(${group.id})">Leave</button>` :
                                `<button type="button" class="btn btn-outline" onclick="pageListPage.joinGroup(${group.id})">Join</button>`
                            }
                            <button type="button" class="btn btn-solid" onclick="pageListPage.inviteToGroup(${group.id})">Invite</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        groupsContainer.insertAdjacentHTML('beforeend', groupsHTML);

        if (window.feather) {
            feather.replace();
        }
    }

    updatePageTitle() {
        const titleElement = document.querySelector('.event-content h1');
        if (titleElement) {
            titleElement.textContent = 'Groups & Pages';
        }
    }

    setupEventListeners() {
        // Tab switching
        const tabLinks = document.querySelectorAll('.profile-menu ul li a');
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.target.textContent.toLowerCase().replace(/\s+/g, '');
                this.switchTab(tab);
            });
        });

        // Search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterGroups(e.target.value);
            });
        }
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update active tab
        const tabLinks = document.querySelectorAll('.profile-menu ul li');
        tabLinks.forEach(li => li.classList.remove('active'));
        
        const activeTab = Array.from(tabLinks).find(li => 
            li.querySelector('a h6').textContent.toLowerCase().replace(/\s+/g, '') === tab
        );
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Load appropriate data based on tab
        switch (tab) {
            case 'topsuggestions':
                this.loadTopSuggestions();
                break;
            case 'invitation':
                this.loadInvitations();
                break;
            case 'followedpages':
                this.loadFollowedPages();
                break;
            case 'yourpages':
                this.loadUserPages();
                break;
            default:
                this.loadGroups();
        }
    }

    async loadTopSuggestions() {
        try {
            const response = await this.api.groups.getAll({ suggested: true });
            this.groups = response.data.groups || [];
            this.renderGroups();
        } catch (error) {
            console.error('Load suggestions error:', error);
            this.renderGroups([]);
        }
    }

    async loadInvitations() {
        try {
            const response = await this.api.groups.getAll({ invitations: true });
            this.groups = response.data.groups || [];
            this.renderGroups();
        } catch (error) {
            console.error('Load invitations error:', error);
            this.renderGroups([]);
        }
    }

    async loadFollowedPages() {
        try {
            const response = await this.api.groups.getAll({ followed: true });
            this.groups = response.data.groups || [];
            this.renderGroups();
        } catch (error) {
            console.error('Load followed pages error:', error);
            this.renderGroups([]);
        }
    }

    async loadUserPages() {
        try {
            const response = await this.api.groups.getAll({ owned: true });
            this.groups = response.data.groups || [];
            this.renderGroups();
        } catch (error) {
            console.error('Load user pages error:', error);
            this.renderGroups([]);
        }
    }

    filterGroups(searchTerm) {
        const filteredGroups = this.groups.filter(group => {
            const name = group.name || '';
            const description = group.description || '';
            return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   description.toLowerCase().includes(searchTerm.toLowerCase());
        });

        this.renderFilteredGroups(filteredGroups);
    }

    renderFilteredGroups(groups) {
        const groupsContainer = document.querySelector('.page-list-section .row');
        if (!groupsContainer) return;

        // Clear existing content except the create page button
        const createPageButton = groupsContainer.querySelector('.create-page').parentElement;
        groupsContainer.innerHTML = '';
        groupsContainer.appendChild(createPageButton);

        if (groups.length === 0) {
            const noGroupsHTML = `
                <div class="col-12">
                    <div class="text-center">
                        <p>No pages match your search.</p>
                    </div>
                </div>
            `;
            groupsContainer.insertAdjacentHTML('beforeend', noGroupsHTML);
            return;
        }

        const groupsHTML = groups.map(group => `
            <div class="col-xl-3 col-lg-4 col-sm-6">
                <div class="list-box">
                    <div class="cover-img">
                        <img src="${group.cover_image_url || '../assets/images/cover/9.jpg'}" 
                             class="img-fluid blur-up lazyload bg-img" alt="${group.name}">
                        <div class="logo-img">
                            <a href="single-page.html?id=${group.id}">
                                <img src="${group.avatar_url || '../assets/images/pages-logo/6.png'}" 
                                     class="img-fluid blur-up lazyload bg-img" alt="${group.name}">
                            </a>
                        </div>
                    </div>
                    <div class="list-content">
                        <div class="page-name">
                            <a href="single-page.html?id=${group.id}">
                                <h4>${group.name}</h4>
                            </a>
                            <h6>${group.description || 'No description'}</h6>
                        </div>
                        <div class="counter-stats">
                            <ul>
                                <li>
                                    <h3 class="counter-value">${group.members_count || 0}</h3>
                                    <h5>members</h5>
                                </li>
                                <li>
                                    <h3 class="counter-value">${group.posts_count || 0}</h3>
                                    <h5>posts</h5>
                                </li>
                                <li>
                                    <h3 class="counter-value">${group.followers_count || 0}</h3>
                                    <h5>followers</h5>
                                </li>
                            </ul>
                        </div>
                        <div class="bottom-btn">
                            ${group.is_member ? 
                                `<button type="button" class="btn btn-solid" onclick="pageListPage.leaveGroup(${group.id})">Leave</button>` :
                                `<button type="button" class="btn btn-outline" onclick="pageListPage.joinGroup(${group.id})">Join</button>`
                            }
                            <button type="button" class="btn btn-solid" onclick="pageListPage.inviteToGroup(${group.id})">Invite</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        groupsContainer.insertAdjacentHTML('beforeend', groupsHTML);

        if (window.feather) {
            feather.replace();
        }
    }

    createPage() {
        const name = prompt('Enter page name:');
        if (!name) return;

        const description = prompt('Enter page description:');
        if (!description) return;

        this.api.groups.create({
            name,
            description,
            privacy: 'public'
        }).then(response => {
            this.showNotification('Page created successfully', 'success');
            this.loadGroups();
        }).catch(error => {
            console.error('Create page error:', error);
            this.showNotification('Failed to create page', 'error');
        });
    }

    async joinGroup(groupId) {
        try {
            await this.api.groups.join(groupId);
            this.showNotification('Successfully joined the group', 'success');
            this.loadGroups();
        } catch (error) {
            console.error('Join group error:', error);
            this.showNotification('Failed to join group', 'error');
        }
    }

    async leaveGroup(groupId) {
        if (!confirm('Are you sure you want to leave this group?')) {
            return;
        }

        try {
            await this.api.groups.leave(groupId);
            this.showNotification('Successfully left the group', 'success');
            this.loadGroups();
        } catch (error) {
            console.error('Leave group error:', error);
            this.showNotification('Failed to leave group', 'error');
        }
    }

    inviteToGroup(groupId) {
        const email = prompt('Enter email address to invite:');
        if (!email) return;

        // This would need an invite API endpoint
        this.showNotification('Invitation sent successfully', 'success');
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

let pageListPage;
document.addEventListener('DOMContentLoaded', () => {
    pageListPage = new PageListPage();
});

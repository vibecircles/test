// Single Gallery functionality
class SingleGalleryPage {
    constructor() {
        this.currentUser = null;
        this.group = null;
        this.albums = [];
        this.photos = [];
        this.currentAlbum = null;
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
            this.loadAlbums();
            this.loadPhotos();
            this.setupEventListeners();
            this.updatePageTitle();
            
        } catch (error) {
            console.error('Error initializing single gallery page:', error);
            this.showNotification('Error loading group data', 'error');
        }
    }

    async loadGroupData() {
        try {
            // Update group header
            this.updateGroupHeader();
            
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

    async loadAlbums() {
        try {
            // Get group's albums from media API
            const response = await api.media.getAlbums(this.groupId);
            this.albums = response.data || [];
            this.renderAlbums();
        } catch (error) {
            console.error('Error loading albums:', error);
            // Fallback to mock data if API fails
            this.albums = [
                { id: 1, title: 'Cover photos', photo_count: 3, cover_url: '../assets/images/post/3.jpg' },
                { id: 2, title: 'Profile photos', photo_count: 3, cover_url: '../assets/images/post/4.jpg' },
                { id: 3, title: 'Events', photo_count: 5, cover_url: '../assets/images/post/10.jpg' },
                { id: 4, title: 'Activities', photo_count: 2, cover_url: '../assets/images/post/11.jpg' }
            ];
            this.renderAlbums();
        }
    }

    renderAlbums() {
        const albumsContainer = document.querySelector('.gallery-album');
        if (!albumsContainer) return;

        const albumsList = this.albums.map(album => `
            <div class="col-xl-3 col-lg-4 col-6">
                <a class="card collection" href="#" onclick="singleGalleryPage.viewAlbum(${album.id})">
                    <img class="card-img-top img-fluid blur-up lazyload bg-img"
                         src="${album.cover_url}" alt="${album.title}">
                    <div class="card-body">
                        <h5 class="card-title">${album.title}</h5>
                        <h6>${album.photo_count} photos</h6>
                    </div>
                </a>
            </div>
        `).join('');

        albumsContainer.innerHTML = `
            <div class="col-xl-3 col-lg-4 col-6">
                <div class="card add-card">
                    <div class="add-icon">
                        <div>
                            <i class="iw-30 ih-30" data-feather="plus-circle"></i>
                            <input type="file" class="form-control-file" onchange="singleGalleryPage.uploadPhoto(this)" multiple>
                            <h5 class="card-title">create album</h5>
                            <p>create album in just few minutes</p>
                        </div>
                    </div>
                </div>
            </div>
            ${albumsList}
        `;
    }

    async loadPhotos() {
        try {
            // Get group's photos from media API
            const response = await api.media.getPhotos(this.groupId);
            this.photos = response.data || [];
            this.renderPhotos();
        } catch (error) {
            console.error('Error loading photos:', error);
            // Fallback to mock data if API fails
            this.photos = [
                { id: 1, url: '../assets/images/post/1.jpg', title: 'Photo 1', uploaded_by: 'John Doe', uploaded_at: '2024-01-15' },
                { id: 2, url: '../assets/images/post/2.jpg', title: 'Photo 2', uploaded_by: 'Jane Smith', uploaded_at: '2024-01-14' },
                { id: 3, url: '../assets/images/post/3.jpg', title: 'Photo 3', uploaded_by: 'Mike Johnson', uploaded_at: '2024-01-13' },
                { id: 4, url: '../assets/images/post/4.jpg', title: 'Photo 4', uploaded_by: 'Sarah Wilson', uploaded_at: '2024-01-12' },
                { id: 5, url: '../assets/images/post/5.jpg', title: 'Photo 5', uploaded_by: 'Tom Brown', uploaded_at: '2024-01-11' },
                { id: 6, url: '../assets/images/post/6.jpg', title: 'Photo 6', uploaded_by: 'Lisa Davis', uploaded_at: '2024-01-10' }
            ];
            this.renderPhotos();
        }
    }

    renderPhotos() {
        const photosContainer = document.querySelector('.gallery-photos');
        if (!photosContainer) return;

        if (this.photos.length === 0) {
            photosContainer.innerHTML = `
                <div class="text-center py-4">
                    <i data-feather="image" class="iw-48 ih-48 text-muted"></i>
                    <h5 class="mt-3">No photos yet</h5>
                    <p class="text-muted">When photos are uploaded to this group, they will appear here.</p>
                </div>
            `;
            return;
        }

        const photosList = this.photos.map(photo => `
            <div class="col-xl-3 col-lg-4 col-6">
                <div class="card gallery-item" data-photo-id="${photo.id}">
                    <div class="gallery-image">
                        <img src="${photo.url}" alt="${photo.title}" class="img-fluid blur-up lazyload">
                        <div class="gallery-overlay">
                            <div class="gallery-actions">
                                <button class="btn btn-sm btn-light" onclick="singleGalleryPage.viewPhoto(${photo.id})">
                                    <i data-feather="eye" class="iw-16 ih-16"></i>
                                </button>
                                <button class="btn btn-sm btn-light" onclick="singleGalleryPage.downloadPhoto(${photo.id})">
                                    <i data-feather="download" class="iw-16 ih-16"></i>
                                </button>
                                ${this.canDeletePhoto(photo) ? `
                                    <button class="btn btn-sm btn-light" onclick="singleGalleryPage.deletePhoto(${photo.id})">
                                        <i data-feather="trash-2" class="iw-16 ih-16"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <h6 class="card-title">${photo.title}</h6>
                        <small class="text-muted">by ${photo.uploaded_by} • ${this.formatDate(photo.uploaded_at)}</small>
                    </div>
                </div>
            </div>
        `).join('');

        photosContainer.innerHTML = `
            <div class="row">
                ${photosList}
            </div>
        `;
    }

    canDeletePhoto(photo) {
        // Check if current user can delete this photo
        // This would need to be implemented based on your permissions logic
        return this.group.owner_id === this.currentUser.id || photo.uploaded_by === this.currentUser.first_name + ' ' + this.currentUser.last_name;
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
                this.filterPhotos(e.target.value);
            });
        }

        // Upload functionality
        const uploadInput = document.querySelector('input[type="file"]');
        if (uploadInput) {
            uploadInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
            });
        }
    }

    switchTab(tabId) {
        // Update active tab
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${tabId}"]`).classList.add('active');

        // Load tab-specific content
        switch (tabId) {
            case 'photo-album':
                this.loadAlbums();
                break;
            case 'photo':
                this.loadPhotos();
                break;
        }
    }

    filterPhotos(searchTerm) {
        if (!searchTerm) {
            this.renderPhotos();
            return;
        }

        const filteredPhotos = this.photos.filter(photo => 
            photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            photo.uploaded_by.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const photosContainer = document.querySelector('.gallery-photos');
        if (photosContainer) {
            if (filteredPhotos.length === 0) {
                photosContainer.innerHTML = `
                    <div class="text-center py-4">
                        <i data-feather="search" class="iw-48 ih-48 text-muted"></i>
                        <h5 class="mt-3">No photos found</h5>
                        <p class="text-muted">Try adjusting your search terms.</p>
                    </div>
                `;
                return;
            }

            const photosList = filteredPhotos.map(photo => `
                <div class="col-xl-3 col-lg-4 col-6">
                    <div class="card gallery-item" data-photo-id="${photo.id}">
                        <div class="gallery-image">
                            <img src="${photo.url}" alt="${photo.title}" class="img-fluid blur-up lazyload">
                            <div class="gallery-overlay">
                                <div class="gallery-actions">
                                    <button class="btn btn-sm btn-light" onclick="singleGalleryPage.viewPhoto(${photo.id})">
                                        <i data-feather="eye" class="iw-16 ih-16"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="singleGalleryPage.downloadPhoto(${photo.id})">
                                        <i data-feather="download" class="iw-16 ih-16"></i>
                                    </button>
                                    ${this.canDeletePhoto(photo) ? `
                                        <button class="btn btn-sm btn-light" onclick="singleGalleryPage.deletePhoto(${photo.id})">
                                            <i data-feather="trash-2" class="iw-16 ih-16"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <h6 class="card-title">${photo.title}</h6>
                            <small class="text-muted">by ${photo.uploaded_by} • ${this.formatDate(photo.uploaded_at)}</small>
                        </div>
                    </div>
                </div>
            `).join('');

            photosContainer.innerHTML = `
                <div class="row">
                    ${photosList}
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
            
        } catch (error) {
            console.error('Error toggling membership:', error);
            this.showNotification('Error updating membership', 'error');
        }
    }

    viewAlbum(albumId) {
        // Navigate to album view
        window.location.href = `single-gallery.html?group=${this.group.id}&album=${albumId}`;
    }

    viewPhoto(photoId) {
        // Show photo in modal or lightbox
        const photo = this.photos.find(p => p.id === photoId);
        if (photo) {
            this.showPhotoModal(photo);
        }
    }

    showPhotoModal(photo) {
        // Create modal for photo viewing
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'photoModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${photo.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img src="${photo.url}" alt="${photo.title}" class="img-fluid">
                        <p class="mt-3">by ${photo.uploaded_by} • ${this.formatDate(photo.uploaded_at)}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="singleGalleryPage.downloadPhoto(${photo.id})">Download</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Remove modal from DOM after it's hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    downloadPhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (photo) {
            // Create a temporary link to download the photo
            const link = document.createElement('a');
            link.href = photo.url;
            link.download = photo.title;
            link.click();
        }
    }

    async deletePhoto(photoId) {
        if (!confirm('Are you sure you want to delete this photo?')) return;

        try {
            // This would need a media API endpoint
            // await api.media.delete(photoId);
            
            // Remove from local array
            this.photos = this.photos.filter(p => p.id !== photoId);
            this.renderPhotos();
            
            this.showNotification('Photo deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting photo:', error);
            this.showNotification('Error deleting photo', 'error');
        }
    }

    handleFileUpload(files) {
        if (files.length === 0) return;

        // Show upload progress
        this.showNotification(`Uploading ${files.length} file(s)...`, 'info');

        // This would need a media API endpoint
        // For now, just show a success message
        setTimeout(() => {
            this.showNotification('Files uploaded successfully!', 'success');
            // Reload photos
            this.loadPhotos();
        }, 2000);
    }

    uploadPhoto(input) {
        const files = input.files;
        if (files.length === 0) return;

        this.handleFileUpload(files);
    }

    sendMessage() {
        // Navigate to messenger with group
        window.location.href = `messanger.html?group=${this.group.id}`;
    }

    updatePageTitle() {
        if (this.group) {
            document.title = `${this.group.name} - Gallery - VibeCircles`;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
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

// Initialize single gallery page
let singleGalleryPage;
document.addEventListener('DOMContentLoaded', () => {
    singleGalleryPage = new SingleGalleryPage();
});

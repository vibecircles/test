class ProfileGalleryPage {
    constructor() {
        this.api = new VibeCirclesAPI();
        this.currentUserId = null;
        this.profileUserId = null;
        this.albums = [];
        this.photos = [];
        this.currentTab = 'albums';
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

            // Load gallery data
            await this.loadAlbums();
            await this.loadPhotos();
            this.setupEventListeners();
            this.updatePageTitle();

        } catch (error) {
            console.error('Profile gallery page init error:', error);
            this.showNotification('Failed to load gallery data', 'error');
        }
    }

    async loadAlbums() {
        try {
            const response = await this.api.media.getAlbums(this.profileUserId);
            this.albums = response.data.albums || [];
            
            this.renderAlbums();
        } catch (error) {
            console.error('Load albums error:', error);
            this.renderAlbums([]);
        }
    }

    async loadPhotos() {
        try {
            const response = await this.api.media.getPhotos(this.profileUserId, 20);
            this.photos = response.data.photos || [];
            
            this.renderPhotos();
        } catch (error) {
            console.error('Load photos error:', error);
            this.renderPhotos([]);
        }
    }

    renderAlbums() {
        const albumsContainer = document.querySelector('.gallery-album');
        if (!albumsContainer) return;

        if (this.albums.length === 0) {
            albumsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="card collection">
                        <div class="card-body">
                            <h5 class="card-title">No Albums Yet</h5>
                            <h6>This user hasn't created any albums yet.</h6>
                            ${this.profileUserId === this.currentUserId ? 
                                '<button type="button" class="btn btn-solid btn-sm mt-2" onclick="profileGalleryPage.createAlbum()">Create Album</button>' : 
                                ''
                            }
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        let albumsHTML = '';

        // Add "Create Album" button if it's the current user's gallery
        if (this.profileUserId === this.currentUserId) {
            albumsHTML += `
                <div class="col-xl-3 col-lg-4 col-6">
                    <a class="card add-card" onclick="profileGalleryPage.createAlbum()">
                        <div class="card-body text-center">
                            <i data-feather="plus" class="iw-24 ih-24"></i>
                            <h6 class="mt-2">Create Album</h6>
                        </div>
                    </a>
                </div>
            `;
        }

        // Add albums
        albumsHTML += this.albums.map(album => `
            <div class="col-xl-3 col-lg-4 col-6">
                <a class="card collection" onclick="profileGalleryPage.openAlbum(${album.id})">
                    <div class="card-body">
                        <h5 class="card-title">${album.title || 'Untitled Album'}</h5>
                        <h6>${album.description || 'No description'}</h6>
                        <small class="text-muted">Created ${this.formatDate(album.created_at)}</small>
                        ${this.profileUserId === this.currentUserId ? 
                            `<div class="mt-2">
                                <button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation(); profileGalleryPage.editAlbum(${album.id})">Edit</button>
                                <button type="button" class="btn btn-outline btn-sm ms-1" onclick="event.stopPropagation(); profileGalleryPage.deleteAlbum(${album.id})">Delete</button>
                            </div>` : 
                            ''
                        }
                    </div>
                </a>
            </div>
        `).join('');

        albumsContainer.innerHTML = albumsHTML;

        // Reinitialize feather icons
        if (window.feather) {
            feather.replace();
        }
    }

    renderPhotos() {
        const photosContainer = document.querySelector('.gallery-photo');
        if (!photosContainer) return;

        if (this.photos.length === 0) {
            photosContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p>No photos uploaded yet.</p>
                    ${this.profileUserId === this.currentUserId ? 
                        '<button type="button" class="btn btn-solid btn-sm" onclick="profileGalleryPage.uploadPhoto()">Upload Photo</button>' : 
                        ''
                    }
                </div>
            `;
            return;
        }

        const photosHTML = this.photos.map(photo => `
            <div class="col-xl-3 col-lg-4 col-6">
                <div class="gallery-box">
                    <img src="${photo.file_url}" alt="${photo.title || 'Photo'}" class="img-fluid">
                    <div class="gallery-overlay">
                        <div class="overlay-content">
                            <h5>${photo.title || 'Untitled'}</h5>
                            <p>${photo.description || ''}</p>
                            <div class="overlay-buttons">
                                <button type="button" class="btn btn-light btn-sm" onclick="profileGalleryPage.viewPhoto(${photo.id})">
                                    <i data-feather="eye"></i>
                                </button>
                                ${this.profileUserId === this.currentUserId ? 
                                    `<button type="button" class="btn btn-light btn-sm" onclick="profileGalleryPage.editPhoto(${photo.id})">
                                        <i data-feather="edit"></i>
                                    </button>
                                    <button type="button" class="btn btn-light btn-sm" onclick="profileGalleryPage.deletePhoto(${photo.id})">
                                        <i data-feather="trash-2"></i>
                                    </button>` : 
                                    ''
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        photosContainer.innerHTML = photosHTML;

        // Reinitialize feather icons
        if (window.feather) {
            feather.replace();
        }
    }

    updatePageTitle() {
        const titleElement = document.querySelector('.gallery-page-section .card-title h3');
        if (titleElement) {
            titleElement.textContent = this.profileUserId === this.currentUserId ? 
                'My Gallery' : 'Gallery';
        }

        // Update page title
        document.title = this.profileUserId === this.currentUserId ? 
            'My Gallery | VibeCircles' : 'Gallery | VibeCircles';
    }

    setupEventListeners() {
        // Tab switching
        const tabLinks = document.querySelectorAll('.nav-tabs .nav-link');
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href');
                this.switchTab(target);
            });
        });

        // Search functionality
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterContent(e.target.value);
            });
        }
    }

    switchTab(target) {
        // Update active tab
        document.querySelectorAll('.nav-tabs .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="${target}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('show', 'active');
        });
        document.querySelector(target).classList.add('show', 'active');

        // Update current tab
        this.currentTab = target === '#photo-album' ? 'albums' : 'photos';
    }

    filterContent(searchTerm) {
        if (this.currentTab === 'albums') {
            this.filterAlbums(searchTerm);
        } else {
            this.filterPhotos(searchTerm);
        }
    }

    filterAlbums(searchTerm) {
        const filteredAlbums = this.albums.filter(album => {
            const title = album.title || '';
            const description = album.description || '';
            const searchLower = searchTerm.toLowerCase();
            
            return title.toLowerCase().includes(searchLower) || 
                   description.toLowerCase().includes(searchLower);
        });

        this.renderFilteredAlbums(filteredAlbums);
    }

    filterPhotos(searchTerm) {
        const filteredPhotos = this.photos.filter(photo => {
            const title = photo.title || '';
            const description = photo.description || '';
            const searchLower = searchTerm.toLowerCase();
            
            return title.toLowerCase().includes(searchLower) || 
                   description.toLowerCase().includes(searchLower);
        });

        this.renderFilteredPhotos(filteredPhotos);
    }

    renderFilteredAlbums(albums) {
        const albumsContainer = document.querySelector('.gallery-album');
        if (!albumsContainer) return;

        if (albums.length === 0) {
            albumsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p>No albums match your search criteria.</p>
                </div>
            `;
            return;
        }

        const albumsHTML = albums.map(album => `
            <div class="col-xl-3 col-lg-4 col-6">
                <a class="card collection" onclick="profileGalleryPage.openAlbum(${album.id})">
                    <div class="card-body">
                        <h5 class="card-title">${album.title || 'Untitled Album'}</h5>
                        <h6>${album.description || 'No description'}</h6>
                        <small class="text-muted">Created ${this.formatDate(album.created_at)}</small>
                    </div>
                </a>
            </div>
        `).join('');

        albumsContainer.innerHTML = albumsHTML;
    }

    renderFilteredPhotos(photos) {
        const photosContainer = document.querySelector('.gallery-photo');
        if (!photosContainer) return;

        if (photos.length === 0) {
            photosContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p>No photos match your search criteria.</p>
                </div>
            `;
            return;
        }

        const photosHTML = photos.map(photo => `
            <div class="col-xl-3 col-lg-4 col-6">
                <div class="gallery-box">
                    <img src="${photo.file_url}" alt="${photo.title || 'Photo'}" class="img-fluid">
                    <div class="gallery-overlay">
                        <div class="overlay-content">
                            <h5>${photo.title || 'Untitled'}</h5>
                            <p>${photo.description || ''}</p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        photosContainer.innerHTML = photosHTML;
    }

    // Album management methods
    createAlbum() {
        const title = prompt('Enter album title:');
        if (!title) return;

        const description = prompt('Enter album description (optional):');
        
        this.api.media.createAlbum({
            title,
            description: description || '',
            privacy: 'public'
        }).then(response => {
            this.showNotification('Album created successfully', 'success');
            this.loadAlbums();
        }).catch(error => {
            console.error('Create album error:', error);
            this.showNotification('Failed to create album', 'error');
        });
    }

    editAlbum(albumId) {
        const album = this.albums.find(a => a.id === albumId);
        if (!album) return;

        const title = prompt('Enter new album title:', album.title);
        if (!title) return;

        const description = prompt('Enter new album description:', album.description);
        
        this.api.media.updateAlbum(albumId, {
            title,
            description: description || ''
        }).then(response => {
            this.showNotification('Album updated successfully', 'success');
            this.loadAlbums();
        }).catch(error => {
            console.error('Update album error:', error);
            this.showNotification('Failed to update album', 'error');
        });
    }

    deleteAlbum(albumId) {
        if (!confirm('Are you sure you want to delete this album? This will also delete all photos in the album.')) {
            return;
        }

        this.api.media.deleteAlbum(albumId).then(response => {
            this.showNotification('Album deleted successfully', 'success');
            this.loadAlbums();
        }).catch(error => {
            console.error('Delete album error:', error);
            this.showNotification('Failed to delete album', 'error');
        });
    }

    openAlbum(albumId) {
        // This would open the album in a modal or navigate to album page
        this.showNotification('Album view functionality coming soon', 'info');
    }

    // Photo management methods
    uploadPhoto() {
        // This would open a file upload dialog
        this.showNotification('Photo upload functionality coming soon', 'info');
    }

    editPhoto(photoId) {
        const photo = this.photos.find(p => p.id === photoId);
        if (!photo) return;

        const title = prompt('Enter new photo title:', photo.title);
        if (title === null) return;

        const description = prompt('Enter new photo description:', photo.description);
        
        this.api.media.updatePhoto(photoId, {
            title: title || '',
            description: description || ''
        }).then(response => {
            this.showNotification('Photo updated successfully', 'success');
            this.loadPhotos();
        }).catch(error => {
            console.error('Update photo error:', error);
            this.showNotification('Failed to update photo', 'error');
        });
    }

    deletePhoto(photoId) {
        if (!confirm('Are you sure you want to delete this photo?')) {
            return;
        }

        this.api.media.deletePhoto(photoId).then(response => {
            this.showNotification('Photo deleted successfully', 'success');
            this.loadPhotos();
        }).catch(error => {
            console.error('Delete photo error:', error);
            this.showNotification('Failed to delete photo', 'error');
        });
    }

    viewPhoto(photoId) {
        // This would open the photo in a lightbox/modal
        this.showNotification('Photo view functionality coming soon', 'info');
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
let profileGalleryPage;
document.addEventListener('DOMContentLoaded', () => {
    profileGalleryPage = new ProfileGalleryPage();
});

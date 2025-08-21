// Single Reviews functionality
class SingleReviewsPage {
    constructor() {
        this.currentUser = null;
        this.groupId = null;
        this.groupData = null;
        this.reviews = [];
        this.currentTab = 'most-helpful';
        this.init();
    }

    async init() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            this.currentUser = await api.auth.getCurrentUser();
            if (!this.currentUser) {
                window.location.href = '/login.html';
                return;
            }

            const urlParams = new URLSearchParams(window.location.search);
            this.groupId = urlParams.get('id') || '1';

            await this.loadPageData();
            this.setupEventListeners();
            this.updatePageTitle();
        } catch (error) {
            console.error('Error initializing single reviews page:', error);
            this.showNotification('Error loading page data', 'error');
        }
    }

    async loadPageData() {
        try {
            await this.loadGroupDetails();
            await this.loadReviews();
            this.renderGroupDetails();
            this.renderReviews();
            this.renderReviewStats();
        } catch (error) {
            console.error('Error loading page data:', error);
            this.showNotification('Error loading page data', 'error');
        }
    }

    async loadGroupDetails() {
        try {
            this.groupData = await api.groups.getById(this.groupId);
        } catch (error) {
            this.groupData = {
                id: this.groupId,
                name: 'Dance Academy',
                email: 'danceacademy@gmail.com',
                cover_image: '../assets/images/cover/3.jpg',
                logo: '../assets/images/pages-logo/6.jpg',
                followers_count: 954,
                following_count: 56,
                posts_count: 36,
                likes_count: 968,
                location: 'USA',
                rating: 4.6,
                total_reviews: 22
            };
        }
    }

    async loadReviews() {
        this.reviews = [
            {
                id: 1,
                user: {
                    id: 1,
                    name: 'Sufiya Eliza',
                    avatar: '../assets/images/user-sm/15.jpg'
                },
                rating: 5,
                content: 'Amazing dance academy! The instructors are professional and the classes are well-structured.',
                created_at: new Date(Date.now() - 30 * 60 * 1000),
                helpful_count: 75,
                comments_count: 4565,
                shares_count: 985,
                recommends: true,
                comments: []
            }
        ];
    }

    renderGroupDetails() {
        if (!this.groupData) return;

        const groupName = document.querySelector('.page-name h4');
        const groupEmail = document.querySelector('.page-name h6');
        if (groupName) groupName.textContent = this.groupData.name;
        if (groupEmail) groupEmail.textContent = this.groupData.email;

        const stats = document.querySelectorAll('.page-stats ul li h2');
        if (stats.length >= 4) {
            stats[0].textContent = this.groupData.following_count || 56;
            stats[1].textContent = this.groupData.followers_count || 954;
            stats[2].textContent = this.groupData.likes_count || 968;
            stats[3].textContent = this.groupData.posts_count || 36;
        }
    }

    renderReviewStats() {
        if (!this.groupData) return;

        const ratingElement = document.querySelector('.review-content h2');
        const ratingText = document.querySelector('.review-content h4');
        
        if (ratingElement) ratingElement.textContent = this.groupData.rating || 4.6;
        if (ratingText) ratingText.textContent = `based on ${this.groupData.total_reviews || 22} ratings`;

        const stars = document.querySelectorAll('.ratings li i');
        const rating = Math.floor(this.groupData.rating || 4.6);
        
        stars.forEach((star, index) => {
            star.className = index < rating ? 'fas fa-star' : 'far fa-star';
        });
    }

    renderReviews() {
        const reviewsContainer = document.querySelector('.post-wrapper');
        if (!reviewsContainer) return;

        this.reviews.forEach(review => {
            const reviewElement = this.createReviewElement(review);
            reviewsContainer.appendChild(reviewElement);
        });

        if (window.feather) {
            feather.replace();
        }
    }

    createReviewElement(review) {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'post-wrapper col-grid-box';
        reviewDiv.innerHTML = `
            <div class="post-title">
                <div class="profile">
                    <div class="media">
                        <div class="user-img">
                            <img src="${review.user.avatar}" class="img-fluid blur-up lazyload bg-img" alt="user">
                        </div>
                        <div class="media-body">
                            <h5>${this.escapeHtml(review.user.name)} 
                                <span>${review.recommends ? 'recommends' : 'doesn\'t recommend'} 
                                    <a href="#" onclick="singleReviewsPage.viewGroup()">${this.escapeHtml(this.groupData.name)}</a>
                                </span>
                            </h5>
                            <h6>${this.formatDate(review.created_at)}</h6>
                        </div>
                    </div>
                </div>
            </div>
            <div class="post-details">
                <div class="review-content">
                    <div class="rating-stars">
                        ${this.generateStars(review.rating)}
                    </div>
                    <p>${this.escapeHtml(review.content)}</p>
                </div>
                <div class="like-panel">
                    <div class="left-emoji">
                        <ul>
                            <li><img src="../assets/svg/emoji/040.svg" alt="smile"></li>
                            <li><img src="../assets/svg/emoji/113.svg" alt="heart"></li>
                        </ul>
                        <h6>+${review.helpful_count}</h6>
                    </div>
                    <div class="right-stats">
                        <ul>
                            <li>
                                <h5>
                                    <i class="iw-16 ih-16" data-feather="message-square"></i>
                                    <span>${review.comments_count}</span> comment
                                </h5>
                            </li>
                            <li>
                                <h5>
                                    <i class="iw-16 ih-16" data-feather="share"></i>
                                    <span>${review.shares_count}</span> share
                                </h5>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        return reviewDiv;
    }

    generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="${i <= rating ? 'fas' : 'far'} fa-star"></i>`;
        }
        return stars;
    }

    setupEventListeners() {
        const tabLinks = document.querySelectorAll('.profile-menu ul li a');
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.textContent.toLowerCase().replace(/\s+/g, '-');
                this.switchTab(tab);
            });
        });

        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterReviews(e.target.value);
            });
        }
    }

    switchTab(tab) {
        this.currentTab = tab;
        const tabLinks = document.querySelectorAll('.profile-menu ul li');
        tabLinks.forEach(link => link.classList.remove('active'));
        
        const activeLink = Array.from(tabLinks).find(link => 
            link.querySelector('a').textContent.toLowerCase().replace(/\s+/g, '-') === tab
        );
        if (activeLink) activeLink.classList.add('active');

        this.sortReviews(tab);
        this.renderReviews();
    }

    sortReviews(tab) {
        if (tab === 'most-helpful') {
            this.reviews.sort((a, b) => b.helpful_count - a.helpful_count);
        } else if (tab === 'most-recent') {
            this.reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
    }

    filterReviews(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderReviews();
            return;
        }

        const filteredReviews = this.reviews.filter(review => 
            review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.user.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.renderFilteredReviews(filteredReviews);
    }

    renderFilteredReviews(reviews) {
        const reviewsContainer = document.querySelector('.post-wrapper');
        if (!reviewsContainer) return;

        reviews.forEach(review => {
            const reviewElement = this.createReviewElement(review);
            reviewsContainer.appendChild(reviewElement);
        });

        if (window.feather) {
            feather.replace();
        }
    }

    viewGroup() {
        window.location.href = `/pages/single-page.html?id=${this.groupId}`;
    }

    updatePageTitle() {
        if (this.groupData) {
            document.title = `${this.groupData.name} - Reviews | VibeCircles`;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} days ago`;
        
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

let singleReviewsPage;
document.addEventListener('DOMContentLoaded', () => {
    singleReviewsPage = new SingleReviewsPage();
});

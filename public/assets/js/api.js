// VibeCircles API Client
class VibeCirclesAPI {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('vibecircles_token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('vibecircles_token', token);
        } else {
            localStorage.removeItem('vibecircles_token');
        }
    }

    // Get authentication token
    getToken() {
        return this.token;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }

    // Make API request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authorization header if token exists
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Handle authentication errors
                if (response.status === 401) {
                    this.setToken(null);
                    window.location.href = '/login';
                    return;
                }
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication API
    auth = {
        // Register new user
        register: async (userData) => {
            return await this.request('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        },

        // Login user
        login: async (credentials) => {
            const response = await this.request('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            
            if (response.success && response.data.token) {
                this.setToken(response.data.token);
            }
            
            return response;
        },

        // Get current user
        me: async () => {
            return await this.request('/api/auth/me');
        },

        // Update profile
        updateProfile: async (profileData) => {
            return await this.request('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
        },

        // Change password
        changePassword: async (passwordData) => {
            return await this.request('/api/auth/change-password', {
                method: 'PUT',
                body: JSON.stringify(passwordData)
            });
        },

        // Logout
        logout: async () => {
            const response = await this.request('/api/auth/logout', {
                method: 'POST'
            });
            this.setToken(null);
            return response;
        }
    };

    // Users API
    users = {
        // Get all users
        getAll: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/api/users?${queryString}`);
        },

        // Get user by ID
        getById: async (userId) => {
            return await this.request(`/api/users/${userId}`);
        },

        // Get user posts
        getPosts: async (userId, params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/api/users/${userId}/posts?${queryString}`);
        },

        // Send friend request
        sendFriendRequest: async (userId) => {
            return await this.request(`/api/users/${userId}/friend-request`, {
                method: 'POST'
            });
        },

        // Handle friend request
        handleFriendRequest: async (userId, action) => {
            return await this.request(`/api/users/${userId}/friend-request`, {
                method: 'PUT',
                body: JSON.stringify({ action })
            });
        },

        // Get user friends
        getFriends: async (userId, params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/api/users/${userId}/friends?${queryString}`);
        },

        // Get pending friend requests
        getPendingRequests: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/api/users/friend-requests/pending?${queryString}`);
        },

        // Remove friend
        removeFriend: async (userId) => {
            return await this.request(`/api/users/${userId}/friend`, {
                method: 'DELETE'
            });
        },

        // Block user
        blockUser: async (userId) => {
            return await this.request(`/api/users/${userId}/block`, {
                method: 'POST'
            });
        }
    };

    // Posts API
    posts = {
        // Get all posts
        getAll: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/api/posts?${queryString}`);
        },

        // Get post by ID
        getById: async (postId) => {
            return await this.request(`/api/posts/${postId}`);
        },

        // Create new post
        create: async (postData) => {
            return await this.request('/api/posts', {
                method: 'POST',
                body: JSON.stringify(postData)
            });
        },

        // Update post
        update: async (postId, postData) => {
            return await this.request(`/api/posts/${postId}`, {
                method: 'PUT',
                body: JSON.stringify(postData)
            });
        },

        // Delete post
        delete: async (postId) => {
            return await this.request(`/api/posts/${postId}`, {
                method: 'DELETE'
            });
        },

        // Like/unlike post
        toggleLike: async (postId) => {
            return await this.request(`/api/posts/${postId}/like`, {
                method: 'POST'
            });
        },

        // Add comment
        addComment: async (postId, commentData) => {
            return await this.request(`/api/posts/${postId}/comments`, {
                method: 'POST',
                body: JSON.stringify(commentData)
            });
        },

        // Get post comments
        getComments: async (postId, params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/api/posts/${postId}/comments?${queryString}`);
        }
    };

    // Events API
    events = {
        // Get all events
        getAll: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/api/events?${queryString}`);
        },

        // Get event by ID
        getById: async (eventId) => {
            return await this.request(`/api/events/${eventId}`);
        },

        // Create new event
        create: async (eventData) => {
            return await this.request('/api/events', {
                method: 'POST',
                body: JSON.stringify(eventData)
            });
        },

        // Update event
        update: async (eventId, eventData) => {
            return await this.request(`/api/events/${eventId}`, {
                method: 'PUT',
                body: JSON.stringify(eventData)
            });
        },

        // Delete event
        delete: async (eventId) => {
            return await this.request(`/api/events/${eventId}`, {
                method: 'DELETE'
            });
        },

        // RSVP to event
        rsvp: async (eventId, status) => {
            return await this.request(`/api/events/${eventId}/rsvp`, {
                method: 'POST',
                body: JSON.stringify({ status })
            });
        },

        // Get upcoming birthdays
        getUpcomingBirthdays: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/api/events/birthdays/upcoming?${queryString}`);
        },

        // Get event attendees
        getAttendees: async (eventId, params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/api/events/${eventId}/attendees?${queryString}`);
        }
    };

    // Groups API
    groups = {
        // Get all groups
        getAll: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/api/groups?${queryString}`);
        },

        // Get group by ID
        getById: async (groupId) => {
            return await this.request(`/api/groups/${groupId}`);
        },

        // Create new group
        create: async (groupData) => {
            return await this.request('/api/groups', {
                method: 'POST',
                body: JSON.stringify(groupData)
            });
        },

        // Update group
        update: async (groupId, groupData) => {
            return await this.request(`/api/groups/${groupId}`, {
                method: 'PUT',
                body: JSON.stringify(groupData)
            });
        },

        // Delete group
        delete: async (groupId) => {
            return await this.request(`/api/groups/${groupId}`, {
                method: 'DELETE'
            });
        },

        // Join group
        join: async (groupId) => {
            return await this.request(`/api/groups/${groupId}/join`, {
                method: 'POST'
            });
        },

        // Leave group
        leave: async (groupId) => {
            return await this.request(`/api/groups/${groupId}/leave`, {
                method: 'POST'
            });
        },

        // Get group members
        getMembers: async (groupId, params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/api/groups/${groupId}/members?${queryString}`);
        },

        // Update member role
        updateMemberRole: async (groupId, userId, role) => {
            return await this.request(`/api/groups/${groupId}/members/${userId}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role })
            });
        },

        // Remove member
        removeMember: async (groupId, userId) => {
            return await this.request(`/api/groups/${groupId}/members/${userId}`, {
                method: 'DELETE'
            });
        }
    };

    // Messages API
    messages = {
        // Get conversations
        getConversations: async () => {
            return await this.request('/api/messages/conversations');
        },

        // Get conversation with specific user
        getConversation: async (userId) => {
            return await this.request(`/api/messages/conversation/${userId}`);
        },

        // Send message
        send: async (receiverId, content) => {
            return await this.request('/api/messages/send', {
                method: 'POST',
                body: JSON.stringify({ receiverId, content })
            });
        },

        // Mark messages as read
        markAsRead: async (userId) => {
            return await this.request(`/api/messages/read/${userId}`, {
                method: 'PUT'
            });
        },

        // Get unread count
        getUnreadCount: async () => {
            return await this.request('/api/messages/unread-count');
        },

        // Delete message
        delete: async (messageId) => {
            return await this.request(`/api/messages/${messageId}`, {
                method: 'DELETE'
            });
        }
    };

    // Settings API
    settings = {
        // Get user settings
        get: async () => {
            return await this.request('/api/settings');
        },

        // Update user settings
        update: async (settingsData) => {
            return await this.request('/api/settings', {
                method: 'PUT',
                body: JSON.stringify(settingsData)
            });
        },

        // Update avatar
        updateAvatar: async (avatarUrl) => {
            return await this.request('/api/settings/avatar', {
                method: 'PUT',
                body: JSON.stringify({ avatar_url: avatarUrl })
            });
        },

        // Update cover photo
        updateCover: async (coverUrl) => {
            return await this.request('/api/settings/cover', {
                method: 'PUT',
                body: JSON.stringify({ cover_url: coverUrl })
            });
        },

        // Get notification settings
        getNotifications: async () => {
            return await this.request('/api/settings/notifications');
        },

        // Update notification settings
        updateNotifications: async (notificationData) => {
            return await this.request('/api/settings/notifications', {
                method: 'PUT',
                body: JSON.stringify(notificationData)
            });
        },

        // Get display settings
        getDisplay: async () => {
            return await this.request('/api/settings/display');
        },

        // Update display settings
        updateDisplay: async (displayData) => {
            return await this.request('/api/settings/display', {
                method: 'PUT',
                body: JSON.stringify(displayData)
            });
        }
    };

    // Media API
    media = {
        // Get user's albums
        getAlbums: async (userId) => {
            return await this.request(`/api/media/albums/${userId}`);
        },

        // Get album with photos
        getAlbum: async (albumId) => {
            return await this.request(`/api/media/album/${albumId}`);
        },

        // Get user's recent photos
        getPhotos: async (userId, limit = 20) => {
            return await this.request(`/api/media/photos/${userId}?limit=${limit}`);
        },

        // Create new album
        createAlbum: async (albumData) => {
            return await this.request('/api/media/album', {
                method: 'POST',
                body: JSON.stringify(albumData)
            });
        },

        // Upload photo
        uploadPhoto: async (photoData) => {
            return await this.request('/api/media/photo', {
                method: 'POST',
                body: JSON.stringify(photoData)
            });
        },

        // Update album
        updateAlbum: async (albumId, albumData) => {
            return await this.request(`/api/media/album/${albumId}`, {
                method: 'PUT',
                body: JSON.stringify(albumData)
            });
        },

        // Update photo
        updatePhoto: async (photoId, photoData) => {
            return await this.request(`/api/media/photo/${photoId}`, {
                method: 'PUT',
                body: JSON.stringify(photoData)
            });
        },

        // Delete album
        deleteAlbum: async (albumId) => {
            return await this.request(`/api/media/album/${albumId}`, {
                method: 'DELETE'
            });
        },

        // Delete photo
        deletePhoto: async (photoId) => {
            return await this.request(`/api/media/photo/${photoId}`, {
                method: 'DELETE'
            });
        }
    };

    // Notifications API
    notifications = {
        // Get all notifications
        getAll: async () => {
            return await this.request('/api/notifications');
        },

        // Get unread count
        getUnreadCount: async () => {
            return await this.request('/api/notifications/unread-count');
        },

        // Mark notification as read
        markAsRead: async (notificationId) => {
            return await this.request(`/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
        },

        // Mark all notifications as read
        markAllAsRead: async () => {
            return await this.request('/api/notifications/mark-all-read', {
                method: 'PUT'
            });
        },

        // Delete notification
        delete: async (notificationId) => {
            return await this.request(`/api/notifications/${notificationId}`, {
                method: 'DELETE'
            });
        }
    };
}

// Create global API instance
const api = new VibeCirclesAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VibeCirclesAPI;
}

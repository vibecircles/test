// Messenger page functionality
class MessengerPage {
    constructor() {
        this.currentConversation = null;
        this.conversations = [];
        this.init();
    }

    async init() {
        // Check authentication
        if (!api.isAuthenticated()) {
            window.location.href = '/login';
            return;
        }

        await this.loadConversations();
        this.setupEventListeners();
        this.startMessagePolling();
    }

    async loadConversations() {
        try {
            const response = await api.messages.getConversations();
            if (response.success) {
                this.conversations = response.data;
                this.renderConversations();
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.showNotification('Failed to load conversations', 'error');
        }
    }

    renderConversations() {
        const conversationsList = document.querySelector('.chat-users ul');
        if (!conversationsList) return;

        conversationsList.innerHTML = '';

        if (this.conversations.length === 0) {
            conversationsList.innerHTML = `
                <li class="no-conversations">
                    <div class="text-center p-4">
                        <p>No conversations yet</p>
                        <small>Start chatting with your friends!</small>
                    </div>
                </li>
            `;
            return;
        }

        this.conversations.forEach(conversation => {
            const conversationElement = this.createConversationElement(conversation);
            conversationsList.appendChild(conversationElement);
        });
    }

    createConversationElement(conversation) {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.setAttribute('data-user-id', conversation.id);

        const lastMessageTime = conversation.last_message_time 
            ? this.formatTime(conversation.last_message_time)
            : '';

        const unreadBadge = conversation.unread_count > 0 
            ? `<span class="badge bg-primary">${conversation.unread_count}</span>`
            : '';

        li.innerHTML = `
            <a class="nav-link conversation-item" href="#" data-user-id="${conversation.id}">
                <div class="media list-media">
                    <div class="story-img">
                        <div class="user-img">
                            <img src="${conversation.avatar_url || '../assets/images/user/1.jpg'}" 
                                 class="img-fluid blur-up lazyload bg-img" alt="user">
                        </div>
                    </div>
                    <div class="media-body">
                        <h5>${conversation.full_name || conversation.username} ${unreadBadge}</h5>
                        <h6>online</h6>
                    </div>
                </div>
                <h6>${conversation.last_message || 'No messages yet'}</h6>
                <small class="text-muted">${lastMessageTime}</small>
            </a>
        `;

        return li;
    }

    async loadConversation(userId) {
        try {
            const response = await api.messages.getConversation(userId);
            if (response.success) {
                this.currentConversation = userId;
                this.renderMessages(response.data);
                this.markConversationAsRead(userId);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
            this.showNotification('Failed to load conversation', 'error');
        }
    }

    renderMessages(messages) {
        const chatContainer = document.querySelector('.chat-container');
        if (!chatContainer) return;

        chatContainer.innerHTML = '';

        if (messages.length === 0) {
            chatContainer.innerHTML = `
                <div class="no-messages text-center p-4">
                    <p>No messages yet</p>
                    <small>Start the conversation!</small>
                </div>
            `;
            return;
        }

        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            chatContainer.appendChild(messageElement);
        });

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    createMessageElement(message) {
        const div = document.createElement('div');
        const isOwnMessage = message.sender_id === api.getCurrentUser()?.id;
        
        div.className = `message ${isOwnMessage ? 'own-message' : 'other-message'}`;
        
        const messageTime = this.formatTime(message.created_at);
        
        div.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <span class="sender-name">${message.full_name || message.username}</span>
                    <span class="message-time">${messageTime}</span>
                </div>
                <div class="message-text">${this.escapeHtml(message.content)}</div>
            </div>
        `;

        return div;
    }

    async sendMessage(content) {
        if (!this.currentConversation || !content.trim()) return;

        try {
            const response = await api.messages.send(this.currentConversation, content.trim());
            if (response.success) {
                // Add message to chat
                const messageElement = this.createMessageElement(response.data);
                const chatContainer = document.querySelector('.chat-container');
                if (chatContainer) {
                    chatContainer.appendChild(messageElement);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }

                // Clear input
                const messageInput = document.querySelector('.message-input');
                if (messageInput) {
                    messageInput.value = '';
                }

                // Refresh conversations list
                await this.loadConversations();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Failed to send message', 'error');
        }
    }

    async markConversationAsRead(userId) {
        try {
            await api.messages.markAsRead(userId);
            // Update unread count in conversations list
            await this.loadConversations();
        } catch (error) {
            console.error('Error marking conversation as read:', error);
        }
    }

    setupEventListeners() {
        // Conversation click
        document.addEventListener('click', async (e) => {
            if (e.target.closest('.conversation-item')) {
                e.preventDefault();
                const userId = e.target.closest('.conversation-item').getAttribute('data-user-id');
                await this.loadConversation(userId);
            }
        });

        // Send message
        const sendButton = document.querySelector('.send-message-btn');
        const messageInput = document.querySelector('.message-input');

        if (sendButton && messageInput) {
            sendButton.addEventListener('click', () => {
                this.sendMessage(messageInput.value);
            });

            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage(messageInput.value);
                }
            });
        }

        // Search conversations
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterConversations(e.target.value);
            });
        }
    }

    filterConversations(searchTerm) {
        const conversationItems = document.querySelectorAll('.conversation-item');
        
        conversationItems.forEach(item => {
            const userName = item.querySelector('.media-body h5').textContent.toLowerCase();
            const shouldShow = userName.includes(searchTerm.toLowerCase());
            item.closest('.nav-item').style.display = shouldShow ? 'block' : 'none';
        });
    }

    startMessagePolling() {
        // Poll for new messages every 10 seconds
        setInterval(async () => {
            if (this.currentConversation) {
                await this.loadConversation(this.currentConversation);
            }
            await this.loadConversations();
        }, 10000);
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize messenger page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MessengerPage();
});

// API Client with authentication and error handling
class APIClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = localStorage.getItem('authToken');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    // Get authentication headers
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api${endpoint}`;
        
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            const data = await response.json();
            
            console.log(`📡 API Response: ${response.status}`, data);
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    }

    // Authentication methods
    async login(email, password) {
        try {
            const response = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            if (response.success && response.token) {
                this.setToken(response.token);
            }
            
            return response;
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    }

    async verifyToken() {
        if (!this.token) {
            throw new Error('No token available');
        }
        
        try {
            const response = await this.request('/auth/verify');
            return response;
        } catch (error) {
            // Clear invalid token
            this.setToken(null);
            throw error;
        }
    }

    async getDashboardData() {
        return await this.request('/auth/dashboard');
    }

    // Events methods
    async getEvents() {
        return await this.request('/events');
    }

    async getEvent(id) {
        return await this.request(`/events/${id}`);
    }

    async searchEvents(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/events/search?${queryString}`);
    }

    // Sales reps methods
    async getSalesReps() {
        return await this.request('/sales-reps');
    }

    async getSalesRep(id) {
        return await this.request(`/sales-reps/${id}`);
    }

    async getSalesRepsForEvent(eventId) {
        return await this.request(`/sales-reps/event/${eventId}`);
    }

    async searchSalesReps(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/sales-reps/search?${queryString}`);
    }

    async getDepartments() {
        return await this.request('/sales-reps/departments/list');
    }

    // Meetings methods
    async requestMeeting(meetingData) {
        return await this.request('/meetings/request', {
            method: 'POST',
            body: JSON.stringify(meetingData)
        });
    }

    async getMeetings() {
        return await this.request('/meetings');
    }

    async getMeeting(id) {
        return await this.request(`/meetings/${id}`);
    }

    async updateMeetingStatus(id, status, adminNotes = '') {
        return await this.request(`/meetings/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, adminNotes })
        });
    }

    async searchMeetings(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/meetings/search?${queryString}`);
    }

    // Utility methods
    logout() {
        this.setToken(null);
        window.location.href = '/';
    }

    isAuthenticated() {
        return !!this.token;
    }
}

// Create global API client instance
window.apiClient = new APIClient();

// Global utility functions
window.utils = {
    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'Not specified';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    },

    // Format date and time for display
    formatDateTime(dateString) {
        if (!dateString) return 'Not specified';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    },

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Show loading state
    showLoading(element, text = 'Loading...') {
        if (element) {
            element.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>${text}</span>
                </div>
            `;
            element.classList.add('loading');
        }
    },

    // Hide loading state
    hideLoading(element) {
        if (element) {
            element.classList.remove('loading');
        }
    },

    // Show error message
    showError(message, container = null) {
        const errorHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
        
        if (container) {
            container.innerHTML = errorHTML;
        } else {
            // Show global error notification
            this.showNotification(message, 'error');
        }
    },

    // Show success message
    showSuccess(message, container = null) {
        const successHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        if (container) {
            container.innerHTML = successHTML;
        } else {
            this.showNotification(message, 'success');
        }
    },

    // Show notification
    showNotification(message, type = 'info', duration = 5000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);

        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    },

    // Debounce function for search inputs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Truncate text
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Global error handler for uncaught promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled promise rejection:', event.reason);
    window.utils.showNotification('An unexpected error occurred. Please try again.', 'error');
});

console.log('✅ API Client initialized successfully');
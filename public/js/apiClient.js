// API Client for the Orchestrate application
window.apiClient = {
    baseUrl: '/api',
    
    // Generic request method
    async request(method, endpoint, data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
            }
        };

        // Add authorization header if token exists
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            console.log(`🌐 ${method.toUpperCase()} ${url}`);
            const response = await fetch(url, config);
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || `HTTP ${response.status}`);
            }

            return {
                success: true,
                data: responseData,
                status: response.status
            };
        } catch (error) {
            console.error(`❌ API Error (${method.toUpperCase()} ${url}):`, error);
            return {
                success: false,
                error: error.message,
                status: error.status || 500
            };
        }
    },

    // Events API methods
    async getEvents() {
        return await this.request('GET', '/events');
    },

    async getEvent(id) {
        return await this.request('GET', `/events/${id}`);
    },

    async createEvent(eventData) {
        return await this.request('POST', '/events', eventData);
    },

    async updateEvent(id, eventData) {
        return await this.request('PUT', `/events/${id}`, eventData);
    },

    async deleteEvent(id) {
        return await this.request('DELETE', `/events/${id}`);
    },

    // Sales Representatives API methods
    async getSalesReps() {
        return await this.request('GET', '/sales-reps');
    },

    async getSalesRep(id) {
        return await this.request('GET', `/sales-reps/${id}`);
    },

    async createSalesRep(repData) {
        return await this.request('POST', '/sales-reps', repData);
    },

    async updateSalesRep(id, repData) {
        return await this.request('PUT', `/sales-reps/${id}`, repData);
    },

    async deleteSalesRep(id) {
        return await this.request('DELETE', `/sales-reps/${id}`);
    },

    // Meeting Requests API methods
    async getMeetings() {
        return await this.request('GET', '/meetings');
    },

    async getMeeting(id) {
        return await this.request('GET', `/meetings/${id}`);
    },

    async createMeeting(meetingData) {
        return await this.request('POST', '/meetings', meetingData);
    },

    async updateMeeting(id, meetingData) {
        return await this.request('PUT', `/meetings/${id}`, meetingData);
    },

    async deleteMeeting(id) {
        return await this.request('DELETE', `/meetings/${id}`);
    },

    async updateMeetingStatus(id, status, notes = '') {
        return await this.request('PUT', `/meetings/${id}/status`, {
            status,
            admin_notes: notes
        });
    },

    // Authentication API methods
    async login(email, password) {
        const response = await this.request('POST', '/auth/login', {
            email,
            password
        });
        
        // Store token if login successful
        if (response.success && response.data.token) {
            localStorage.setItem('adminToken', response.data.token);
            console.log('✅ JWT token stored in localStorage');
        }
        
        return response;
    },
    
    async verifyToken() {
        return await this.request('GET', '/auth/verify');
    },
    
    isAuthenticated() {
        const token = localStorage.getItem('adminToken');
        return !!token;
    },
    
    logout() {
        localStorage.removeItem('adminToken');
        console.log('✅ JWT token removed from localStorage');
        return { success: true };
    },

    // Statistics/Dashboard API methods
    async getStatistics() {
        return await this.request('GET', '/meetings/statistics');
    },

    async getRecentActivity() {
        return await this.request('GET', '/meetings/recent');
    },

    // Search and filtering methods
    async searchEvents(query) {
        return await this.request('GET', `/events/search?q=${encodeURIComponent(query)}`);
    },

    async searchSalesReps(query, department = '') {
        let url = `/sales-reps/search?q=${encodeURIComponent(query)}`;
        if (department) {
            url += `&department=${encodeURIComponent(department)}`;
        }
        return await this.request('GET', url);
    },

    async searchMeetings(query, status = '') {
        let url = `/meetings/search?q=${encodeURIComponent(query)}`;
        if (status) {
            url += `&status=${encodeURIComponent(status)}`;
        }
        return await this.request('GET', url);
    },

    // File upload helper
    async uploadFile(file, endpoint) {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${this.baseUrl}${endpoint}`;
        
        try {
            console.log(`📁 Uploading file to ${url}`);
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || `HTTP ${response.status}`);
            }

            return {
                success: true,
                data: responseData,
                status: response.status
            };
        } catch (error) {
            console.error(`❌ Upload Error:`, error);
            return {
                success: false,
                error: error.message,
                status: error.status || 500
            };
        }
    }
};

console.log('✅ ApiClient.js loaded successfully');
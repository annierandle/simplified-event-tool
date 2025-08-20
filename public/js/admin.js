// Admin Panel Application
class AdminApp {
    constructor() {
        this.currentTab = 'overview';
        this.currentMeeting = null;
        this.meetings = [];
        this.events = [];
        this.salesReps = [];
        this.departments = [];
        this.isAuthenticated = false;
        
        this.init();
    }

    async init() {
        console.log('🔧 Initializing Admin App');
        
        // Check if already authenticated
        if (window.apiClient.isAuthenticated()) {
            try {
                await this.verifyAuthentication();
            } catch (error) {
                console.log('❌ Token verification failed:', error);
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
        
        // Bind event listeners
        this.bindEventListeners();
        
        console.log('✅ Admin App initialized');
    }

    bindEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Refresh buttons
        document.getElementById('refreshMeetingsBtn')?.addEventListener('click', () => {
            this.loadMeetings();
        });

        document.getElementById('refreshEventsBtn')?.addEventListener('click', () => {
            this.loadEvents();
        });

        document.getElementById('refreshRepsBtn')?.addEventListener('click', () => {
            this.loadSalesReps();
        });

        // Search and filter inputs
        const meetingSearchInput = document.getElementById('meetingSearchInput');
        if (meetingSearchInput) {
            meetingSearchInput.addEventListener('input', 
                window.utils.debounce(() => this.filterMeetings(), 300)
            );
        }

        const meetingStatusFilter = document.getElementById('meetingStatusFilter');
        if (meetingStatusFilter) {
            meetingStatusFilter.addEventListener('change', () => this.filterMeetings());
        }

        // Modal close handlers
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('show');
            });
        });

        // Modal background click to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });

        // Meeting action buttons
        document.getElementById('approveMeetingBtn')?.addEventListener('click', () => {
            this.showStatusModal('approved');
        });

        document.getElementById('rejectMeetingBtn')?.addEventListener('click', () => {
            this.showStatusModal('rejected');
        });

        // Status update form
        const statusUpdateForm = document.getElementById('statusUpdateForm');
        if (statusUpdateForm) {
            statusUpdateForm.addEventListener('submit', (e) => this.handleStatusUpdate(e));
        }

        document.getElementById('updateStatusBtn')?.addEventListener('click', () => {
            this.handleStatusUpdate();
        });

        console.log('✅ Admin event listeners bound');
    }

    showLogin() {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('dashboardSection').style.display = 'none';
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'none';
        this.isAuthenticated = false;
    }

    showDashboard() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        document.getElementById('userInfo').style.display = 'inline-flex';
        document.getElementById('logoutBtn').style.display = 'inline-flex';
        this.isAuthenticated = true;
        
        // Load dashboard data
        this.loadDashboardData();
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const loginError = document.getElementById('loginError');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        // Hide previous errors
        loginError.style.display = 'none';
        
        // Validate input
        if (!email || !password) {
            this.showLoginError('Please enter both email and password.');
            return;
        }
        
        try {
            // Show loading state
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            submitBtn.disabled = true;
            
            console.log('🔐 Attempting login with:', { email, hasPassword: !!password });
            
            const response = await window.apiClient.login(email, password);
            
            if (response.success) {
                console.log('✅ Login successful:', response.user);
                
                // Update user info
                document.getElementById('userName').textContent = response.user.name || response.user.email;
                
                // Show dashboard
                this.showDashboard();
                
                window.utils.showNotification('Login successful!', 'success');
                
            } else {
                throw new Error(response.error || 'Login failed');
            }
            
        } catch (error) {
            console.error('❌ Login error:', error);
            this.showLoginError(error.message || 'Login failed. Please check your credentials.');
        } finally {
            // Reset button
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            submitBtn.disabled = false;
        }
    }

    showLoginError(message) {
        const loginError = document.getElementById('loginError');
        loginError.querySelector('span').textContent = message;
        loginError.style.display = 'flex';
    }

    async verifyAuthentication() {
        try {
            const response = await window.apiClient.verifyToken();
            
            if (response.success) {
                document.getElementById('userName').textContent = response.user.name || response.user.email;
                this.showDashboard();
                return true;
            } else {
                throw new Error('Token verification failed');
            }
            
        } catch (error) {
            console.error('❌ Auth verification failed:', error);
            this.showLogin();
            return false;
        }
    }

    handleLogout() {
        window.apiClient.logout();
        this.showLogin();
        window.utils.showNotification('Logged out successfully', 'info');
    }

    switchTab(tabName) {
        console.log(`🔄 Switching to tab: ${tabName}`);
        
        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
        
        this.currentTab = tabName;
        
        // Load data for the tab
        this.loadTabData(tabName);
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'overview':
                await this.loadDashboardData();
                break;
            case 'meetings':
                await this.loadMeetings();
                break;
            case 'events':
                await this.loadEvents();
                break;
            case 'sales-reps':
                await this.loadSalesReps();
                await this.loadDepartments();
                break;
        }
    }

    async loadDashboardData() {
        try {
            console.log('📊 Loading dashboard data...');
            
            const response = await window.apiClient.getDashboardData();
            
            if (response.success) {
                const data = response.data;
                
                // Update stat cards
                document.getElementById('totalEvents').textContent = data.totalEvents || 0;
                document.getElementById('totalSalesReps').textContent = data.totalSalesReps || 0;
                document.getElementById('pendingMeetings').textContent = data.pendingMeetings || 0;
                document.getElementById('totalMeetings').textContent = data.totalMeetings || 0;
                
                console.log('✅ Dashboard data loaded:', data);
                
                // Load recent meetings
                await this.loadRecentMeetings();
                
            } else {
                throw new Error(response.error || 'Failed to load dashboard data');
            }
            
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            window.utils.showError('Failed to load dashboard data.');
        }
    }

    async loadRecentMeetings() {
        try {
            const response = await window.apiClient.getMeetings();
            
            if (response.success) {
                const recentMeetings = response.data.slice(0, 5); // Get 5 most recent
                this.renderRecentActivity(recentMeetings);
            }
            
        } catch (error) {
            console.error('❌ Error loading recent meetings:', error);
        }
    }

    renderRecentActivity(meetings) {
        const container = document.getElementById('recentMeetings');
        if (!container) return;
        
        if (meetings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h4>No Recent Activity</h4>
                    <p>No meeting requests have been submitted yet.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = meetings.map(meeting => `
            <div class="activity-item">
                <div class="activity-icon ${meeting.status}">
                    <i class="fas ${this.getStatusIcon(meeting.status)}"></i>
                </div>
                <div class="activity-content">
                    <div class="title">${window.utils.escapeHtml(meeting.client_name)} - ${window.utils.escapeHtml(meeting.event_name)}</div>
                    <div class="details">
                        ${window.utils.escapeHtml(meeting.sales_rep_name)} • 
                        ${window.utils.escapeHtml(meeting.client_company || 'No company')}
                    </div>
                </div>
                <div class="activity-time">
                    ${window.utils.formatDateTime(meeting.created_at)}
                </div>
            </div>
        `).join('');
    }

    async loadMeetings() {
        try {
            console.log('📋 Loading meetings...');
            
            const loading = document.getElementById('meetingsLoading');
            if (loading) loading.style.display = 'block';
            
            const response = await window.apiClient.getMeetings();
            
            if (response.success) {
                this.meetings = response.data;
                this.renderMeetings();
                console.log(`✅ Loaded ${this.meetings.length} meetings`);
            } else {
                throw new Error(response.error || 'Failed to load meetings');
            }
            
        } catch (error) {
            console.error('❌ Error loading meetings:', error);
            const container = document.getElementById('meetingsContainer');
            if (container) {
                window.utils.showError('Failed to load meetings. Please try again.', container);
            }
        } finally {
            const loading = document.getElementById('meetingsLoading');
            if (loading) loading.style.display = 'none';
        }
    }

    renderMeetings(meetingsToRender = null) {
        const container = document.getElementById('meetingsContainer');
        if (!container) return;
        
        const meetings = meetingsToRender || this.meetings;
        
        if (meetings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h4>No Meetings Found</h4>
                    <p>No meeting requests match your current filters.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Client</th>
                        <th>Event</th>
                        <th>Sales Rep</th>
                        <th>Preferred Date</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${meetings.map(meeting => `
                        <tr>
                            <td>
                                <strong>${window.utils.escapeHtml(meeting.client_name)}</strong><br>
                                <small>${window.utils.escapeHtml(meeting.client_email)}</small>
                                ${meeting.client_company ? `<br><small>${window.utils.escapeHtml(meeting.client_company)}</small>` : ''}
                            </td>
                            <td>
                                <strong>${window.utils.escapeHtml(meeting.event_name)}</strong><br>
                                <small>${window.utils.escapeHtml(meeting.event_location || 'Location TBD')}</small>
                            </td>
                            <td>
                                <strong>${window.utils.escapeHtml(meeting.sales_rep_name)}</strong><br>
                                <small>${window.utils.escapeHtml(meeting.sales_rep_department || 'General')}</small>
                            </td>
                            <td>
                                ${meeting.preferred_date ? window.utils.formatDate(meeting.preferred_date) : 'Not specified'}<br>
                                ${meeting.preferred_time ? `<small>${meeting.preferred_time}</small>` : '<small>Any time</small>'}
                            </td>
                            <td>
                                <span class="status-badge ${meeting.status}">
                                    <i class="fas ${this.getStatusIcon(meeting.status)}"></i>
                                    ${meeting.status}
                                </span>
                            </td>
                            <td>
                                ${window.utils.formatDateTime(meeting.created_at)}
                            </td>
                            <td class="actions">
                                <button class="btn btn-primary btn-sm view-meeting" data-meeting-id="${meeting.id}">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                ${meeting.status === 'pending' ? `
                                    <button class="btn btn-success btn-sm approve-meeting" data-meeting-id="${meeting.id}">
                                        <i class="fas fa-check"></i> Approve
                                    </button>
                                    <button class="btn btn-danger btn-sm reject-meeting" data-meeting-id="${meeting.id}">
                                        <i class="fas fa-times"></i> Reject
                                    </button>
                                ` : `
                                    <button class="btn btn-secondary btn-sm update-status" data-meeting-id="${meeting.id}">
                                        <i class="fas fa-edit"></i> Update
                                    </button>
                                `}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        // Bind action buttons
        container.querySelectorAll('.view-meeting').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const meetingId = e.target.closest('[data-meeting-id]').dataset.meetingId;
                this.viewMeeting(meetingId);
            });
        });
        
        container.querySelectorAll('.approve-meeting').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const meetingId = e.target.closest('[data-meeting-id]').dataset.meetingId;
                this.updateMeetingStatus(meetingId, 'approved');
            });
        });
        
        container.querySelectorAll('.reject-meeting').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const meetingId = e.target.closest('[data-meeting-id]').dataset.meetingId;
                this.updateMeetingStatus(meetingId, 'rejected');
            });
        });
        
        container.querySelectorAll('.update-status').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const meetingId = e.target.closest('[data-meeting-id]').dataset.meetingId;
                this.showStatusModal('', meetingId);
            });
        });
    }

    async loadEvents() {
        try {
            console.log('📅 Loading events...');
            
            const loading = document.getElementById('eventsLoading');
            if (loading) loading.style.display = 'block';
            
            const response = await window.apiClient.getEvents();
            
            if (response.success) {
                this.events = response.data;
                this.renderEvents();
                console.log(`✅ Loaded ${this.events.length} events`);
            } else {
                throw new Error(response.error || 'Failed to load events');
            }
            
        } catch (error) {
            console.error('❌ Error loading events:', error);
            const container = document.getElementById('eventsContainer');
            if (container) {
                window.utils.showError('Failed to load events. Please try again.', container);
            }
        } finally {
            const loading = document.getElementById('eventsLoading');
            if (loading) loading.style.display = 'none';
        }
    }

    renderEvents() {
        const container = document.getElementById('eventsContainer');
        if (!container) return;
        
        if (this.events.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h4>No Events Found</h4>
                    <p>No events are currently configured.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Event Name</th>
                        <th>Date Range</th>
                        <th>Location</th>
                        <th>Sales Reps</th>
                        <th>Status</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.events.map(event => `
                        <tr>
                            <td>
                                <strong>${window.utils.escapeHtml(event.name)}</strong><br>
                                <small>${window.utils.escapeHtml(window.utils.truncateText(event.description || 'No description', 100))}</small>
                            </td>
                            <td>
                                ${window.utils.formatDate(event.start_date)} - ${window.utils.formatDate(event.end_date)}
                            </td>
                            <td>
                                ${window.utils.escapeHtml(event.location || 'Location TBD')}
                            </td>
                            <td>
                                <span class="badge badge-info">${event.sales_rep_count} assigned</span>
                            </td>
                            <td>
                                <span class="status-badge ${event.status}">
                                    <i class="fas fa-calendar-check"></i>
                                    ${event.status}
                                </span>
                            </td>
                            <td>
                                ${window.utils.formatDateTime(event.created_at)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async loadSalesReps() {
        try {
            console.log('👥 Loading sales reps...');
            
            const loading = document.getElementById('salesRepsLoading');
            if (loading) loading.style.display = 'block';
            
            const response = await window.apiClient.getSalesReps();
            
            if (response.success) {
                this.salesReps = response.data;
                this.renderSalesReps();
                console.log(`✅ Loaded ${this.salesReps.length} sales reps`);
            } else {
                throw new Error(response.error || 'Failed to load sales representatives');
            }
            
        } catch (error) {
            console.error('❌ Error loading sales reps:', error);
            const container = document.getElementById('salesRepsContainer');
            if (container) {
                window.utils.showError('Failed to load sales representatives. Please try again.', container);
            }
        } finally {
            const loading = document.getElementById('salesRepsLoading');
            if (loading) loading.style.display = 'none';
        }
    }

    renderSalesReps() {
        const container = document.getElementById('salesRepsContainer');
        if (!container) return;
        
        if (this.salesReps.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-times"></i>
                    <h4>No Sales Representatives Found</h4>
                    <p>No sales representatives are currently configured.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Contact</th>
                        <th>Events</th>
                        <th>Status</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.salesReps.map(rep => `
                        <tr>
                            <td>
                                <strong>${window.utils.escapeHtml(rep.name)}</strong><br>
                                <small>${window.utils.escapeHtml(window.utils.truncateText(rep.bio || 'No bio available', 60))}</small>
                            </td>
                            <td>
                                ${window.utils.escapeHtml(rep.department || 'General')}
                            </td>
                            <td>
                                <a href="mailto:${rep.email}">${window.utils.escapeHtml(rep.email)}</a><br>
                                ${rep.phone ? `<small><a href="tel:${rep.phone}">${window.utils.escapeHtml(rep.phone)}</a></small>` : '<small>No phone</small>'}
                            </td>
                            <td>
                                <span class="badge badge-info">${rep.event_count} events</span>
                            </td>
                            <td>
                                <span class="status-badge ${rep.availability_status}">
                                    <i class="fas fa-user-check"></i>
                                    ${rep.availability_status}
                                </span>
                            </td>
                            <td>
                                ${window.utils.formatDateTime(rep.created_at)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async loadDepartments() {
        try {
            const response = await window.apiClient.getDepartments();
            
            if (response.success) {
                this.departments = response.data;
                this.populateDepartmentFilter();
            }
            
        } catch (error) {
            console.error('❌ Error loading departments:', error);
        }
    }

    populateDepartmentFilter() {
        const filter = document.getElementById('repDepartmentFilter');
        if (!filter) return;
        
        filter.innerHTML = '<option value="">All Departments</option>' + 
            this.departments.map(dept => `
                <option value="${window.utils.escapeHtml(dept)}">${window.utils.escapeHtml(dept)}</option>
            `).join('');
    }

    filterMeetings() {
        const searchTerm = document.getElementById('meetingSearchInput')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('meetingStatusFilter')?.value || '';
        
        const filteredMeetings = this.meetings.filter(meeting => {
            const matchesSearch = !searchTerm || 
                meeting.client_name.toLowerCase().includes(searchTerm) ||
                meeting.client_email.toLowerCase().includes(searchTerm) ||
                meeting.client_company?.toLowerCase().includes(searchTerm) ||
                meeting.event_name.toLowerCase().includes(searchTerm) ||
                meeting.sales_rep_name.toLowerCase().includes(searchTerm);
            
            const matchesStatus = !statusFilter || meeting.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
        
        this.renderMeetings(filteredMeetings);
    }

    async viewMeeting(meetingId) {
        try {
            const response = await window.apiClient.getMeeting(meetingId);
            
            if (response.success) {
                const meeting = response.data;
                this.currentMeeting = meeting;
                
                const modal = document.getElementById('meetingModal');
                const content = document.getElementById('meetingModalContent');
                
                content.innerHTML = `
                    <div class="meeting-details">
                        <div class="detail-group">
                            <h6>Meeting Information</h6>
                            <div class="client-info">
                                <div>
                                    <p><strong>Request ID:</strong> #${meeting.id}</p>
                                    <p><strong>Status:</strong> <span class="status-badge ${meeting.status}">${meeting.status}</span></p>
                                    <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
                                </div>
                                <div>
                                    <p><strong>Created:</strong> ${window.utils.formatDateTime(meeting.created_at)}</p>
                                    <p><strong>Updated:</strong> ${window.utils.formatDateTime(meeting.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-group">
                            <h6>Client Information</h6>
                            <div class="client-info">
                                <div>
                                    <p><strong>Name:</strong> ${window.utils.escapeHtml(meeting.client_name)}</p>
                                    <p><strong>Email:</strong> <a href="mailto:${meeting.client_email}">${window.utils.escapeHtml(meeting.client_email)}</a></p>
                                </div>
                                <div>
                                    <p><strong>Company:</strong> ${window.utils.escapeHtml(meeting.client_company || 'Not specified')}</p>
                                    <p><strong>Phone:</strong> ${meeting.client_phone ? `<a href="tel:${meeting.client_phone}">${window.utils.escapeHtml(meeting.client_phone)}</a>` : 'Not specified'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-group">
                            <h6>Event Details</h6>
                            <p><strong>Event:</strong> ${window.utils.escapeHtml(meeting.event_name)}</p>
                            <p><strong>Location:</strong> ${window.utils.escapeHtml(meeting.event_location || 'Location TBD')}</p>
                            <p><strong>Event Dates:</strong> ${window.utils.formatDate(meeting.event_start_date)} - ${window.utils.formatDate(meeting.event_end_date)}</p>
                        </div>
                        
                        <div class="detail-group">
                            <h6>Sales Representative</h6>
                            <p><strong>Name:</strong> ${window.utils.escapeHtml(meeting.sales_rep_name)}</p>
                            <p><strong>Email:</strong> <a href="mailto:${meeting.sales_rep_email}">${window.utils.escapeHtml(meeting.sales_rep_email)}</a></p>
                            <p><strong>Department:</strong> ${window.utils.escapeHtml(meeting.sales_rep_department || 'General')}</p>
                        </div>
                        
                        <div class="detail-group">
                            <h6>Meeting Preferences</h6>
                            <p><strong>Preferred Date:</strong> ${meeting.preferred_date ? window.utils.formatDate(meeting.preferred_date) : 'Not specified'}</p>
                            <p><strong>Preferred Time:</strong> ${meeting.preferred_time || 'Not specified'}</p>
                        </div>
                        
                        ${meeting.message ? `
                            <div class="detail-group">
                                <h6>Client Message</h6>
                                <p>${window.utils.escapeHtml(meeting.message)}</p>
                            </div>
                        ` : ''}
                        
                        ${meeting.admin_notes ? `
                            <div class="detail-group">
                                <h6>Admin Notes</h6>
                                <p>${window.utils.escapeHtml(meeting.admin_notes)}</p>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                // Show/hide action buttons based on status
                const approveBtn = document.getElementById('approveMeetingBtn');
                const rejectBtn = document.getElementById('rejectMeetingBtn');
                
                if (meeting.status === 'pending') {
                    approveBtn.style.display = 'inline-flex';
                    rejectBtn.style.display = 'inline-flex';
                } else {
                    approveBtn.style.display = 'none';
                    rejectBtn.style.display = 'none';
                }
                
                modal.classList.add('show');
                
            } else {
                throw new Error(response.error || 'Failed to load meeting details');
            }
            
        } catch (error) {
            console.error('❌ Error viewing meeting:', error);
            window.utils.showError('Failed to load meeting details. Please try again.');
        }
    }

    showStatusModal(status, meetingId = null) {
        const modal = document.getElementById('statusModal');
        const statusSelect = document.getElementById('newStatus');
        
        if (status) {
            statusSelect.value = status;
        }
        
        if (meetingId) {
            this.currentMeeting = this.meetings.find(m => m.id == meetingId);
        }
        
        modal.classList.add('show');
    }

    async handleStatusUpdate(e) {
        if (e) e.preventDefault();
        
        if (!this.currentMeeting) return;
        
        const newStatus = document.getElementById('newStatus').value;
        const adminNotes = document.getElementById('adminNotes').value.trim();
        
        if (!newStatus) {
            window.utils.showError('Please select a status.');
            return;
        }
        
        await this.updateMeetingStatus(this.currentMeeting.id, newStatus, adminNotes);
    }

    async updateMeetingStatus(meetingId, status, adminNotes = '') {
        try {
            console.log(`📝 Updating meeting ${meetingId} status to: ${status}`);
            
            const response = await window.apiClient.updateMeetingStatus(meetingId, status, adminNotes);
            
            if (response.success) {
                window.utils.showSuccess(`Meeting ${status} successfully!`);
                
                // Update local data
                const meetingIndex = this.meetings.findIndex(m => m.id == meetingId);
                if (meetingIndex >= 0) {
                    this.meetings[meetingIndex] = { ...this.meetings[meetingIndex], ...response.data };
                }
                
                // Refresh displays
                this.renderMeetings();
                this.loadDashboardData();
                
                // Close modals
                document.getElementById('meetingModal').classList.remove('show');
                document.getElementById('statusModal').classList.remove('show');
                
                // Reset form
                document.getElementById('statusUpdateForm').reset();
                
            } else {
                throw new Error(response.error || 'Failed to update meeting status');
            }
            
        } catch (error) {
            console.error('❌ Error updating meeting status:', error);
            window.utils.showError(error.message || 'Failed to update meeting status. Please try again.');
        }
    }

    getStatusIcon(status) {
        const icons = {
            pending: 'fa-clock',
            approved: 'fa-check',
            rejected: 'fa-times',
            completed: 'fa-check-circle'
        };
        return icons[status] || 'fa-question';
    }
}

// Initialize admin app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminApp();
});

console.log('✅ Admin.js loaded successfully');
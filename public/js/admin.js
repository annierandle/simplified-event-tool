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

        // Clickable stat card navigation
        document.querySelectorAll('.clickable-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
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
        document.getElementById('logoutBtn').style.display = 'none';
        this.isAuthenticated = false;
    }

    showDashboard() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
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
                console.log('✅ Login successful:', response.data.user);
                
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
                document.getElementById('userName').textContent = response.data.user.name || response.data.user.email;
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
        
        // Update stat card highlights (no longer using nav-tab elements)
        document.querySelectorAll('.clickable-card').forEach(card => {
            card.classList.remove('active');
        });
        const activeCard = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeCard) {
            activeCard.classList.add('active');
        }
        
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
            
            // Load basic stats
            const [eventsResponse, salesRepsResponse, meetingsResponse, pendingStatsResponse] = await Promise.all([
                window.apiClient.getEvents(),
                window.apiClient.request('GET', '/sales-reps/admin/all'),
                window.apiClient.getMeetings(),
                window.apiClient.request('GET', '/meetings/admin/pending-stats')
            ]);
            
            // Update stat cards
            if (eventsResponse.success) {
                const events = eventsResponse.data.data || eventsResponse.data || [];
                const activeEvents = events.filter(event => event.status === 'active');
                document.getElementById('totalEvents').textContent = activeEvents.length || events.length;
                console.log(`📊 Active events: ${activeEvents.length}, Total events: ${events.length}`);
            } else {
                document.getElementById('totalEvents').textContent = '0';
            }
            
            if (salesRepsResponse.success) {
                const reps = salesRepsResponse.data.data || salesRepsResponse.data || [];
                const availableReps = reps.filter(rep => rep.availability_status === 'available');
                document.getElementById('totalSalesReps').textContent = availableReps.length || reps.length;
                console.log(`📊 Available reps: ${availableReps.length}, Total reps: ${reps.length}`);
            } else {
                document.getElementById('totalSalesReps').textContent = '0';
            }
            
            if (pendingStatsResponse.success) {
                const pendingCount = pendingStatsResponse.data.total || 0;
                document.getElementById('pendingRequests').textContent = pendingCount;
                console.log(`📊 Pending requests: ${pendingCount}`);
            } else {
                // Fallback: count pending from meetings data
                const meetings = meetingsResponse.data.data || meetingsResponse.data || [];
                const pendingCount = meetings.filter(meeting => meeting.status === 'pending').length;
                document.getElementById('pendingRequests').textContent = pendingCount;
            }
            
            if (meetingsResponse.success) {
                const meetings = meetingsResponse.data.data || meetingsResponse.data || [];
                // Count only approved meetings that haven't happened yet
                const upcomingMeetings = meetings.filter(meeting => {
                    return meeting.status === 'approved' && 
                           meeting.preferred_date && 
                           new Date(meeting.preferred_date) > new Date();
                });
                document.getElementById('upcomingMeetings').textContent = upcomingMeetings.length;
                console.log(`📊 Upcoming meetings: ${upcomingMeetings.length}`);
            } else {
                document.getElementById('upcomingMeetings').textContent = '0';
            }
            
            console.log('✅ Dashboard data loaded');
            
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
            console.log('📋 Loading pending requests...');
            
            const loading = document.getElementById('meetingsLoading');
            if (loading) loading.style.display = 'block';
            
            // Load only pending meetings for the admin panel
            const response = await window.apiClient.request('GET', '/meetings/search?status=pending&limit=50');
            
            if (response.success) {
                this.meetings = response.data.data || response.data;
                this.renderPendingRequests();
                console.log(`✅ Loaded ${this.meetings.length} pending requests`);
                
                // Load pending stats
                await this.loadDashboardData();
                
            } else {
                throw new Error(response.error || 'Failed to load pending requests');
            }
            
        } catch (error) {
            console.error('❌ Error loading pending requests:', error);
            const container = document.getElementById('pendingRequestsContainer');
            if (container) {
                window.utils.showError('Failed to load pending requests. Please try again.', container);
            }
        } finally {
            const loading = document.getElementById('meetingsLoading');
            if (loading) loading.style.display = 'none';
        }
    }

    renderPendingRequests(meetingsToRender = null) {
        const container = document.getElementById('pendingRequestsContainer');
        if (!container) return;
        
        const meetings = meetingsToRender || this.meetings;
        
        if (meetings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <h4>No Pending Requests</h4>
                    <p>All meeting requests have been processed.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = meetings.map(meeting => {
            // Format date without year for cleaner display
            const requestDate = new Date(meeting.created_at);
            const formattedDate = requestDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            
            return `
                <div class="request-card compact" data-meeting-id="${meeting.id}">
                    <div class="request-header">
                        <div class="request-info">
                            <h5>${window.utils.escapeHtml(meeting.client_name)} - ${window.utils.escapeHtml(meeting.event_name)}</h5>
                            <div class="request-meta">
                                Requested ${formattedDate}
                            </div>
                        </div>
                        <div class="request-actions">
                            <button class="btn btn-sm btn-primary view-request" data-meeting-id="${meeting.id}" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-success approve-request" data-meeting-id="${meeting.id}" title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger reject-request" data-meeting-id="${meeting.id}" title="Reject">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="request-details compact">
                        <div class="detail-row">
                            <div class="detail-item">
                                <i class="fas fa-building"></i>
                                <span>${window.utils.escapeHtml(meeting.client_company || 'No company')}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-user-tie"></i>
                                <span>${window.utils.escapeHtml(meeting.sales_rep_name)}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-clock"></i>
                                <span>${meeting.preferred_time || 'Any time'} (${meeting.duration || 30} min)</span>
                            </div>
                        </div>
                    </div>
                    ${meeting.message ? `
                        <div class="request-message compact">
                            <strong>Message:</strong> ${window.utils.escapeHtml(meeting.message)}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        // Bind event listeners for request actions
        container.querySelectorAll('.view-request').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const meetingId = e.target.closest('[data-meeting-id]').dataset.meetingId;
                this.showRequestDetails(meetingId);
            });
        });
        
        container.querySelectorAll('.approve-request').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.closest('button');
                const meetingId = e.target.closest('[data-meeting-id]').dataset.meetingId;
                
                // Show loading state
                const originalContent = button.innerHTML;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                button.disabled = true;
                
                try {
                    await this.updateMeetingStatus(meetingId, 'approved');
                } catch (error) {
                    // Reset button on error
                    button.innerHTML = originalContent;
                    button.disabled = false;
                }
            });
        });
        
        container.querySelectorAll('.reject-request').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.closest('button');
                const meetingId = e.target.closest('[data-meeting-id]').dataset.meetingId;
                
                // Show loading state
                const originalContent = button.innerHTML;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                button.disabled = true;
                
                try {
                    await this.updateMeetingStatus(meetingId, 'rejected');
                } catch (error) {
                    // Reset button on error
                    button.innerHTML = originalContent;
                    button.disabled = false;
                }
            });
        });
    }
    
    // Keep the old method for backward compatibility
    renderMeetings(meetingsToRender = null) {
        return this.renderPendingRequests(meetingsToRender);
    }

    async loadEvents() {
        try {
            console.log('📅 Loading events...');
            
            const loading = document.getElementById('eventsLoading');
            if (loading) loading.style.display = 'block';
            
            const response = await window.apiClient.getEvents();
            
            if (response.success) {
                this.events = response.data.data || response.data;
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
        
        // Map professional event logos
        const getEventLogo = (eventName) => {
            const logos = {
                'GBTA Convention': 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=200&fit=crop&crop=center&q=80', // Professional conference
                'Commercial Payments International Global Summit': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=200&fit=crop&crop=center&q=80', // Finance/fintech
                'NACHA Payments Conference': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&crop=center&q=80', // Banking/payments
                'Sibos': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop&crop=center&q=80' // Global business/finance
            };
            return logos[eventName] || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=200&fit=crop&crop=center&q=80';
        };
        
        container.innerHTML = `
            <div class="events-grid-professional">
                ${this.events.map(event => `
                    <div class="event-card-professional">
                        <div class="event-image-container">
                            <img src="${getEventLogo(event.name)}" alt="${window.utils.escapeHtml(event.name)}" class="event-logo" onerror="this.src='https://images.unsplash.com/photo-1556740758-90de374c12ad?w=200&h=100&fit=crop&crop=center&q=80'">
                        </div>
                        <div class="event-details">
                            <div class="event-header">
                                <h4>${window.utils.escapeHtml(event.name)}</h4>
                                <span class="status-badge ${event.status}">
                                    <i class="fas fa-calendar-check"></i>
                                    ${event.status}
                                </span>
                            </div>

                            <div class="event-meta">
                                <div class="meta-item">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span>${window.utils.formatDate(event.start_date)} - ${window.utils.formatDate(event.end_date)}</span>
                                </div>
                                <div class="meta-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${window.utils.escapeHtml(event.location || 'Location TBD')}</span>
                                </div>
                                <div class="meta-item">
                                    <i class="fas fa-users"></i>
                                    <span>${event.sales_rep_count || 0} reps assigned</span>
                                </div>
                            </div>
                            <div class="event-actions">
                                <button class="btn btn-sm btn-outline-primary edit-event" data-event-id="${event.id}">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-outline-info view-event" data-event-id="${event.id}">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async loadSalesReps() {
        try {
            console.log('👥 Loading sales reps...');
            
            const loading = document.getElementById('salesRepsLoading');
            if (loading) loading.style.display = 'block';
            
            const response = await window.apiClient.getSalesReps();
            
            if (response.success) {
                this.salesReps = response.data.data || response.data;
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
                        <th>Representative</th>
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
                                <div class="rep-info">
                                    ${rep.photo_url ? 
                                        `<img src="${rep.photo_url}" alt="${window.utils.escapeHtml(rep.name)}" class="rep-photo" onerror="this.style.display='none'">` : 
                                        `<div class="rep-photo-placeholder"><i class="fas fa-user"></i></div>`
                                    }
                                    <div class="rep-details">
                                        <strong>${window.utils.escapeHtml(rep.name)}</strong><br>
                                        <small>${window.utils.escapeHtml(window.utils.truncateText(rep.bio || 'No bio available', 60))}</small>
                                    </div>
                                </div>
                            </td>
                            <td>
                                ${window.utils.escapeHtml(rep.department || 'General')}
                            </td>
                            <td>
                                <a href="mailto:${rep.email}">${window.utils.escapeHtml(rep.email)}</a>
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
                this.departments = response.data.data || response.data;
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
                await this.loadMeetings(); // Reload data from server
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

    showRequestDetails(meetingId) {
        const meeting = this.meetings.find(m => m.id == meetingId);
        if (!meeting) return;
        
        const modal = document.getElementById('requestDetailsModal');
        const content = document.getElementById('requestDetailsContent');
        
        content.innerHTML = `
            <div class="meeting-details">
                <div class="detail-group">
                    <h6><i class="fas fa-user"></i> Client Information</h6>
                    <div class="client-info">
                        <div>
                            <strong>Name:</strong> ${window.utils.escapeHtml(meeting.client_name)}
                        </div>
                        <div>
                            <strong>Email:</strong> ${window.utils.escapeHtml(meeting.client_email)}
                        </div>
                        <div>
                            <strong>Company:</strong> ${window.utils.escapeHtml(meeting.client_company || 'Not specified')}
                        </div>
                        <div>
                            <strong>Phone:</strong> ${window.utils.escapeHtml(meeting.client_phone || 'Not provided')}
                        </div>
                    </div>
                </div>
                
                <div class="detail-group">
                    <h6><i class="fas fa-calendar"></i> Event Information</h6>
                    <p>
                        <strong>${window.utils.escapeHtml(meeting.event_name)}</strong><br>
                        <i class="fas fa-map-marker-alt"></i> ${window.utils.escapeHtml(meeting.event_location || 'Location TBD')}
                    </p>
                </div>
                
                <div class="detail-group">
                    <h6><i class="fas fa-user-tie"></i> Sales Representative</h6>
                    <p>
                        <strong>${window.utils.escapeHtml(meeting.sales_rep_name)}</strong><br>
                        ${window.utils.escapeHtml(meeting.sales_rep_department || 'General')} Department<br>
                        <i class="fas fa-envelope"></i> ${window.utils.escapeHtml(meeting.sales_rep_email || '')}
                    </p>
                </div>
                
                <div class="detail-group">
                    <h6><i class="fas fa-clock"></i> Meeting Preferences</h6>
                    <p>
                        <strong>Date:</strong> ${meeting.preferred_date ? window.utils.formatDate(meeting.preferred_date) : 'Flexible'}<br>
                        <strong>Time:</strong> ${meeting.preferred_time || 'Flexible'}<br>
                        <strong>Duration:</strong> ${meeting.duration || 30} minutes
                    </p>
                </div>
                
                ${meeting.message ? `
                    <div class="detail-group">
                        <h6><i class="fas fa-comment"></i> Message</h6>
                        <p>${window.utils.escapeHtml(meeting.message)}</p>
                    </div>
                ` : ''}
                
                <div class="detail-group">
                    <h6><i class="fas fa-info"></i> Request Details</h6>
                    <p>
                        <strong>Submitted:</strong> ${window.utils.formatDateTime(meeting.created_at)}<br>
                        <strong>Status:</strong> <span class="status-badge ${meeting.status}">${meeting.status.toUpperCase()}</span>
                    </p>
                </div>
            </div>
        `;
        
        // Set up approve/reject buttons
        const approveBtn = document.getElementById('approveRequestBtn');
        const rejectBtn = document.getElementById('rejectRequestBtn');
        
        approveBtn.onclick = () => {
            modal.classList.remove('show');
            this.updateMeetingStatus(meetingId, 'approved');
        };
        
        rejectBtn.onclick = () => {
            modal.classList.remove('show');
            this.updateMeetingStatus(meetingId, 'rejected');
        };
        
        modal.classList.add('show');
    }

    // New methods for events and sales reps management
    async loadEventsForAdmin() {
        try {
            console.log('📅 Loading events for admin');
            const response = await window.apiClient.getEvents();
            
            if (response.success) {
                this.events = response.data.data || response.data;
                this.renderEventsAdmin();
                console.log(`✅ Loaded ${this.events.length} events for admin`);
            } else {
                throw new Error(response.error || 'Failed to load events');
            }
        } catch (error) {
            console.error('❌ Error loading events for admin:', error);
            window.utils.showError('Failed to load events. Please try again.');
        }
    }

    renderEventsAdmin() {
        const container = document.getElementById('eventsContainer');
        if (!container) return;

        if (this.events.length === 0) {
            container.innerHTML = '<div class="empty-state"><h4>No Events Found</h4><p>Create your first event to get started.</p></div>';
            return;
        }

        container.innerHTML = this.events.map(event => `
            <div class="event-card-admin" data-event-id="${event.id}">
                <div class="event-image-admin">
                    ${event.image_url ? 
                        `<img src="${event.image_url}" alt="${window.utils.escapeHtml(event.name)}">` :
                        '<div class="event-placeholder"><i class="fas fa-calendar-alt"></i></div>'
                    }
                    <div class="event-actions-overlay">
                        <button class="btn btn-sm btn-primary edit-event-btn" data-event-id="${event.id}" title="Edit Event">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-event-btn" data-event-id="${event.id}" title="Delete Event">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="event-content-admin">
                    <h4 class="event-title-admin">${window.utils.escapeHtml(event.name)}</h4>
                    <div class="event-meta-admin">
                        <div class="event-meta-item-admin">
                            <i class="fas fa-calendar"></i>
                            <span>${window.utils.formatDate(event.start_date)} - ${window.utils.formatDate(event.end_date)}</span>
                        </div>
                        <div class="event-meta-item-admin">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${window.utils.escapeHtml(event.location || 'Location TBD')}</span>
                        </div>
                        <div class="event-meta-item-admin">
                            <i class="fas fa-info-circle"></i>
                            <span class="status-badge-admin ${event.status}">${event.status.toUpperCase()}</span>
                        </div>
                    </div>

                    <div class="event-actions-admin">
                        <button class="btn btn-sm btn-outline edit-event-btn" data-event-id="${event.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger delete-event-btn" data-event-id="${event.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Bind event listeners for event management
        container.querySelectorAll('.edit-event-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.closest('[data-event-id]').dataset.eventId;
                this.showEventEditModal(eventId);
            });
        });

        container.querySelectorAll('.delete-event-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.closest('[data-event-id]').dataset.eventId;
                this.deleteEvent(eventId);
            });
        });
    }

    async loadSalesRepsForAdmin() {
        try {
            console.log('👥 Loading sales reps for admin');
            const response = await window.apiClient.request('GET', '/sales-reps/admin/all');
            
            if (response.success) {
                this.salesReps = response.data.data || response.data;
                this.renderSalesRepsAdmin();
                console.log(`✅ Loaded ${this.salesReps.length} sales reps for admin`);
            } else {
                throw new Error(response.error || 'Failed to load sales reps');
            }
        } catch (error) {
            console.error('❌ Error loading sales reps for admin:', error);
            window.utils.showError('Failed to load sales reps. Please try again.');
        }
    }

    renderSalesRepsAdmin() {
        const container = document.getElementById('salesRepsContainer');
        if (!container) return;

        if (this.salesReps.length === 0) {
            container.innerHTML = '<div class="empty-state"><h4>No Sales Reps Found</h4><p>Add your first sales representative to get started.</p></div>';
            return;
        }

        container.innerHTML = this.salesReps.map(rep => `
            <div class="sales-rep-card-admin" data-rep-id="${rep.id}">
                <div class="sales-rep-photo-admin">
                    <img src="${rep.photo_url || '/images/team/default-avatar.svg'}" alt="${window.utils.escapeHtml(rep.name)}" class="sales-rep-avatar-admin">
                    <div class="photo-actions-overlay">
                        <button class="btn btn-sm btn-primary edit-rep-btn" data-rep-id="${rep.id}" title="Edit Profile">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </div>
                <h4 class="sales-rep-name-admin">${window.utils.escapeHtml(rep.name)}</h4>
                <div class="sales-rep-department-admin">${window.utils.escapeHtml(rep.department || 'General')}</div>
                <div class="sales-rep-contact-admin">
                    <div class="contact-item-admin">
                        <i class="fas fa-envelope"></i>
                        <span>${window.utils.escapeHtml(rep.email || '')}</span>
                    </div>
                </div>
                <p class="sales-rep-bio-admin">${window.utils.escapeHtml((rep.bio || 'No bio available').substring(0, 100))}${rep.bio && rep.bio.length > 100 ? '...' : ''}</p>
                <div class="sales-rep-actions-admin">
                    <span class="status-badge-admin ${rep.availability_status}">${rep.availability_status.toUpperCase()}</span>
                    <button class="btn btn-sm btn-outline edit-rep-btn" data-rep-id="${rep.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger delete-rep-btn" data-rep-id="${rep.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');

        // Bind event listeners for sales rep management
        container.querySelectorAll('.edit-rep-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const repId = e.target.closest('[data-rep-id]').dataset.repId;
                this.showSalesRepEditModal(repId);
            });
        });

        container.querySelectorAll('.delete-rep-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const repId = e.target.closest('[data-rep-id]').dataset.repId;
                this.deleteSalesRep(repId);
            });
        });
    }

    showEventEditModal(eventId = null) {
        const modal = document.getElementById('eventEditModal');
        const form = document.getElementById('eventEditForm');
        
        if (eventId) {
            const event = this.events.find(e => e.id == eventId);
            if (event) {
                document.getElementById('editEventId').value = event.id;
                document.getElementById('editEventName').value = event.name;
                document.getElementById('editEventLocation').value = event.location || '';
                document.getElementById('editEventDescription').value = event.description || '';
                document.getElementById('editEventStartDate').value = event.start_date ? event.start_date.split(' ')[0] : '';
                document.getElementById('editEventEndDate').value = event.end_date ? event.end_date.split(' ')[0] : '';
                document.getElementById('editEventStatus').value = event.status;
                
                // Show current image if exists
                if (event.image_url) {
                    const currentImage = document.getElementById('currentEventImage');
                    const img = currentImage.querySelector('img');
                    img.src = event.image_url;
                    currentImage.style.display = 'block';
                }
            }
        } else {
            form.reset();
            document.getElementById('editEventId').value = '';
            document.getElementById('currentEventImage').style.display = 'none';
        }
        
        modal.classList.add('show');
    }

    showSalesRepEditModal(repId = null) {
        const modal = document.getElementById('salesRepEditModal');
        const form = document.getElementById('salesRepEditForm');
        
        if (repId) {
            const rep = this.salesReps.find(r => r.id == repId);
            if (rep) {
                document.getElementById('editSalesRepId').value = rep.id;
                document.getElementById('editSalesRepName').value = rep.name;
                document.getElementById('editSalesRepEmail').value = rep.email || '';
                document.getElementById('editSalesRepPhone').value = rep.phone || '';
                document.getElementById('editSalesRepDepartment').value = rep.department || '';
                document.getElementById('editSalesRepBio').value = rep.bio || '';
                document.getElementById('editSalesRepStatus').value = rep.availability_status;
                
                // Show current photo if exists
                if (rep.photo_url) {
                    const currentPhoto = document.getElementById('currentSalesRepPhoto');
                    const img = currentPhoto.querySelector('img');
                    img.src = rep.photo_url;
                    currentPhoto.style.display = 'block';
                }
            }
        } else {
            form.reset();
            document.getElementById('editSalesRepId').value = '';
            document.getElementById('currentSalesRepPhoto').style.display = 'none';
        }
        
        modal.classList.add('show');
    }

    async saveEvent() {
        try {
            const form = document.getElementById('eventEditForm');
            const formData = new FormData(form);
            
            const eventId = document.getElementById('editEventId').value;
            const eventData = {
                name: document.getElementById('editEventName').value,
                location: document.getElementById('editEventLocation').value,
                description: document.getElementById('editEventDescription').value,
                start_date: document.getElementById('editEventStartDate').value,
                end_date: document.getElementById('editEventEndDate').value,
                status: document.getElementById('editEventStatus').value
            };
            
            // Handle image upload if file is selected
            const imageFile = document.getElementById('editEventImage').files[0];
            if (imageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('image', imageFile);
                
                const uploadResponse = await fetch('/api/uploads/events', {
                    method: 'POST',
                    body: uploadFormData
                });
                
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    eventData.image_url = uploadResult.data.path;
                }
            }
            
            let response;
            if (eventId) {
                response = await window.apiClient.updateEvent(eventId, eventData);
            } else {
                response = await window.apiClient.createEvent(eventData);
            }
            
            if (response.success) {
                window.utils.showSuccess(eventId ? 'Event updated successfully!' : 'Event created successfully!');
                await this.loadEventsForAdmin();
                await this.loadDashboardData();
                document.getElementById('eventEditModal').classList.remove('show');
            } else {
                throw new Error(response.error || 'Failed to save event');
            }
            
        } catch (error) {
            console.error('❌ Error saving event:', error);
            window.utils.showError(error.message || 'Failed to save event. Please try again.');
        }
    }

    async saveSalesRep() {
        try {
            const form = document.getElementById('salesRepEditForm');
            
            const repId = document.getElementById('editSalesRepId').value;
            const repData = {
                name: document.getElementById('editSalesRepName').value,
                email: document.getElementById('editSalesRepEmail').value,
                phone: document.getElementById('editSalesRepPhone').value,
                department: document.getElementById('editSalesRepDepartment').value,
                bio: document.getElementById('editSalesRepBio').value,
                availability_status: document.getElementById('editSalesRepStatus').value
            };
            
            // Handle photo upload if file is selected
            const photoFile = document.getElementById('editSalesRepPhoto').files[0];
            if (photoFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('image', photoFile);
                
                const uploadResponse = await fetch('/api/uploads/team', {
                    method: 'POST',
                    body: uploadFormData
                });
                
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    repData.photo_url = uploadResult.data.path;
                }
            }
            
            let response;
            if (repId) {
                response = await window.apiClient.updateSalesRep(repId, repData);
            } else {
                response = await window.apiClient.createSalesRep(repData);
            }
            
            if (response.success) {
                window.utils.showSuccess(repId ? 'Sales representative updated successfully!' : 'Sales representative created successfully!');
                await this.loadSalesRepsForAdmin();
                await this.loadDashboardData();
                document.getElementById('salesRepEditModal').classList.remove('show');
            } else {
                throw new Error(response.error || 'Failed to save sales representative');
            }
            
        } catch (error) {
            console.error('❌ Error saving sales rep:', error);
            window.utils.showError(error.message || 'Failed to save sales representative. Please try again.');
        }
    }

    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await window.apiClient.deleteEvent(eventId);
            
            if (response.success) {
                window.utils.showSuccess('Event deleted successfully!');
                await this.loadEventsForAdmin();
                await this.loadDashboardData();
            } else {
                throw new Error(response.error || 'Failed to delete event');
            }
        } catch (error) {
            console.error('❌ Error deleting event:', error);
            window.utils.showError(error.message || 'Failed to delete event. Please try again.');
        }
    }

    async deleteSalesRep(repId) {
        if (!confirm('Are you sure you want to delete this sales representative? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await window.apiClient.deleteSalesRep(repId);
            
            if (response.success) {
                window.utils.showSuccess('Sales representative deleted successfully!');
                await this.loadSalesRepsForAdmin();
                await this.loadDashboardData();
            } else {
                throw new Error(response.error || 'Failed to delete sales representative');
            }
        } catch (error) {
            console.error('❌ Error deleting sales rep:', error);
            window.utils.showError(error.message || 'Failed to delete sales representative. Please try again.');
        }
    }

    // Update existing methods to use new admin versions
    async loadEvents() {
        await this.loadEventsForAdmin();
    }

    async loadSalesReps() {
        await this.loadSalesRepsForAdmin();
    }
}

// Initialize admin app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminApp();
    
    // Bind new event listeners
    document.getElementById('addEventBtn')?.addEventListener('click', () => {
        window.adminApp.showEventEditModal();
    });
    
    document.getElementById('addSalesRepBtn')?.addEventListener('click', () => {
        window.adminApp.showSalesRepEditModal();
    });
    
    document.getElementById('saveEventBtn')?.addEventListener('click', () => {
        window.adminApp.saveEvent();
    });
    
    document.getElementById('saveSalesRepBtn')?.addEventListener('click', () => {
        window.adminApp.saveSalesRep();
    });
    
    // Quick action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            switch(action) {
                case 'add-event':
                    window.adminApp.showEventEditModal();
                    break;
                case 'add-sales-rep':
                    window.adminApp.showSalesRepEditModal();
                    break;
                case 'view-pending':
                    window.adminApp.switchTab('meetings');
                    break;
                case 'export-data':
                    // TODO: Implement data export functionality
                    window.utils.showSuccess('Export functionality coming soon!');
                    break;
            }
        });
    });
    
    // Image remove buttons
    document.querySelectorAll('.remove-image').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentImage = e.target.closest('.current-image');
            currentImage.style.display = 'none';
            
            // Clear the file input
            const fileInput = currentImage.closest('.form-group').querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.value = '';
            }
        });
    });
});

console.log('✅ Enhanced Admin.js loaded successfully');
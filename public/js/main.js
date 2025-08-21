// Main application logic
class CorporateEventsApp {
    constructor() {
        this.currentSection = 'hero';
        this.events = [];
        this.salesReps = [];
        this.departments = [];
        this.selectedEvent = null;
        this.selectedSalesRep = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Corporate Events App');
        
        // Bind event listeners
        this.bindEventListeners();
        
        // Load initial data
        await this.loadInitialData();
        
        console.log('✅ App initialized successfully');
    }

    bindEventListeners() {
        // Navigation links
        document.getElementById('navHome')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('hero');
            this.updateNavigation('navHome');
        });

        document.getElementById('navEvents')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('events');
            this.updateNavigation('navEvents');
        });

        document.getElementById('navSalesReps')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('salesReps');
            this.updateNavigation('navSalesReps');
        });

        // Navigation buttons
        document.getElementById('viewEventsBtn')?.addEventListener('click', () => {
            this.showSection('events');
            this.updateNavigation('navEvents');
        });

        document.getElementById('requestMeetingBtn')?.addEventListener('click', () => {
            this.showSection('meetingRequest');
            this.updateNavigation('navHome');
        });

        document.getElementById('viewSalesRepsBtn')?.addEventListener('click', () => {
            this.showSection('salesReps');
            this.updateNavigation('navSalesReps');
        });

        // Refresh buttons
        document.getElementById('refreshEventsBtn')?.addEventListener('click', () => {
            this.loadEvents();
        });

        document.getElementById('refreshSalesRepsBtn')?.addEventListener('click', () => {
            this.loadSalesReps();
        });

        // Search inputs
        const eventSearchInput = document.getElementById('eventSearchInput');
        if (eventSearchInput) {
            eventSearchInput.addEventListener('input', 
                window.utils.debounce(() => this.filterEvents(), 300)
            );
        }

        const salesRepSearchInput = document.getElementById('salesRepSearchInput');
        if (salesRepSearchInput) {
            salesRepSearchInput.addEventListener('input', 
                window.utils.debounce(() => this.filterSalesReps(), 300)
            );
        }

        // Department filter
        const departmentFilter = document.getElementById('departmentFilter');
        if (departmentFilter) {
            departmentFilter.addEventListener('change', () => this.filterSalesReps());
        }

        // Meeting request form
        const meetingForm = document.getElementById('meetingRequestForm');
        if (meetingForm) {
            meetingForm.addEventListener('submit', (e) => this.handleMeetingRequest(e));
        }

        // Event selection for meeting request
        const eventSelect = document.getElementById('meetingEventSelect');
        if (eventSelect) {
            eventSelect.addEventListener('change', (e) => this.handleEventSelection(e));
        }

        // Modal close buttons
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

        // Schedule from modals
        document.getElementById('scheduleFromEvent')?.addEventListener('click', () => {
            this.scheduleFromEvent();
        });

        document.getElementById('scheduleFromSalesRep')?.addEventListener('click', () => {
            this.scheduleFromSalesRep();
        });

        console.log('✅ Event listeners bound');
    }

    async loadInitialData() {
        try {
            console.log('📊 Loading initial data...');
            
            // Load events and sales reps in parallel
            await Promise.all([
                this.loadEvents(),
                this.loadSalesReps(),
                this.loadDepartments()
            ]);
            
            // Populate form selects
            this.populateEventSelect();
            this.populateDepartmentFilter();
            
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            window.utils.showError('Failed to load initial data. Please refresh the page.');
        }
    }

    async loadEvents() {
        try {
            console.log('📅 Loading events...');
            
            const eventsContainer = document.getElementById('eventsContainer');
            const eventsLoading = document.getElementById('eventsLoading');
            
            if (eventsLoading) eventsLoading.style.display = 'block';
            
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
            const eventsContainer = document.getElementById('eventsContainer');
            if (eventsContainer) {
                window.utils.showError('Failed to load events. Please try again.', eventsContainer);
            }
        } finally {
            const eventsLoading = document.getElementById('eventsLoading');
            if (eventsLoading) eventsLoading.style.display = 'none';
        }
    }

    async loadSalesReps() {
        try {
            console.log('👥 Loading sales representatives...');
            
            const salesRepsLoading = document.getElementById('salesRepsLoading');
            if (salesRepsLoading) salesRepsLoading.style.display = 'block';
            
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
            const salesRepsContainer = document.getElementById('salesRepsContainer');
            if (salesRepsContainer) {
                window.utils.showError('Failed to load sales representatives. Please try again.', salesRepsContainer);
            }
        } finally {
            const salesRepsLoading = document.getElementById('salesRepsLoading');
            if (salesRepsLoading) salesRepsLoading.style.display = 'none';
        }
    }

    async loadDepartments() {
        try {
            console.log('🏢 Loading departments...');
            
            const response = await window.apiClient.getDepartments();
            
            if (response.success) {
                this.departments = response.data;
                console.log(`✅ Loaded ${this.departments.length} departments`);
            } else {
                throw new Error(response.error || 'Failed to load departments');
            }
            
        } catch (error) {
            console.error('❌ Error loading departments:', error);
            // Don't show error for departments as it's not critical
        }
    }

    showSection(sectionName) {
        console.log(`🔄 Switching to section: ${sectionName}`);
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Hide hero if showing a section
        const hero = document.querySelector('.hero');
        const features = document.querySelector('.features');
        
        if (sectionName !== 'hero') {
            if (hero) hero.style.display = 'none';
            if (features) features.style.display = 'none';
        } else {
            if (hero) hero.style.display = 'block';
            if (features) features.style.display = 'block';
        }
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        this.currentSection = sectionName;
        
        // Load data if needed
        if (sectionName === 'events' && this.events.length === 0) {
            this.loadEvents();
        } else if (sectionName === 'salesReps' && this.salesReps.length === 0) {
            this.loadSalesReps();
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateNavigation(activeNavId) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current nav link
        const activeNav = document.getElementById(activeNavId);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    renderEvents() {
        const container = document.getElementById('eventsContainer');
        if (!container) return;
        
        if (this.events.length === 0) {
            container.innerHTML = `
                <div class="info-message">
                    <i class="fas fa-info-circle"></i>
                    <span>No events found.</span>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.events.map(event => {
            const isPast = event.status === 'past';
            const statusBadge = isPast ? '<div class="event-status-badge event-status-past">Event Concluded</div>' : '';
            
            return `
                <div class="event-card ${isPast ? 'event-past' : ''}" data-event-id="${event.id}">
                    <div class="event-card-header">
                        <div class="event-logo">
                            <i data-lucide="calendar"></i>
                        </div>
                        <div class="event-badges">
                            <div class="event-rep-badge">
                                ${event.sales_rep_count} ${event.sales_rep_count === 1 ? 'Rep' : 'Reps'}
                            </div>
                            ${statusBadge}
                        </div>
                    </div>
                    
                    <h3 class="event-title">${window.utils.escapeHtml(event.name)}</h3>
                    
                    <div class="event-meta">
                        <div class="event-meta-item">
                            <i data-lucide="calendar-days"></i>
                            <span>${window.utils.formatDate(event.start_date)} - ${window.utils.formatDate(event.end_date)}</span>
                        </div>
                        <div class="event-meta-item">
                            <i data-lucide="map-pin"></i>
                            <span>${window.utils.escapeHtml(event.location || 'Location TBD')}</span>
                        </div>
                    </div>
                    
                    <p class="event-description">
                        ${window.utils.escapeHtml(event.description || 'Connect with our team at this upcoming event and explore partnership opportunities.')}
                    </p>
                    
                    <div class="event-actions">
                        ${isPast ? `
                            <button class="event-cta-primary event-cta-disabled" disabled>
                                <i data-lucide="calendar-x"></i>
                                Meeting Requests Closed
                            </button>
                        ` : `
                            <button class="event-cta-primary schedule-meeting" data-event-id="${event.id}">
                                <i data-lucide="calendar-plus"></i>
                                Schedule Meeting
                            </button>
                        `}
                        <button class="event-cta-secondary view-event-details" data-event-id="${event.id}">
                            <i data-lucide="eye"></i>
                            View Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Reinitialize Lucide icons for dynamic content
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Bind event card buttons
        container.querySelectorAll('.view-event-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.closest('[data-event-id]').dataset.eventId;
                this.showEventDetails(eventId);
            });
        });
        
        container.querySelectorAll('.schedule-meeting').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.closest('[data-event-id]').dataset.eventId;
                this.scheduleFromEventId(eventId);
            });
        });
    }

    renderSalesReps() {
        const container = document.getElementById('salesRepsContainer');
        if (!container) return;
        
        if (this.salesReps.length === 0) {
            container.innerHTML = `
                <div class="info-message">
                    <i class="fas fa-info-circle"></i>
                    <span>No sales representatives found.</span>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.salesReps.map(rep => `
            <div class="card sales-rep-card" data-rep-id="${rep.id}">
                <div class="card-header">
                    <h4 class="card-title">${window.utils.escapeHtml(rep.name)}</h4>
                    <div class="badge badge-info">${window.utils.escapeHtml(rep.department || 'General')}</div>
                </div>
                <div class="card-body">
                    <p class="card-text">
                        <i class="fas fa-envelope"></i>
                        <a href="mailto:${rep.email}">${window.utils.escapeHtml(rep.email)}</a>
                    </p>
                    ${rep.phone ? `
                        <p class="card-text">
                            <i class="fas fa-phone"></i>
                            <a href="tel:${rep.phone}">${window.utils.escapeHtml(rep.phone)}</a>
                        </p>
                    ` : ''}
                    <p class="card-text bio">
                        ${window.utils.escapeHtml(rep.bio || 'No bio available')}
                    </p>
                    <p class="card-text">
                        <i class="fas fa-calendar-check"></i>
                        <span class="badge badge-success">Available for ${rep.event_count} events</span>
                    </p>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary btn-sm view-rep-details" data-rep-id="${rep.id}">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-secondary btn-sm schedule-with-rep" data-rep-id="${rep.id}">
                        <i class="fas fa-calendar-plus"></i> Schedule Meeting
                    </button>
                </div>
            </div>
        `).join('');
        
        // Bind sales rep card buttons
        container.querySelectorAll('.view-rep-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const repId = e.target.closest('[data-rep-id]').dataset.repId;
                this.showSalesRepDetails(repId);
            });
        });
        
        container.querySelectorAll('.schedule-with-rep').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const repId = e.target.closest('[data-rep-id]').dataset.repId;
                this.scheduleFromSalesRepId(repId);
            });
        });
    }

    populateEventSelect() {
        const select = document.getElementById('meetingEventSelect');
        if (!select) return;
        
        // Filter out past events from the dropdown
        const activeEvents = this.events.filter(event => event.status !== 'past');
        
        select.innerHTML = '<option value="">Choose an event...</option>' + 
            activeEvents.map(event => `
                <option value="${event.id}">
                    ${window.utils.escapeHtml(event.name)} - ${window.utils.formatDate(event.start_date)}
                </option>
            `).join('');
    }

    populateDepartmentFilter() {
        const select = document.getElementById('departmentFilter');
        if (!select) return;
        
        select.innerHTML = '<option value="">All Departments</option>' + 
            this.departments.map(dept => `
                <option value="${window.utils.escapeHtml(dept)}">${window.utils.escapeHtml(dept)}</option>
            `).join('');
    }

    async handleEventSelection(e) {
        const eventId = e.target.value;
        const salesRepSelect = document.getElementById('meetingSalesRepSelect');
        
        if (!salesRepSelect) return;
        
        if (!eventId) {
            salesRepSelect.innerHTML = '<option value="">First select an event...</option>';
            salesRepSelect.disabled = true;
            return;
        }
        
        try {
            salesRepSelect.innerHTML = '<option value="">Loading sales reps...</option>';
            salesRepSelect.disabled = true;
            
            const response = await window.apiClient.getSalesRepsForEvent(eventId);
            
            if (response.success && response.data.length > 0) {
                salesRepSelect.innerHTML = '<option value="">Choose a sales representative...</option>' + 
                    response.data.map(rep => `
                        <option value="${rep.id}">
                            ${window.utils.escapeHtml(rep.name)} - ${window.utils.escapeHtml(rep.department || 'General')}
                        </option>
                    `).join('');
                salesRepSelect.disabled = false;
            } else {
                salesRepSelect.innerHTML = '<option value="">No sales reps available for this event</option>';
                salesRepSelect.disabled = true;
            }
            
        } catch (error) {
            console.error('❌ Error loading sales reps for event:', error);
            salesRepSelect.innerHTML = '<option value="">Error loading sales reps</option>';
            salesRepSelect.disabled = true;
        }
    }

    async handleMeetingRequest(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Get form values
        const meetingData = {
            eventId: document.getElementById('meetingEventSelect').value,
            salesRepId: document.getElementById('meetingSalesRepSelect').value,
            clientName: document.getElementById('clientName').value.trim(),
            clientEmail: document.getElementById('clientEmail').value.trim(),
            clientCompany: document.getElementById('clientCompany').value.trim(),
            clientPhone: document.getElementById('clientPhone').value.trim(),
            preferredDate: document.getElementById('preferredDate').value,
            preferredTime: document.getElementById('preferredTime').value,
            duration: parseInt(document.getElementById('meetingDuration').value),
            message: document.getElementById('meetingMessage').value.trim()
        };
        
        // Validate required fields
        if (!meetingData.eventId || !meetingData.salesRepId || !meetingData.clientName || !meetingData.clientEmail) {
            window.utils.showError('Please fill in all required fields.');
            return;
        }
        
        // Validate email
        if (!window.utils.isValidEmail(meetingData.clientEmail)) {
            window.utils.showError('Please enter a valid email address.');
            return;
        }
        
        try {
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;
            
            console.log('📝 Submitting meeting request:', meetingData);
            
            const response = await window.apiClient.requestMeeting(meetingData);
            
            if (response.success) {
                window.utils.showSuccess('Meeting request submitted successfully! You will receive a confirmation email shortly.');
                form.reset();
                
                // Reset selects
                document.getElementById('meetingSalesRepSelect').innerHTML = '<option value="">First select an event...</option>';
                document.getElementById('meetingSalesRepSelect').disabled = true;
                
                // Show meeting details
                this.showMeetingDetails(response.data);
                
            } else {
                throw new Error(response.error || 'Failed to submit meeting request');
            }
            
        } catch (error) {
            console.error('❌ Error submitting meeting request:', error);
            window.utils.showError(error.message || 'Failed to submit meeting request. Please try again.');
        } finally {
            // Reset button
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Meeting Request';
            submitBtn.disabled = false;
        }
    }

    async showEventDetails(eventId) {
        try {
            const response = await window.apiClient.getEvent(eventId);
            
            if (response.success) {
                const event = response.data;
                const modal = document.getElementById('eventDetailsModal');
                const content = document.getElementById('eventDetailsContent');
                
                content.innerHTML = `
                    <div class="event-details">
                        <h5>${window.utils.escapeHtml(event.name)}</h5>
                        <p><strong>Date:</strong> ${window.utils.formatDate(event.start_date)} - ${window.utils.formatDate(event.end_date)}</p>
                        <p><strong>Location:</strong> ${window.utils.escapeHtml(event.location || 'Location TBD')}</p>
                        <p><strong>Description:</strong> ${window.utils.escapeHtml(event.description || 'No description available')}</p>
                        
                        <h6>Available Sales Representatives (${event.salesReps?.length || 0}):</h6>
                        ${event.salesReps && event.salesReps.length > 0 ? `
                            <div class="sales-reps-list">
                                ${event.salesReps.map(rep => `
                                    <div class="sales-rep-item">
                                        <strong>${window.utils.escapeHtml(rep.name)}</strong>
                                        <span class="badge badge-info">${window.utils.escapeHtml(rep.department || 'General')}</span>
                                        <br>
                                        <small>${window.utils.escapeHtml(rep.bio || 'No bio available')}</small>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p>No sales representatives assigned to this event.</p>'}
                    </div>
                `;
                
                this.selectedEvent = event;
                modal.classList.add('show');
                
            } else {
                throw new Error(response.error || 'Failed to load event details');
            }
            
        } catch (error) {
            console.error('❌ Error loading event details:', error);
            window.utils.showError('Failed to load event details. Please try again.');
        }
    }

    async showSalesRepDetails(repId) {
        try {
            const response = await window.apiClient.getSalesRep(repId);
            
            if (response.success) {
                const rep = response.data;
                const modal = document.getElementById('salesRepDetailsModal');
                const content = document.getElementById('salesRepDetailsContent');
                
                content.innerHTML = `
                    <div class="sales-rep-details">
                        <h5>${window.utils.escapeHtml(rep.name)}</h5>
                        <p><strong>Department:</strong> ${window.utils.escapeHtml(rep.department || 'General')}</p>
                        <p><strong>Email:</strong> <a href="mailto:${rep.email}">${window.utils.escapeHtml(rep.email)}</a></p>
                        ${rep.phone ? `<p><strong>Phone:</strong> <a href="tel:${rep.phone}">${window.utils.escapeHtml(rep.phone)}</a></p>` : ''}
                        <p><strong>Bio:</strong> ${window.utils.escapeHtml(rep.bio || 'No bio available')}</p>
                        
                        <h6>Available at Events (${rep.events?.length || 0}):</h6>
                        ${rep.events && rep.events.length > 0 ? `
                            <div class="events-list">
                                ${rep.events.map(event => `
                                    <div class="event-item">
                                        <strong>${window.utils.escapeHtml(event.name)}</strong>
                                        <br>
                                        <small>${window.utils.formatDate(event.start_date)} - ${window.utils.formatDate(event.end_date)}</small>
                                        <br>
                                        <small><i class="fas fa-map-marker-alt"></i> ${window.utils.escapeHtml(event.location || 'Location TBD')}</small>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p>Not assigned to any events.</p>'}
                    </div>
                `;
                
                this.selectedSalesRep = rep;
                modal.classList.add('show');
                
            } else {
                throw new Error(response.error || 'Failed to load sales rep details');
            }
            
        } catch (error) {
            console.error('❌ Error loading sales rep details:', error);
            window.utils.showError('Failed to load sales representative details. Please try again.');
        }
    }

    showMeetingDetails(meeting) {
        const modal = document.getElementById('meetingDetailsModal');
        const content = document.getElementById('meetingDetailsContent');
        
        content.innerHTML = `
            <div class="meeting-success">
                <div class="success-message">
                    <i class="fas fa-check-circle"></i>
                    <span>Meeting request submitted successfully!</span>
                </div>
                
                <h6>Meeting Details:</h6>
                <p><strong>Request ID:</strong> #${meeting.id}</p>
                <p><strong>Event:</strong> ${window.utils.escapeHtml(meeting.event_name)}</p>
                <p><strong>Sales Representative:</strong> ${window.utils.escapeHtml(meeting.sales_rep_name)}</p>
                <p><strong>Client:</strong> ${window.utils.escapeHtml(meeting.client_name)}</p>
                <p><strong>Email:</strong> ${window.utils.escapeHtml(meeting.client_email)}</p>
                ${meeting.preferred_date ? `<p><strong>Preferred Date:</strong> ${window.utils.formatDate(meeting.preferred_date)}</p>` : ''}
                ${meeting.preferred_time ? `<p><strong>Preferred Time:</strong> ${meeting.preferred_time}</p>` : ''}
                <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
                <p><strong>Status:</strong> <span class="badge badge-warning">Pending Approval</span></p>
                
                <div class="info-message">
                    <i class="fas fa-info-circle"></i>
                    <span>You will receive a confirmation email with calendar invite once the meeting is approved.</span>
                </div>
            </div>
        `;
        
        modal.classList.add('show');
    }

    scheduleFromEvent() {
        if (this.selectedEvent) {
            document.getElementById('eventDetailsModal').classList.remove('show');
            this.showSection('meetingRequest');
            
            // Pre-select the event
            const eventSelect = document.getElementById('meetingEventSelect');
            if (eventSelect) {
                eventSelect.value = this.selectedEvent.id;
                eventSelect.dispatchEvent(new Event('change'));
            }
        }
    }

    scheduleFromSalesRep() {
        if (this.selectedSalesRep) {
            document.getElementById('salesRepDetailsModal').classList.remove('show');
            this.showSection('meetingRequest');
            
            // If sales rep has events, pre-select the first one
            if (this.selectedSalesRep.events && this.selectedSalesRep.events.length > 0) {
                const eventSelect = document.getElementById('meetingEventSelect');
                if (eventSelect) {
                    eventSelect.value = this.selectedSalesRep.events[0].id;
                    eventSelect.dispatchEvent(new Event('change'));
                    
                    // Pre-select the sales rep after a short delay
                    setTimeout(() => {
                        const salesRepSelect = document.getElementById('meetingSalesRepSelect');
                        if (salesRepSelect) {
                            salesRepSelect.value = this.selectedSalesRep.id;
                        }
                    }, 500);
                }
            }
        }
    }

    scheduleFromEventId(eventId) {
        this.selectedEvent = this.events.find(e => e.id == eventId);
        this.scheduleFromEvent();
    }

    scheduleFromSalesRepId(repId) {
        this.selectedSalesRep = this.salesReps.find(r => r.id == repId);
        this.scheduleFromSalesRep();
    }

    filterEvents() {
        const searchTerm = document.getElementById('eventSearchInput')?.value.toLowerCase() || '';
        
        const filteredEvents = this.events.filter(event => 
            event.name.toLowerCase().includes(searchTerm) ||
            event.description?.toLowerCase().includes(searchTerm) ||
            event.location?.toLowerCase().includes(searchTerm)
        );
        
        const container = document.getElementById('eventsContainer');
        if (container) {
            // Temporarily store filtered events
            const originalEvents = this.events;
            this.events = filteredEvents;
            this.renderEvents();
            this.events = originalEvents;
        }
    }

    filterSalesReps() {
        const searchTerm = document.getElementById('salesRepSearchInput')?.value.toLowerCase() || '';
        const department = document.getElementById('departmentFilter')?.value || '';
        
        const filteredReps = this.salesReps.filter(rep => {
            const matchesSearch = !searchTerm || 
                rep.name.toLowerCase().includes(searchTerm) ||
                rep.email.toLowerCase().includes(searchTerm) ||
                rep.bio?.toLowerCase().includes(searchTerm) ||
                rep.department?.toLowerCase().includes(searchTerm);
            
            const matchesDepartment = !department || rep.department === department;
            
            return matchesSearch && matchesDepartment;
        });
        
        const container = document.getElementById('salesRepsContainer');
        if (container) {
            // Temporarily store filtered reps
            const originalReps = this.salesReps;
            this.salesReps = filteredReps;
            this.renderSalesReps();
            this.salesReps = originalReps;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.corporateEventsApp = new CorporateEventsApp();
});

console.log('✅ Main.js loaded successfully');
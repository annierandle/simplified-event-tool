// Main application logic
class CorporateEventsApp {
    constructor() {
        this.currentSection = 'hero';
        this.events = [];
        this.salesReps = [];
        this.departments = [];
        this.selectedEvent = null;
        this.selectedSalesRep = null;
        this.eventFilter = 'active'; // 'active', 'past', 'all'
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Corporate Events App');
        
        // Bind event listeners
        this.bindEventListeners();
        
        // Load initial data
        await this.loadInitialData();
        
        // Load saved text changes
        setTimeout(() => this.loadSavedTextChanges(), 100);
        
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

        // Event filter toggles
        document.getElementById('showActiveEvents')?.addEventListener('click', () => {
            this.setEventFilter('active');
        });

        document.getElementById('showPastEvents')?.addEventListener('click', () => {
            this.setEventFilter('past');
        });

        document.getElementById('showAllEvents')?.addEventListener('click', () => {
            this.setEventFilter('all');
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

        // Initialize editable text system
        this.initializeEditableText();
        
        // Add keyboard shortcut to reset all text changes (Ctrl+Shift+R)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                if (confirm('Reset all text changes to default? This cannot be undone.')) {
                    localStorage.removeItem('orchestrateTextChanges');
                    location.reload();
                }
            }
        });
        
        console.log('✅ Event listeners bound');
    }

    initializeEditableText() {
        // Add editable class to text elements that should be editable
        const editableSelectors = [
            '.hero-title',
            '.hero-subtitle', 
            '.section-title',
            '.feature-title',
            '.feature-description',
            '.events-hero-title',
            '.events-hero-subtitle',
            'h3',
            'p:not(.footer-text)',
            '.form-label'
        ];
        
        editableSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                // Skip elements that are already inputs or have specific functionality
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || 
                    element.tagName === 'SELECT' || element.closest('form') ||
                    element.classList.contains('no-edit')) {
                    return;
                }
                
                element.classList.add('editable-text');
                element.setAttribute('title', 'Double-click to edit');
                element.style.cursor = 'pointer';
            });
        });
        
        // Add double-click event listeners for editable text
        document.addEventListener('dblclick', (e) => {
            if (e.target.classList.contains('editable-text')) {
                this.makeTextEditable(e.target);
            }
        });
        
        console.log('✅ Editable text system initialized');
    }

    makeTextEditable(element) {
        const originalText = element.textContent;
        const originalHTML = element.innerHTML;
        
        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalText;
        input.className = 'editable-input';
        input.style.cssText = `
            font-family: inherit;
            font-size: inherit;
            font-weight: inherit;
            color: inherit;
            background: rgba(255, 90, 95, 0.1);
            border: 2px solid var(--color-coral);
            border-radius: 4px;
            padding: 4px 8px;
            width: 100%;
            min-width: 200px;
        `;
        
        // Replace element content with input
        element.innerHTML = '';
        element.appendChild(input);
        input.focus();
        input.select();
        
        // Handle save on Enter or blur
        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText && newText !== originalText) {
                element.textContent = newText;
                console.log(`📝 Text updated: "${originalText}" → "${newText}"`);
                
                // Store the change in localStorage for persistence
                this.saveTextChange(element, newText);
                
                // Show success feedback
                element.style.background = 'rgba(40, 167, 69, 0.1)';
                setTimeout(() => {
                    element.style.background = '';
                }, 1000);
            } else {
                element.innerHTML = originalHTML;
            }
        };
        
        // Handle cancel on Escape
        const cancelEdit = () => {
            element.innerHTML = originalHTML;
        };
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
    }

    saveTextChange(element, newText) {
        // Create a unique identifier for the element
        const elementId = this.getElementIdentifier(element);
        
        // Get existing changes from localStorage
        const savedChanges = JSON.parse(localStorage.getItem('orchestrateTextChanges') || '{}');
        
        // Save the change
        savedChanges[elementId] = newText;
        localStorage.setItem('orchestrateTextChanges', JSON.stringify(savedChanges));
        
        console.log(`💾 Text change saved for ${elementId}: "${newText}"`);
    }

    getElementIdentifier(element) {
        // Create a unique identifier based on element characteristics
        const tagName = element.tagName.toLowerCase();
        const className = element.className.replace(/\s+/g, '.');
        const textContent = element.textContent.substring(0, 20).replace(/[^\w]/g, '');
        
        return `${tagName}.${className}.${textContent}`;
    }

    loadSavedTextChanges() {
        const savedChanges = JSON.parse(localStorage.getItem('orchestrateTextChanges') || '{}');
        
        Object.entries(savedChanges).forEach(([elementId, newText]) => {
            // Try to find and update elements with saved changes
            document.querySelectorAll('.editable-text').forEach(element => {
                if (this.getElementIdentifier(element) === elementId) {
                    element.textContent = newText;
                }
            });
        });
        
        console.log(`📚 Loaded ${Object.keys(savedChanges).length} saved text changes`);
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
        
        // Filter events based on current filter
        let filteredEvents = this.events;
        if (this.eventFilter === 'active') {
            filteredEvents = this.events.filter(event => event.status !== 'past');
        } else if (this.eventFilter === 'past') {
            filteredEvents = this.events.filter(event => event.status === 'past');
        }
        // 'all' shows all events, no filtering needed
        
        if (filteredEvents.length === 0) {
            const noEventsMessage = this.eventFilter === 'past' ? 
                'No past events found.' : 
                this.eventFilter === 'active' ? 
                'No active events found.' : 
                'No events found.';
            
            container.innerHTML = `
                <div class="info-message">
                    <i class="fas fa-info-circle"></i>
                    <span>${noEventsMessage}</span>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredEvents.map(event => {
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
        
        container.innerHTML = this.salesReps.map(rep => {
            // Map names to image files
            const imageMap = {
                'Sarah Johnson': 'sarah-johnson.jpg',
                'Michael Chen': 'michael-chen.jpg', 
                'Emily Rodriguez': 'emily-rodriguez.jpg',
                'David Thompson': 'david-thompson.jpg'
            };
            const imageName = imageMap[rep.name] || 'default-avatar.jpg';
            
            return `
                <div class="card sales-rep-card" data-rep-id="${rep.id}">
                    <div class="sales-rep-photo">
                        <img src="/images/team/${imageName}" alt="${window.utils.escapeHtml(rep.name)}" class="rep-avatar">
                    </div>
                    <div class="card-header">
                        <h4 class="card-title">${window.utils.escapeHtml(rep.name)}</h4>
                        <div class="badge badge-info">${window.utils.escapeHtml(rep.department || 'General')}</div>
                    </div>
                    <div class="card-body">
                        <p class="card-text bio">
                            ${window.utils.escapeHtml(rep.bio || 'No bio available')}
                        </p>
                        <p class="card-text">
                            <i class="fas fa-calendar-check"></i>
                            <span class="badge badge-success">Available for ${rep.event_count} events</span>
                        </p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-primary btn-sm schedule-with-rep" data-rep-id="${rep.id}">
                            <i class="fas fa-calendar-plus"></i> Schedule Meeting
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Bind sales rep card buttons
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
                    ${window.utils.escapeHtml(event.name)}
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
        const preferredDateInput = document.getElementById('preferredDate');
        
        if (!salesRepSelect) return;
        
        if (!eventId) {
            salesRepSelect.innerHTML = '<option value="">First select an event...</option>';
            salesRepSelect.disabled = true;
            
            // Reset date picker restrictions
            if (preferredDateInput) {
                preferredDateInput.removeAttribute('min');
                preferredDateInput.removeAttribute('max');
                preferredDateInput.value = '';
            }
            return;
        }
        
        // Set date picker restrictions based on selected event
        const selectedEvent = this.events.find(event => event.id == eventId);
        if (selectedEvent && preferredDateInput) {
            // Format dates for input[type="date"] (YYYY-MM-DD format)
            const startDate = new Date(selectedEvent.start_date).toISOString().split('T')[0];
            const endDate = new Date(selectedEvent.end_date).toISOString().split('T')[0];
            
            preferredDateInput.setAttribute('min', startDate);
            preferredDateInput.setAttribute('max', endDate);
            
            // Clear current value if it's outside the event date range
            if (preferredDateInput.value) {
                const currentValue = preferredDateInput.value;
                if (currentValue < startDate || currentValue > endDate) {
                    preferredDateInput.value = '';
                }
            }
            
            console.log(`📅 Date picker restricted to event dates: ${startDate} to ${endDate}`);
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
        if (!meetingData.eventId || !meetingData.salesRepId || !meetingData.clientName || 
            !meetingData.clientEmail || !meetingData.clientCompany || !meetingData.clientPhone ||
            !meetingData.preferredDate || !meetingData.preferredTime || !meetingData.duration) {
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
            console.log(`📅 Navigating to event details page for event ${eventId}`);
            // Navigate to dedicated event page instead of showing modal
            window.location.href = `/event/${eventId}`;
            
        } catch (error) {
            console.error('❌ Error navigating to event details:', error);
            window.utils.showError('Failed to navigate to event details. Please try again.');
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

    setEventFilter(filter) {
        console.log(`📊 Setting event filter to: ${filter}`);
        
        // Update filter state
        this.eventFilter = filter;
        
        // Update filter button states
        document.querySelectorAll('.filter-toggle').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (filter === 'active') {
            document.getElementById('showActiveEvents')?.classList.add('active');
        } else if (filter === 'past') {
            document.getElementById('showPastEvents')?.classList.add('active');
        } else if (filter === 'all') {
            document.getElementById('showAllEvents')?.classList.add('active');
        }
        
        // Re-render events with new filter
        this.renderEvents();
    }

    filterEvents() {
        const searchTerm = document.getElementById('eventSearchInput')?.value.toLowerCase() || '';
        
        // Apply both status filter and search filter
        let filteredEvents = this.events;
        
        // First apply status filter
        if (this.eventFilter === 'active') {
            filteredEvents = filteredEvents.filter(event => event.status !== 'past');
        } else if (this.eventFilter === 'past') {
            filteredEvents = filteredEvents.filter(event => event.status === 'past');
        }
        
        // Then apply search filter
        if (searchTerm) {
            filteredEvents = filteredEvents.filter(event => 
                event.name.toLowerCase().includes(searchTerm) ||
                event.description?.toLowerCase().includes(searchTerm) ||
                event.location?.toLowerCase().includes(searchTerm)
            );
        }
        
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
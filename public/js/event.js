// Event page logic
class EventPage {
    constructor() {
        this.eventId = this.extractEventIdFromUrl();
        this.event = null;
        this.init();
    }

    extractEventIdFromUrl() {
        const path = window.location.pathname;
        const matches = path.match(/\/event\/(\d+)/);
        return matches ? matches[1] : null;
    }

    async init() {
        console.log(`🚀 Initializing Event Page for event ID: ${this.eventId}`);
        
        if (!this.eventId) {
            window.utils.showError('Invalid event ID');
            return;
        }
        
        await this.loadEventDetails();
        
        console.log('✅ Event page initialized successfully');
    }

    async loadEventDetails() {
        try {
            console.log(`📅 Loading event details for ID: ${this.eventId}`);
            
            const response = await window.apiClient.getEvent(this.eventId);
            
            if (response.success) {
                this.event = response.data;
                this.renderEventDetails();
                console.log(`✅ Loaded event: ${this.event.name}`);
            } else {
                throw new Error(response.error || 'Failed to load event details');
            }
            
        } catch (error) {
            console.error('❌ Error loading event details:', error);
            this.renderError(error.message);
        }
    }

    renderEventDetails() {
        const container = document.getElementById('eventDetailsContent');
        if (!container) return;
        
        const isPast = this.event.status === 'past';
        const statusBadge = isPast ? 
            '<div class="event-status-badge event-status-past">Event Concluded</div>' : 
            '<div class="event-status-badge event-status-active">Upcoming Event</div>';

        // Map names to image files for sales reps
        const imageMap = {
            'Sarah Johnson': 'sarah-johnson.jpg',
            'Michael Chen': 'michael-chen.jpg', 
            'Emily Rodriguez': 'emily-rodriguez.jpg',
            'David Thompson': 'david-thompson.jpg'
        };

        container.innerHTML = `
            <div class="event-details-page">
                <div class="event-hero">
                    <div class="event-hero-content">
                        <div class="event-hero-badges">
                            ${statusBadge}
                        </div>
                        <h1 class="event-hero-title">${window.utils.escapeHtml(this.event.name)}</h1>
                        <div class="event-hero-meta">
                            <div class="event-meta-item">
                                <i data-lucide="calendar-days"></i>
                                <span>${window.utils.formatDate(this.event.start_date)} - ${window.utils.formatDate(this.event.end_date)}</span>
                            </div>
                            <div class="event-meta-item">
                                <i data-lucide="map-pin"></i>
                                <span>${window.utils.escapeHtml(this.event.location || 'Location TBD')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="event-content">
                    <div class="event-content-grid">
                        <div class="event-main-content">
                            <div class="event-section">
                                <h2>Event Information</h2>
                                <div class="event-info-card">
                                    <p class="event-description">
                                        ${window.utils.escapeHtml(this.event.description || 'Connect with our team at this event and explore partnership opportunities.')}
                                    </p>
                                </div>
                            </div>

                            <div class="event-section">
                                <h2>Meet Our Team</h2>
                                <p class="section-subtitle">Connect with our sales representatives at this event</p>
                                
                                ${this.event.salesReps && this.event.salesReps.length > 0 ? `
                                    <div class="event-sales-reps-grid">
                                        ${this.event.salesReps.map(rep => {
                                            const imageName = imageMap[rep.name] || 'default-avatar.jpg';
                                            return `
                                                <div class="event-sales-rep-card">
                                                    <div class="event-rep-photo">
                                                        <img src="/images/team/${imageName}" alt="${window.utils.escapeHtml(rep.name)}" class="event-rep-avatar">
                                                    </div>
                                                    <div class="event-rep-content">
                                                        <h4 class="event-rep-name">${window.utils.escapeHtml(rep.name)}</h4>
                                                        <div class="event-rep-department">${window.utils.escapeHtml(rep.department || 'General')}</div>
                                                        <p class="event-rep-bio">${window.utils.escapeHtml(rep.bio || 'No bio available')}</p>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                ` : '<p class="no-reps-message">No sales representatives assigned to this event.</p>'}
                            </div>
                        </div>

                        <div class="event-sidebar">
                            <div class="event-cta-card">
                                <h3>Schedule a Meeting</h3>
                                <p>Connect with our team at this event</p>
                                ${isPast ? `
                                    <button class="btn-primary btn-disabled" disabled>
                                        <i data-lucide="calendar-x"></i>
                                        Meeting Requests Closed
                                    </button>
                                ` : `
                                    <button class="btn-primary schedule-meeting-btn" data-event-id="${this.event.id}">
                                        <i data-lucide="calendar-plus"></i>
                                        Schedule Meeting
                                    </button>
                                `}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Bind schedule meeting button
        const scheduleBtn = container.querySelector('.schedule-meeting-btn');
        if (scheduleBtn) {
            scheduleBtn.addEventListener('click', () => {
                window.location.href = '/#meetingRequest';
            });
        }
    }

    renderError(message) {
        const container = document.getElementById('eventDetailsContent');
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i data-lucide="alert-circle"></i>
                </div>
                <h2>Unable to Load Event</h2>
                <p>${window.utils.escapeHtml(message)}</p>
                <a href="/" class="btn-primary">
                    <i data-lucide="arrow-left"></i>
                    Back to Events
                </a>
            </div>
        `;
        
        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Initialize event page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.eventPage = new EventPage();
});

console.log('✅ Event.js loaded successfully');
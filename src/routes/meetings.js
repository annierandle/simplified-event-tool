const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const OutlookService = require('../utils/outlookService');

// Database connection
const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize Outlook service
const outlookService = new OutlookService();

// Request a meeting
router.post('/request', async (req, res) => {
    console.log('📝 New meeting request:', req.body);
    
    try {
        const {
            eventId,
            salesRepId,
            clientName,
            clientEmail,
            clientCompany,
            clientPhone,
            preferredDate,
            preferredTime,
            duration = 30,
            message
        } = req.body;
        
        // Validate required fields
        if (!eventId || !salesRepId || !clientName || !clientEmail) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: eventId, salesRepId, clientName, clientEmail'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(clientEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }
        
        // Check if event exists and is active
        const eventQuery = 'SELECT * FROM events WHERE id = ? AND status = "active"';
        
        db.get(eventQuery, [eventId], (err, event) => {
            if (err) {
                console.error('❌ Error checking event:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Database error'
                });
            }
            
            if (!event) {
                return res.status(404).json({
                    success: false,
                    error: 'Event not found or inactive'
                });
            }
            
            // Check if sales rep exists and is available
            const salesRepQuery = 'SELECT * FROM sales_reps WHERE id = ? AND availability_status = "available"';
            
            db.get(salesRepQuery, [salesRepId], (err, salesRep) => {
                if (err) {
                    console.error('❌ Error checking sales rep:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Database error'
                    });
                }
                
                if (!salesRep) {
                    return res.status(404).json({
                        success: false,
                        error: 'Sales representative not found or unavailable'
                    });
                }
                
                // Check if sales rep is assigned to this event
                const assignmentQuery = 'SELECT * FROM event_sales_reps WHERE event_id = ? AND sales_rep_id = ?';
                
                db.get(assignmentQuery, [eventId, salesRepId], (err, assignment) => {
                    if (err) {
                        console.error('❌ Error checking assignment:', err);
                        return res.status(500).json({
                            success: false,
                            error: 'Database error'
                        });
                    }
                    
                    if (!assignment) {
                        return res.status(400).json({
                            success: false,
                            error: 'Sales representative is not assigned to this event'
                        });
                    }
                    
                    // Insert meeting request
                    const insertQuery = `
                        INSERT INTO meeting_requests (
                            event_id, sales_rep_id, client_name, client_email, 
                            client_company, client_phone, preferred_date, 
                            preferred_time, duration, message, status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                    `;
                    
                    const stmt = db.prepare(insertQuery);
                    stmt.run([
                        eventId,
                        salesRepId,
                        clientName,
                        clientEmail,
                        clientCompany || null,
                        clientPhone || null,
                        preferredDate || null,
                        preferredTime || null,
                        duration,
                        message || null
                    ], function(err) {
                        if (err) {
                            console.error('❌ Error inserting meeting request:', err);
                            return res.status(500).json({
                                success: false,
                                error: 'Failed to create meeting request'
                            });
                        }
                        
                        const meetingId = this.lastID;
                        console.log(`✅ Meeting request created with ID: ${meetingId}`);
                        
                        // Get the complete meeting request data for response
                        const selectQuery = `
                            SELECT 
                                mr.*,
                                e.name as event_name,
                                e.location as event_location,
                                e.start_date as event_start_date,
                                e.end_date as event_end_date,
                                sr.name as sales_rep_name,
                                sr.email as sales_rep_email,
                                sr.department as sales_rep_department
                            FROM meeting_requests mr
                            JOIN events e ON mr.event_id = e.id
                            JOIN sales_reps sr ON mr.sales_rep_id = sr.id
                            WHERE mr.id = ?
                        `;
                        
                        db.get(selectQuery, [meetingId], async (err, meetingData) => {
                            if (err) {
                                console.error('❌ Error fetching meeting data:', err);
                                return res.status(500).json({
                                    success: false,
                                    error: 'Meeting created but failed to retrieve data'
                                });
                            }
                            
                            // Send confirmation email
                            try {
                                const emailResult = await outlookService.sendMeetingRequestEmail({
                                    meeting: meetingData,
                                    event: {
                                        name: meetingData.event_name,
                                        location: meetingData.event_location,
                                        start_date: meetingData.event_start_date,
                                        end_date: meetingData.event_end_date
                                    },
                                    salesRep: {
                                        name: meetingData.sales_rep_name,
                                        email: meetingData.sales_rep_email,
                                        department: meetingData.sales_rep_department
                                    },
                                    status: 'pending'
                                });
                                
                                console.log('📧 Email result:', emailResult);
                                
                                res.status(201).json({
                                    success: true,
                                    message: 'Meeting request submitted successfully',
                                    data: meetingData,
                                    emailSent: emailResult.success,
                                    emailProvider: emailResult.provider
                                });
                                
                            } catch (emailError) {
                                console.error('❌ Error sending confirmation email:', emailError);
                                
                                // Still return success for the meeting creation
                                res.status(201).json({
                                    success: true,
                                    message: 'Meeting request submitted successfully (email notification failed)',
                                    data: meetingData,
                                    emailSent: false,
                                    emailError: emailError.message
                                });
                            }
                        });
                    });
                    stmt.finalize();
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Meeting request error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get all meeting requests (admin)
router.get('/', (req, res) => {
    console.log('📋 Fetching all meeting requests');
    
    const query = `
        SELECT 
            mr.*,
            e.name as event_name,
            e.location as event_location,
            e.start_date as event_start_date,
            e.end_date as event_end_date,
            sr.name as sales_rep_name,
            sr.email as sales_rep_email,
            sr.department as sales_rep_department
        FROM meeting_requests mr
        JOIN events e ON mr.event_id = e.id
        JOIN sales_reps sr ON mr.sales_rep_id = sr.id
        ORDER BY mr.created_at DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ Error fetching meeting requests:', err);
            return res.status(500).json({
                success: false,
                error: 'Database error'
            });
        }
        
        console.log(`✅ Found ${rows.length} meeting requests`);
        res.json({
            success: true,
            data: rows
        });
    });
});

// Get meeting request by ID
router.get('/:id', (req, res) => {
    const meetingId = req.params.id;
    console.log(`📋 Fetching meeting request ${meetingId}`);
    
    const query = `
        SELECT 
            mr.*,
            e.name as event_name,
            e.location as event_location,
            e.start_date as event_start_date,
            e.end_date as event_end_date,
            sr.name as sales_rep_name,
            sr.email as sales_rep_email,
            sr.department as sales_rep_department
        FROM meeting_requests mr
        JOIN events e ON mr.event_id = e.id
        JOIN sales_reps sr ON mr.sales_rep_id = sr.id
        WHERE mr.id = ?
    `;
    
    db.get(query, [meetingId], (err, row) => {
        if (err) {
            console.error('❌ Error fetching meeting request:', err);
            return res.status(500).json({
                success: false,
                error: 'Database error'
            });
        }
        
        if (!row) {
            return res.status(404).json({
                success: false,
                error: 'Meeting request not found'
            });
        }
        
        console.log(`✅ Found meeting request ${meetingId}`);
        res.json({
            success: true,
            data: row
        });
    });
});

// Update meeting request status (admin)
router.put('/:id/status', (req, res) => {
    const meetingId = req.params.id;
    const { status, adminNotes } = req.body;
    
    console.log(`📝 Updating meeting request ${meetingId} status to: ${status}`);
    
    if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid status. Must be: pending, approved, rejected, or completed'
        });
    }
    
    const query = `
        UPDATE meeting_requests 
        SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `;
    
    const stmt = db.prepare(query);
    stmt.run([status, adminNotes || null, meetingId], function(err) {
        if (err) {
            console.error('❌ Error updating meeting request:', err);
            return res.status(500).json({
                success: false,
                error: 'Database error'
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Meeting request not found'
            });
        }
        
        console.log(`✅ Meeting request ${meetingId} status updated to: ${status}`);
        
        // Get updated meeting data
        const selectQuery = `
            SELECT 
                mr.*,
                e.name as event_name,
                e.location as event_location,
                sr.name as sales_rep_name,
                sr.email as sales_rep_email
            FROM meeting_requests mr
            JOIN events e ON mr.event_id = e.id
            JOIN sales_reps sr ON mr.sales_rep_id = sr.id
            WHERE mr.id = ?
        `;
        
        db.get(selectQuery, [meetingId], async (err, updatedMeeting) => {
            if (err) {
                console.error('❌ Error fetching updated meeting:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Status updated but failed to retrieve data'
                });
            }
            
            // Send status update email if status changed to approved, rejected, or completed
            let emailResult = { success: false };
            if (['approved', 'rejected', 'completed'].includes(status)) {
                try {
                    emailResult = await outlookService.sendMeetingRequestEmail({
                        meeting: updatedMeeting,
                        event: {
                            name: updatedMeeting.event_name,
                            location: updatedMeeting.event_location,
                            start_date: updatedMeeting.event_start_date,
                            end_date: updatedMeeting.event_end_date
                        },
                        salesRep: {
                            name: updatedMeeting.sales_rep_name,
                            email: updatedMeeting.sales_rep_email,
                            department: updatedMeeting.sales_rep_department
                        },
                        status: status
                    });
                    
                    console.log(`📧 Status update email result:`, emailResult);
                    
                    // Create calendar event if approved
                    if (status === 'approved') {
                        try {
                            const calendarResult = await outlookService.createCalendarEvent({
                                meeting: updatedMeeting,
                                event: {
                                    name: updatedMeeting.event_name,
                                    location: updatedMeeting.event_location,
                                    start_date: updatedMeeting.event_start_date,
                                    end_date: updatedMeeting.event_end_date
                                },
                                salesRep: {
                                    name: updatedMeeting.sales_rep_name,
                                    email: updatedMeeting.sales_rep_email,
                                    department: updatedMeeting.sales_rep_department
                                }
                            });
                            
                            console.log(`📅 Calendar event result:`, calendarResult);
                        } catch (calendarError) {
                            console.error('❌ Calendar event creation failed:', calendarError);
                        }
                    }
                    
                } catch (emailError) {
                    console.error('❌ Error sending status update email:', emailError);
                }
            }
            
            res.json({
                success: true,
                message: `Meeting request ${status} successfully`,
                data: updatedMeeting,
                emailSent: emailResult.success,
                emailProvider: emailResult.provider
            });
        });
    });
    stmt.finalize();
});

// Get meeting requests with filters and pagination
router.get('/search', (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        status = '', 
        eventId = '', 
        salesRepId = '',
        search = ''
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
        SELECT 
            mr.*,
            e.name as event_name,
            e.location as event_location,
            sr.name as sales_rep_name,
            sr.email as sales_rep_email,
            sr.department as sales_rep_department
        FROM meeting_requests mr
        JOIN events e ON mr.event_id = e.id
        JOIN sales_reps sr ON mr.sales_rep_id = sr.id
        WHERE 1=1
    `;
    
    let params = [];
    
    if (status) {
        query += ` AND mr.status = ?`;
        params.push(status);
    }
    
    if (eventId) {
        query += ` AND mr.event_id = ?`;
        params.push(eventId);
    }
    
    if (salesRepId) {
        query += ` AND mr.sales_rep_id = ?`;
        params.push(salesRepId);
    }
    
    if (search) {
        query += ` AND (mr.client_name LIKE ? OR mr.client_email LIKE ? OR mr.client_company LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY mr.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('❌ Error searching meeting requests:', err);
            return res.status(500).json({
                success: false,
                error: 'Database error'
            });
        }
        
        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM meeting_requests mr
            JOIN events e ON mr.event_id = e.id
            JOIN sales_reps sr ON mr.sales_rep_id = sr.id
            WHERE 1=1
        `;
        
        let countParams = [];
        
        if (status) {
            countQuery += ` AND mr.status = ?`;
            countParams.push(status);
        }
        
        if (eventId) {
            countQuery += ` AND mr.event_id = ?`;
            countParams.push(eventId);
        }
        
        if (salesRepId) {
            countQuery += ` AND mr.sales_rep_id = ?`;
            countParams.push(salesRepId);
        }
        
        if (search) {
            countQuery += ` AND (mr.client_name LIKE ? OR mr.client_email LIKE ? OR mr.client_company LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        db.get(countQuery, countParams, (err, countResult) => {
            if (err) {
                console.error('❌ Error counting meeting requests:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Database error'
                });
            }
            
            const totalPages = Math.ceil(countResult.total / limit);
            
            res.json({
                success: true,
                data: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: countResult.total,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            });
        });
    });
});

// Test email configuration endpoint
router.get('/test/email-config', async (req, res) => {
    try {
        const testResults = await outlookService.testConfiguration();
        
        res.json({
            success: true,
            configuration: testResults,
            recommendations: {
                microsoftGraph: testResults.microsoftGraph.configured ? 
                    (testResults.microsoftGraph.working ? 'Working correctly' : 'Configuration issue - check credentials') :
                    'Not configured - set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID',
                smtp: testResults.smtp.configured ?
                    (testResults.smtp.working ? 'Working correctly' : 'Configuration issue - check SMTP settings') :
                    'Not configured - set SMTP_HOST, SMTP_USER, SMTP_PASS'
            }
        });
        
    } catch (error) {
        console.error('❌ Error testing email configuration:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to test email configuration',
            message: error.message
        });
    }
});

module.exports = router;
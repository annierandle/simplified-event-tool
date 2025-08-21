const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Get all events (active and past)
router.get('/', (req, res) => {
    console.log('📅 Fetching all events');
    
    const query = `
        SELECT 
            e.*,
            COUNT(esr.sales_rep_id) as sales_rep_count
        FROM events e
        LEFT JOIN event_sales_reps esr ON e.id = esr.event_id
        GROUP BY e.id
        ORDER BY e.start_date ASC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ Error fetching events:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error' 
            });
        }
        
        console.log(`✅ Found ${rows.length} events`);
        res.json({
            success: true,
            data: rows
        });
    });
});

// Get single event with sales reps
router.get('/:id', (req, res) => {
    const eventId = req.params.id;
    console.log(`📅 Fetching event ${eventId} with sales reps`);
    
    const eventQuery = 'SELECT * FROM events WHERE id = ?';
    
    db.get(eventQuery, [eventId], (err, event) => {
        if (err) {
            console.error('❌ Error fetching event:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error' 
            });
        }
        
        if (!event) {
            return res.status(404).json({ 
                success: false, 
                error: 'Event not found' 
            });
        }
        
        // Get associated sales reps
        const salesRepsQuery = `
            SELECT sr.*
            FROM sales_reps sr
            INNER JOIN event_sales_reps esr ON sr.id = esr.sales_rep_id
            WHERE esr.event_id = ? AND sr.availability_status = 'available'
            ORDER BY sr.name ASC
        `;
        
        db.all(salesRepsQuery, [eventId], (err, salesReps) => {
            if (err) {
                console.error('❌ Error fetching sales reps:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Database error' 
                });
            }
            
            console.log(`✅ Found event with ${salesReps.length} sales reps`);
            res.json({
                success: true,
                data: {
                    ...event,
                    salesReps
                }
            });
        });
    });
});

// Get events with pagination and search
router.get('/search', (req, res) => {
    const { page = 1, limit = 10, search = '', status = 'active' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
        SELECT 
            e.*,
            COUNT(esr.sales_rep_id) as sales_rep_count
        FROM events e
        LEFT JOIN event_sales_reps esr ON e.id = esr.event_id
        WHERE e.status = ?
    `;
    
    let params = [status];
    
    if (search) {
        query += ` AND (e.name LIKE ? OR e.description LIKE ? OR e.location LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    query += ` GROUP BY e.id ORDER BY e.start_date ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('❌ Error searching events:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error' 
            });
        }
        
        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM events WHERE status = ?';
        let countParams = [status];
        
        if (search) {
            countQuery += ` AND (name LIKE ? OR description LIKE ? OR location LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        db.get(countQuery, countParams, (err, countResult) => {
            if (err) {
                console.error('❌ Error counting events:', err);
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

module.exports = router;
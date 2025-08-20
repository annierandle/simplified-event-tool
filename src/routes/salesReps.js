const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Get all available sales reps
router.get('/', (req, res) => {
    console.log('👥 Fetching all sales reps');
    
    const query = `
        SELECT 
            sr.*,
            COUNT(esr.event_id) as event_count
        FROM sales_reps sr
        LEFT JOIN event_sales_reps esr ON sr.id = esr.sales_rep_id
        WHERE sr.availability_status = 'available'
        GROUP BY sr.id
        ORDER BY sr.name ASC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ Error fetching sales reps:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error' 
            });
        }
        
        console.log(`✅ Found ${rows.length} sales reps`);
        res.json({
            success: true,
            data: rows
        });
    });
});

// Get single sales rep with events
router.get('/:id', (req, res) => {
    const salesRepId = req.params.id;
    console.log(`👥 Fetching sales rep ${salesRepId} with events`);
    
    const salesRepQuery = 'SELECT * FROM sales_reps WHERE id = ? AND availability_status = "available"';
    
    db.get(salesRepQuery, [salesRepId], (err, salesRep) => {
        if (err) {
            console.error('❌ Error fetching sales rep:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error' 
            });
        }
        
        if (!salesRep) {
            return res.status(404).json({ 
                success: false, 
                error: 'Sales representative not found' 
            });
        }
        
        // Get associated events
        const eventsQuery = `
            SELECT e.*
            FROM events e
            INNER JOIN event_sales_reps esr ON e.id = esr.event_id
            WHERE esr.sales_rep_id = ? AND e.status = 'active'
            ORDER BY e.start_date ASC
        `;
        
        db.all(eventsQuery, [salesRepId], (err, events) => {
            if (err) {
                console.error('❌ Error fetching events:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Database error' 
                });
            }
            
            console.log(`✅ Found sales rep with ${events.length} events`);
            res.json({
                success: true,
                data: {
                    ...salesRep,
                    events
                }
            });
        });
    });
});

// Get sales reps for specific event
router.get('/event/:eventId', (req, res) => {
    const eventId = req.params.eventId;
    console.log(`👥 Fetching sales reps for event ${eventId}`);
    
    const query = `
        SELECT sr.*
        FROM sales_reps sr
        INNER JOIN event_sales_reps esr ON sr.id = esr.sales_rep_id
        WHERE esr.event_id = ? AND sr.availability_status = 'available'
        ORDER BY sr.name ASC
    `;
    
    db.all(query, [eventId], (err, rows) => {
        if (err) {
            console.error('❌ Error fetching sales reps for event:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error' 
            });
        }
        
        console.log(`✅ Found ${rows.length} sales reps for event ${eventId}`);
        res.json({
            success: true,
            data: rows
        });
    });
});

// Search sales reps with pagination
router.get('/search', (req, res) => {
    const { page = 1, limit = 10, search = '', department = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
        SELECT 
            sr.*,
            COUNT(esr.event_id) as event_count
        FROM sales_reps sr
        LEFT JOIN event_sales_reps esr ON sr.id = esr.sales_rep_id
        WHERE sr.availability_status = 'available'
    `;
    
    let params = [];
    
    if (search) {
        query += ` AND (sr.name LIKE ? OR sr.email LIKE ? OR sr.bio LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (department) {
        query += ` AND sr.department = ?`;
        params.push(department);
    }
    
    query += ` GROUP BY sr.id ORDER BY sr.name ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('❌ Error searching sales reps:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error' 
            });
        }
        
        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM sales_reps WHERE availability_status = "available"';
        let countParams = [];
        
        if (search) {
            countQuery += ` AND (name LIKE ? OR email LIKE ? OR bio LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        if (department) {
            countQuery += ` AND department = ?`;
            countParams.push(department);
        }
        
        db.get(countQuery, countParams, (err, countResult) => {
            if (err) {
                console.error('❌ Error counting sales reps:', err);
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

// Get departments list
router.get('/departments/list', (req, res) => {
    console.log('🏢 Fetching departments list');
    
    const query = `
        SELECT DISTINCT department 
        FROM sales_reps 
        WHERE availability_status = 'available' AND department IS NOT NULL
        ORDER BY department ASC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ Error fetching departments:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Database error' 
            });
        }
        
        const departments = rows.map(row => row.department);
        console.log(`✅ Found ${departments.length} departments`);
        
        res.json({
            success: true,
            data: departments
        });
    });
});

module.exports = router;
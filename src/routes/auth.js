const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Login endpoint
router.post('/login', async (req, res) => {
    console.log('🔐 Login attempt:', { email: req.body.email, hasPassword: !!req.body.password });
    
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.log('❌ Missing credentials');
            return res.status(400).json({ 
                success: false, 
                error: 'Email and password are required' 
            });
        }
        
        // Find user in database
        const query = 'SELECT * FROM users WHERE email = ? LIMIT 1';
        
        db.get(query, [email], async (err, user) => {
            if (err) {
                console.error('❌ Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Database error' 
                });
            }
            
            if (!user) {
                console.log('❌ User not found:', email);
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid credentials' 
                });
            }
            
            console.log('✅ User found:', { id: user.id, email: user.email, role: user.role });
            
            try {
                // Verify password
                const isValidPassword = await bcrypt.compare(password, user.password);
                
                if (!isValidPassword) {
                    console.log('❌ Invalid password for:', email);
                    return res.status(401).json({ 
                        success: false, 
                        error: 'Invalid credentials' 
                    });
                }
                
                console.log('✅ Password verified for:', email);
                
                // Generate JWT token
                const token = jwt.sign(
                    { 
                        userId: user.id, 
                        email: user.email, 
                        role: user.role 
                    },
                    JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
                );
                
                console.log('✅ JWT token generated for:', email);
                
                // Return success response
                res.json({
                    success: true,
                    message: 'Login successful',
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role
                    }
                });
                
            } catch (bcryptError) {
                console.error('❌ Password comparison error:', bcryptError);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Authentication error' 
                });
            }
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Verify token endpoint
router.get('/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'No token provided' 
            });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get fresh user data
        const query = 'SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1';
        
        db.get(query, [decoded.userId], (err, user) => {
            if (err || !user) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid token' 
                });
            }
            
            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Token verification error:', error);
        res.status(401).json({ 
            success: false, 
            error: 'Invalid token' 
        });
    }
});

// Dashboard data endpoint
router.get('/dashboard', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                error: 'No token provided' 
            });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get dashboard statistics
        const queries = {
            totalEvents: 'SELECT COUNT(*) as count FROM events WHERE status = "active"',
            totalSalesReps: 'SELECT COUNT(*) as count FROM sales_reps WHERE availability_status = "available"',
            pendingMeetings: 'SELECT COUNT(*) as count FROM meeting_requests WHERE status = "pending"',
            totalMeetings: 'SELECT COUNT(*) as count FROM meeting_requests'
        };
        
        const results = {};
        let completed = 0;
        const totalQueries = Object.keys(queries).length;
        
        Object.entries(queries).forEach(([key, query]) => {
            db.get(query, [], (err, row) => {
                if (err) {
                    console.error(`❌ Error getting ${key}:`, err);
                    results[key] = 0;
                } else {
                    results[key] = row.count;
                }
                
                completed++;
                if (completed === totalQueries) {
                    res.json({
                        success: true,
                        data: results
                    });
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Dashboard error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

module.exports = router;
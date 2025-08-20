const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, '..', 'database.sqlite');

console.log('🔧 Initializing database...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
});

// Create tables
const createTables = () => {
    return new Promise((resolve, reject) => {
        const queries = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Events table
            `CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                location TEXT,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Sales representatives table
            `CREATE TABLE IF NOT EXISTS sales_reps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                department TEXT,
                bio TEXT,
                availability_status TEXT DEFAULT 'available',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Event-SalesRep association table
            `CREATE TABLE IF NOT EXISTS event_sales_reps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                sales_rep_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
                FOREIGN KEY (sales_rep_id) REFERENCES sales_reps (id) ON DELETE CASCADE,
                UNIQUE(event_id, sales_rep_id)
            )`,
            
            // Meeting requests table
            `CREATE TABLE IF NOT EXISTS meeting_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                sales_rep_id INTEGER NOT NULL,
                client_name TEXT NOT NULL,
                client_email TEXT NOT NULL,
                client_company TEXT,
                client_phone TEXT,
                preferred_date DATE,
                preferred_time TEXT,
                duration INTEGER DEFAULT 30,
                message TEXT,
                status TEXT DEFAULT 'pending',
                admin_notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
                FOREIGN KEY (sales_rep_id) REFERENCES sales_reps (id) ON DELETE CASCADE
            )`
        ];

        let completed = 0;
        queries.forEach((query, index) => {
            db.run(query, (err) => {
                if (err) {
                    console.error(`❌ Error creating table ${index + 1}:`, err.message);
                    reject(err);
                    return;
                }
                completed++;
                if (completed === queries.length) {
                    console.log('✅ All tables created successfully');
                    resolve();
                }
            });
        });
    });
};

// Insert sample data
const insertSampleData = async () => {
    console.log('📝 Inserting sample data...');
    
    try {
        // Hash admin password
        const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
        
        // Insert admin user
        await new Promise((resolve, reject) => {
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO users (email, password, role, name) 
                VALUES (?, ?, ?, ?)
            `);
            stmt.run([
                process.env.ADMIN_EMAIL || 'admin@company.com',
                adminPassword,
                'admin',
                'System Administrator'
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Admin user created');
                    resolve();
                }
            });
            stmt.finalize();
        });
        
        // Insert sample events
        const events = [
            {
                name: 'Tech Innovation Summit 2024',
                description: 'Annual technology and innovation conference featuring the latest in AI, blockchain, and IoT.',
                start_date: '2024-09-15',
                end_date: '2024-09-17',
                location: 'San Francisco Convention Center',
                status: 'active'
            },
            {
                name: 'Digital Marketing Expo',
                description: 'Premier event for digital marketing professionals and business leaders.',
                start_date: '2024-10-20',
                end_date: '2024-10-22',
                location: 'New York Jacob K. Javits Convention Center',
                status: 'active'
            },
            {
                name: 'Global Finance Conference',
                description: 'International conference on finance, investment, and economic trends.',
                start_date: '2024-11-10',
                end_date: '2024-11-12',
                location: 'Chicago McCormick Place',
                status: 'active'
            }
        ];
        
        for (const event of events) {
            await new Promise((resolve, reject) => {
                const stmt = db.prepare(`
                    INSERT OR REPLACE INTO events (name, description, start_date, end_date, location, status) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                stmt.run([
                    event.name,
                    event.description,
                    event.start_date,
                    event.end_date,
                    event.location,
                    event.status
                ], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                stmt.finalize();
            });
        }
        console.log('✅ Sample events created');
        
        // Insert sample sales reps
        const salesReps = [
            {
                name: 'Sarah Johnson',
                email: 'sarah.johnson@company.com',
                phone: '+1-555-0101',
                department: 'Enterprise Solutions',
                bio: 'Senior sales executive with 8+ years experience in enterprise software solutions.',
                availability_status: 'available'
            },
            {
                name: 'Michael Chen',
                email: 'michael.chen@company.com',
                phone: '+1-555-0102',
                department: 'Technology Sales',
                bio: 'Technology sales specialist focusing on AI and machine learning solutions.',
                availability_status: 'available'
            },
            {
                name: 'Emily Rodriguez',
                email: 'emily.rodriguez@company.com',
                phone: '+1-555-0103',
                department: 'Digital Marketing',
                bio: 'Digital marketing solutions expert with proven track record in lead generation.',
                availability_status: 'available'
            },
            {
                name: 'David Thompson',
                email: 'david.thompson@company.com',
                phone: '+1-555-0104',
                department: 'Financial Services',
                bio: 'Financial technology sales director specializing in fintech and blockchain solutions.',
                availability_status: 'available'
            }
        ];
        
        for (const rep of salesReps) {
            await new Promise((resolve, reject) => {
                const stmt = db.prepare(`
                    INSERT OR REPLACE INTO sales_reps (name, email, phone, department, bio, availability_status) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                stmt.run([
                    rep.name,
                    rep.email,
                    rep.phone,
                    rep.department,
                    rep.bio,
                    rep.availability_status
                ], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                stmt.finalize();
            });
        }
        console.log('✅ Sample sales reps created');
        
        // Associate sales reps with events
        const associations = [
            { event_id: 1, sales_rep_id: 1 },
            { event_id: 1, sales_rep_id: 2 },
            { event_id: 2, sales_rep_id: 1 },
            { event_id: 2, sales_rep_id: 3 },
            { event_id: 3, sales_rep_id: 1 },
            { event_id: 3, sales_rep_id: 4 }
        ];
        
        for (const assoc of associations) {
            await new Promise((resolve, reject) => {
                const stmt = db.prepare(`
                    INSERT OR REPLACE INTO event_sales_reps (event_id, sales_rep_id) 
                    VALUES (?, ?)
                `);
                stmt.run([assoc.event_id, assoc.sales_rep_id], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
                stmt.finalize();
            });
        }
        console.log('✅ Event-SalesRep associations created');
        
        console.log('🎉 Sample data insertion completed!');
        
    } catch (error) {
        console.error('❌ Error inserting sample data:', error);
        throw error;
    }
};

// Main initialization
const initialize = async () => {
    try {
        await createTables();
        await insertSampleData();
        
        console.log('\n🎉 Database initialization completed successfully!');
        console.log('\n📋 Admin Credentials:');
        console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@company.com'}`);
        console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
        console.log('\n🔗 Access URLs:');
        console.log(`   Main Site: http://localhost:${process.env.PORT || 3000}`);
        console.log(`   Admin Panel: http://localhost:${process.env.PORT || 3000}/admin`);
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            } else {
                console.log('✅ Database connection closed');
            }
            process.exit(0);
        });
    }
};

// Run initialization
initialize();
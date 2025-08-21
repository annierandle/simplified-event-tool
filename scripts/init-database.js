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
        
        // Insert real events
        const events = [
            {
                name: 'GBTA Convention 2024',
                description: 'The Global Business Travel Association\'s premier annual convention bringing together travel management professionals, suppliers, and industry leaders to explore trends, innovations, and best practices in corporate travel. This event has concluded.',
                start_date: '2024-07-28',
                end_date: '2024-08-01',
                location: 'San Diego Convention Center, San Diego, CA',
                status: 'past'
            },
            {
                name: 'Commercial Payments International Global Summit 2025',
                description: 'Leading international conference focused on commercial payments innovation, digital transformation, and emerging payment technologies. Bringing together payment processors, financial institutions, and technology providers for 2025.',
                start_date: '2025-09-17',
                end_date: '2025-09-18',
                location: 'The Brewery, London, UK',
                status: 'active'
            },
            {
                name: 'NACHA Payments Conference 2025',
                description: 'The Electronic Payments Association\'s flagship event covering ACH payments, faster payments, digital wallets, and payment security. Essential for payment professionals and financial institutions in 2025.',
                start_date: '2025-05-05',
                end_date: '2025-05-07',
                location: 'Gaylord Opryland Resort, Nashville, TN',
                status: 'active'
            },
            {
                name: 'Sibos 2025',
                description: 'Swift\'s premier annual financial services event bringing together banks, financial institutions, corporates, and technology providers to discuss the future of financial messaging, payments, and market infrastructure in 2025.',
                start_date: '2025-10-13',
                end_date: '2025-10-16',
                location: 'Beijing, China',
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
        
        // Insert sales representatives
        const salesReps = [
            {
                name: 'Sarah Johnson',
                email: 'sarah.johnson@orchestrate.com',
                phone: '+1-555-0101',
                department: 'Travel & Expense Solutions',
                bio: 'Senior sales executive specializing in corporate travel management platforms and expense automation solutions for enterprise clients.',
                availability_status: 'available'
            },
            {
                name: 'Michael Chen',
                email: 'michael.chen@orchestrate.com',
                phone: '+1-555-0102',
                department: 'Payment Solutions',
                bio: 'Payments technology specialist with expertise in digital payment processing, ACH systems, and financial messaging infrastructure.',
                availability_status: 'available'
            },
            {
                name: 'Emily Rodriguez',
                email: 'emily.rodriguez@orchestrate.com',
                phone: '+1-555-0103',
                department: 'Financial Technology',
                bio: 'Fintech solutions expert focusing on banking infrastructure, regulatory compliance, and cross-border payment systems.',
                availability_status: 'available'
            },
            {
                name: 'David Thompson',
                email: 'david.thompson@orchestrate.com',
                phone: '+1-555-0104',
                department: 'Enterprise Integration',
                bio: 'Enterprise integration director specializing in API solutions, system connectivity, and digital transformation for financial institutions.',
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
            // GBTA Convention 2024 - Travel & Expense + Payment Solutions
            { event_id: 1, sales_rep_id: 1 }, // Sarah Johnson (Travel & Expense Solutions)
            { event_id: 1, sales_rep_id: 2 }, // Michael Chen (Payment Solutions)
            
            // Commercial Payments International Global Summit - Payment Solutions + Financial Technology
            { event_id: 2, sales_rep_id: 2 }, // Michael Chen (Payment Solutions)
            { event_id: 2, sales_rep_id: 3 }, // Emily Rodriguez (Financial Technology)
            
            // NACHA Payments Conference - Payment Solutions + Enterprise Integration
            { event_id: 3, sales_rep_id: 2 }, // Michael Chen (Payment Solutions)
            { event_id: 3, sales_rep_id: 4 }, // David Thompson (Enterprise Integration)
            
            // Sibos 2024 - Financial Technology + Enterprise Integration
            { event_id: 4, sales_rep_id: 3 }, // Emily Rodriguez (Financial Technology)
            { event_id: 4, sales_rep_id: 4 }  // David Thompson (Enterprise Integration)
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
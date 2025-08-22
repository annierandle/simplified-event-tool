const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking database schema...');

// Check if users table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", [], (err, row) => {
    if (err) {
        console.error('❌ Error checking users table:', err);
    } else if (row) {
        console.log('✅ Users table exists');
        
        // Check users in table
        db.all('SELECT id, email, name, role FROM users', [], (err, rows) => {
            if (err) {
                console.error('❌ Error fetching users:', err);
            } else {
                console.log(`📊 Found ${rows.length} users:`);
                rows.forEach(user => {
                    console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
                });
            }
            db.close();
        });
    } else {
        console.log('❌ Users table does not exist');
        
        // List all tables
        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
            if (err) {
                console.error('❌ Error listing tables:', err);
            } else {
                console.log('📋 Existing tables:');
                tables.forEach(table => {
                    console.log(`  - ${table.name}`);
                });
            }
            db.close();
        });
    }
});
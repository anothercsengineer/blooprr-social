const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// file creation
const dbPath = path.resolve(__dirname, 'blooprr.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database!');
    }
});

// initialize tables
db.serialize(() => {
    // 1. users table
    db.run(`
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_hash TEXT UNIQUE NOT NULL,
            bio TEXT DEFAULT '',
            profile_pic_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 2. bloops table
    db.run(`
        CREATE TABLE IF NOT EXISTS bloops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id INTEGER NOT NULL,
            content_type TEXT NOT NULL, -- 'image', 'video', or 'text'
            content_url TEXT,
            text_content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- life_extension_hours tracks time added via likes/replies
            life_extension_hours INTEGER DEFAULT 0,
            is_saved_to_wall BOOLEAN DEFAULT 0,
            FOREIGN KEY(profile_id) REFERENCES profiles(id)
        )
    `);

    // 2.5 contact edges
    db.run(`
        CREATE TABLE IF NOT EXISTS edges (
            owner_id INTEGER NOT NULL,
            contact_phone_hash TEXT NOT NULL,
            PRIMARY KEY (owner_id, contact_phone_hash),
            FOREIGN KEY(owner_id) REFERENCES profiles(id)
        )
    `);

    // 3. connections table
    db.run(`
        CREATE TABLE IF NOT EXISTS connections (
            profile_id_1 INTEGER NOT NULL,
            profile_id_2 INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (profile_id_1, profile_id_2),
            FOREIGN KEY(profile_id_1) REFERENCES profiles(id),
            FOREIGN KEY(profile_id_2) REFERENCES profiles(id)
        )
    `);

    // 4. engagments table
    db.run(`
        CREATE TABLE IF NOT EXISTS engagements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bloop_id INTEGER NOT NULL,
            profile_id INTEGER NOT NULL,
            type TEXT NOT NULL, -- 'like' or 'reply'
            reply_text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(bloop_id) REFERENCES bloops(id),
            FOREIGN KEY(profile_id) REFERENCES profiles(id)
        )
    `);

    console.log('Database tables initialized!');
});

module.exports = db;
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
    // configuration for performance & constraints
    db.run('PRAGMA busy_timeout = 5000;');
    db.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) console.error('Error enabling foreign keys:', err.message);
    });

    db.run('PRAGMA journal_mode = WAL;', (err) => {
        if (err) console.error('Error enabling WAL mode:', err.message);
    });

    db.run('PRAGMA synchronous = NORMAL;');

    // 1. users table
    db.run(`
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_hash TEXT UNIQUE NOT NULL,
            passcode_hash TEXT NOT NULL,
            failed_attempts INTEGER DEFAULT 0,
            locked_until DATETIME NULL,
            passcode_type TEXT NOT NULL,
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
            FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
        )
    `);

    // 2.5 contact mutuals
    db.run(`
        CREATE TABLE IF NOT EXISTS mutuals (
            owner_id INTEGER NOT NULL,
            contact_phone_hash TEXT NOT NULL,
            PRIMARY KEY (owner_id, contact_phone_hash),
            FOREIGN KEY(owner_id) REFERENCES profiles(id) ON DELETE CASCADE
        )
    `);

    // 3. connections table
    db.run(`
        CREATE TABLE IF NOT EXISTS connections (
            profile_id_1 INTEGER NOT NULL,
            profile_id_2 INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (profile_id_1, profile_id_2),
            FOREIGN KEY(profile_id_1) REFERENCES profiles(id) ON DELETE CASCADE,
            FOREIGN KEY(profile_id_2) REFERENCES profiles(id) ON DELETE CASCADE
        )
    `);

    // 4. engagements table
    db.run(`
        CREATE TABLE IF NOT EXISTS engagements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bloop_id INTEGER NOT NULL,
            profile_id INTEGER NOT NULL,
            type TEXT NOT NULL, -- 'like' or 'reply'
            chats_text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(bloop_id) REFERENCES bloops(id) ON DELETE CASCADE,
            FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
        )
    `);

    // 5. invite codes table
    db.run(`
        CREATE TABLE IF NOT EXISTS blipkeys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            bearer INTEGER, -- profile_id of the user who received the blip key (NULL for Genesis keys)
            redeemer_hash TEXT, -- phone hash of the person claiming it (NULL until claimed)
            status BOOLEAN DEFAULT 0, -- flips to 1 when the blipkey is redeemed during registration
            expiry DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(bearer) REFERENCES profiles(id) ON DELETE CASCADE,
            FOREIGN KEY(redeemer_hash) REFERENCES profiles(phone_hash) ON DELETE SET NULL
        )
    `);

    // indexes for fast querying
    db.run(`CREATE INDEX IF NOT EXISTS idx_bloops_profile_id ON bloops(profile_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_mutuals_contact_hash ON mutuals(contact_phone_hash)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_engagements_bloop_id ON engagements(bloop_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_blipkeys_redeemer ON blipkeys(redeemer_hash)`);
    db.run("CREATE INDEX IF NOT EXISTS idx_blipkeys_bearer ON blipkeys(bearer);");

    console.log('Database tables initialized!');
});

module.exports = db;
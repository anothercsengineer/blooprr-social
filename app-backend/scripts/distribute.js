const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const dbPath = path.resolve(__dirname, '../blooprr.db');
const db = new sqlite3.Database(dbPath);

// generates a random 3-letter string
const randomSegment = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 3; i++) {
        result += chars.charAt(crypto.randomInt(0, chars.length));
    }
    return result;
};

const generateBlipkey = () => `blp-${randomSegment()}-${randomSegment()}`;

// 1. calculate 11:59:59 PM for the day
const today = new Date();
today.setUTCHours(23, 59, 59, 999);
const expiryIso = today.toISOString();

console.log(`\n[CRON] Starting daily Blipkey distribution...`);
console.log(`[CRON] Keys will expire at: ${expiryIso}\n`);

// 2. shortlist 10 random users for distribution (age cannot be less than 24 hours)
const query = `
    SELECT id
    FROM profiles
    WHERE created_at <= datetime('now', '-1 day')
    ORDER BY RANDOM()
    LIMIT 10
`;

db.all(query, [], (err, eligibleUsers) => {
    if (err) {
        console.error('Failed to fetch eligible users:', err);
        return db.close();
    }

    if (eligibleUsers.length === 0) {
        console.log('No eligible users found for distribution today.');
        return db.close();
    }
    
    console.log(`Found ${eligibleUsers.length} eligible users. Distributing keys...`);

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const insertKey = db.prepare(`
            INSERT INTO blipkeys (key, bearer, expiry)
            VALUES (?, ?, ?)
        `);

        eligibleUsers.forEach(user => {
            const key = generateBlipkey();
            insertKey.run(key, user.id, expiryIso);

            // TODO: integrate FCM here in future
            console.log(`📲[PUSH NOTIFICATION SENT] User ${user.id} received Blipkey: ${key}`);
        });

        insertKey.finalize();
        db.run('COMMIT', (commitErr) => {
            if (commitErr) {
                console.error('Transaction Failed:', commitErr.message);
            } else {
                console.log('\n✅ Daily distribution complete! All keys saved to database.');
            }
            db.close();
        });
    });
});
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

// generates the blip key format
const generateBlipkey = () => {
    return`blp-${randomSegment()}-${randomSegment()}`;
}

// expiry in 7 days
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 7);
const expiryIso = expiryDate.toISOString();

console.log('Minting 10 Genesis Blipkeys...\n');

db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const insertKey = db.prepare(`
        INSERT INTO blipkeys (key, bearer, expiry)
        VALUES (?, NULL, ?)
    `);

    for (let i = 0; i < 10; i++) {
        const key = generateBlipkey();
        insertKey.run(key, expiryIso);
        console.log(`🔑 ${key}`);
    }

    insertKey.finalize();
    db.run('COMMIT', (err) => {
        if (err) {
            console.error('Failed to mint keys:', err.message);
        } else {
            console.log('\n✅ Successfully minted and saved to database! Give these to your beta testers.');
        }
        db.close();
    });
});
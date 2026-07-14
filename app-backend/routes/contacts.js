const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const authenticateToken = require('../middleware/jwt');

// sync contacts endpoint
router.post('/sync', authenticateToken, (req, res) => {
    const { contactHashes } = req.body;
    const profileId = req.user.id;
    const pepper = process.env.PHONE_PEPPER;

    // clean integer validation
    const parsedProfileId = parseInt(profileId, 10);
    if (!parsedProfileId || isNaN(parsedProfileId) || !Array.isArray(contactHashes)) {
        return res.status(400).json({ error: 'Valid profileId and contactHashes array are required' });
    }

    // payload size validation
    if (contactHashes.length > 500) {
        return res.status(413).json({ error: 'Payload too large. Maximum 500 contacts allowed per sync.' });
    }

    // SQL syntax crash prevention if 0 contacts are uploaded
    if (contactHashes.length === 0) {
        return res.json({ 
            message: 'No contacts provided to sync.',
            mutualConnectionsFound: 0,
            connectedProfileIds: []
        });
    }

    // strict hex-string validation
    const isValidHash = (str) => typeof str === 'string' && /^[a-f0-9]{64}$/.test(str);
    if (!contactHashes.every(isValidHash)) {
        return res.status(400).json({ error: 'Invalid payload: All contact hashes must be valid SHA256 hex strings.' });
    }

    // double-hash application
    const secureContactHashes = contactHashes.map(clientHash =>
        crypto.createHash('sha256').update(clientHash + pepper).digest('hex')
    );

    // 1. saving all the contacts user has uploaded (synced with the app)
    const insertEdge = db.prepare('INSERT OR IGNORE INTO mutuals (owner_id, contact_phone_hash) VALUES (?, ?)');

    // wrapped in transaction for performance boost
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        secureContactHashes.forEach(hash => {
            insertEdge.run(parsedProfileId, hash);
        });
        insertEdge.finalize();
        db.run('COMMIT');
    });

    // 2. finding mutual connections
    db.get('SELECT phone_hash FROM profiles WHERE id = ?', [parsedProfileId], (err, user) => {
        if (err || !user) return res.status(500).json({ error: 'Could not fetch user profile' });

        const myPhoneHash = user.phone_hash;

        // finding users who: have an account, are in the contact list uploaded and also have the mutual users phone number
        const placeholders = secureContactHashes.map(() => '?').join(',');
        const query = `
            SELECT profiles.id
            FROM profiles
            JOIN mutuals ON profiles.id = mutuals.owner_id
            WHERE profiles.phone_hash IN (${placeholders})
            AND mutuals.contact_phone_hash = ?
        `;

        // query parameters are all the hash phone numbers the user uploaded and also their own at the end
        const params = [...secureContactHashes, myPhoneHash];
        
        db.all(query, params, (err, mutualProfiles) => {
            if (err) return res.status(500).json({ error: 'Error finding mutuals' });

            const newConnections = [];

            // 3. creating mutual connections in the db
            const insertConnection = db.prepare(`
                INSERT OR IGNORE INTO connections (profile_id_1, profile_id_2)
                VALUES (?, ?)
            `);

            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                mutualProfiles.forEach(mutual => {
                    const id1 = Math.min(parsedProfileId, mutual.id);
                    const id2 = Math.max(parsedProfileId, mutual.id);
                                                                                        
                    insertConnection.run(id1, id2);
                    newConnections.push(mutual.id);
                });
                insertConnection.finalize();

                db.run('COMMIT', (commitErr) => {
                    if (commitErr) return res.status(500).json({ error: 'Failed to save connections!' });

                    res.json({
                        message: 'Contacts synced successfully!',
                        mutualConnectionsFound: newConnections.length,
                        connectedProfileIds: newConnections
                    });
                });
            });
        });
    });
});

module.exports = router;
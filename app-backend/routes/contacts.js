const express = require('express');
const router = express.Router();
const db = require('../db');

// sync contacts endpoint
router.post('/sync', (req, res) => {
    const { profileId, contactHashes } = req.body;

    if (!profileId || !Array.isArray(contactHashes)) {
        return res.status(400).json({ error: 'profileId and contactHashes array are required' });
    }

    // 1. saving all the contacts user has uploaded (synced with the app)
    const insertEdge = db.prepare('INSERT OR IGNORE INTO contact_edges (owner_id, contact_phone_hash) VALUES (?, ?)');
    contactHashes.forEach(hash => {
        insertEdge.run(profileId, hash);
    });
    insertEdge.finalize();

    // 2. finding mutual connections
    db.get('SELECT phone_hash FROM profiles WHERE id = ?', [profileId], (err, user) => {
        if (err || !user) return res.status(500).json({ error: 'Could not fetch user profile' });

        const myPhoneHash = user.phone_hash;

        // finding users who: have an account, are in the contact list uploaded and also have the users phone number in their contact edges
        const placeholders = contactHashes.map(() => '?').join(',');
        const query = `
            SELECT profiles.id
            FROM profiles
            JOIN contact_edges ON profiles.id = contact_edges.owner_id
            WHERE profiles.phone_hash IN (${placeholders})
            AND contact_edges.contact_phone_hash = ?
        `;

        // query parameters are all the hash phone numbers the user uploaded and also their own at the end
        const params = [...contactHashes, myPhoneHash];
        
        db.all(query, params, (err, mutualProfiles) => {
            if (err) return res.status(500).json({ error: 'Error finding mutuals' });

            const newConnections = [];

            // 3. creating mutual connections in the db
            const insertConnection = db.prepare(`]
                INSERT OR IGNORE INTO connections (profile_id_1, profile_id_2)
                VALUES (?, ?)
            `);

            mutualProfiles.forEach(mutual => {
                const id1 = Math.min(profileId, mutual.id);
                const id2 = Math.max(profileId, mutual.id);
                                                                                    
                insertConnection.run(id1, id2);
                newConnections.push(mutual.id);
            });
            insertConnection.finalize();

            res.json({
                message: 'Contacts synced successfully!',
                mutualConnectionsFound: newConnections.length,
                connectedProfileIds: newConnections
            });
        });
    });
});

module.exports = router;
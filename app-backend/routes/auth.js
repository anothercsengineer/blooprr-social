const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken')
const authenticateToken = require('../middleware/jwt');

const applyPepper = (clientHash) => {
    const pepper = process.env.PHONE_PEPPER;
    return crypto.createHash('sha256').update(clientHash + pepper).digest('hex');
}

// 1. login endpoint
router.post('/login', (req, res) => {
    const { phoneHash } = req.body;

    if (!phoneHash || !/^[a-f0-9]{64}$/.test(phoneHash)) return res.status(400).json({ error: 'Phone number is required!' });

    const finalHash = applyPepper(phoneHash);

    // database check
    db.get('SELECT id, bio, profile_pic_url, created_at FROM profiles WHERE phone_hash = ?', [finalHash], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error!' });

        if (user) {
            // user exists - generate token and log in
            const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1y' });
            return res.json({ message: 'Login successful', user, token: jwtToken, isNewUser: false });
        } else {
            // 404 error to redirect non-existing user to blip gate screen
            return res.status(404).json({ error: 'User not found! Please sign up.' });
        }
    });
});

// 2. register endpoint
router.post('/register', (req, res) => {
    const { phoneHash, blipkey } = req.body;

    if (!phoneHash || !/^[a-f0-9]{64}$/.test(phoneHash) || !blipkey || !/^blp-[a-z]{3}-[a-z]{3}$/.test(blipkey)) {
        return res.status(400).json({ error: 'Phone hash and Blipkey required!' });
    }
    
    const finalHash = applyPepper(phoneHash);

    // atomic transaction
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // updating the key first so that it is certain no one else claimed it, also block expired keys
        db.run('UPDATE blipkeys SET status = 1, redeemer_hash = ? WHERE key = ? AND status = 0 AND expiry > datetime(\'now\')',
        [finalHash, blipkey], function(err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Database error' });
            }

            // checking if key entered is fake, already used or expired
            if (this.changes === 0) {
                db.run('ROLLBACK');
                return res.status(400).json({ error: 'Invalid, expired or used Blipkey!' });
            }

            // create new user (if failed, rollback is done to prevent blipkey burning)
            db.run('INSERT INTO profiles (phone_hash) VALUES (?)', [finalHash], function(insertErr) {
                if (insertErr) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Could not create user or user already exists!' });
                }
                
                const newUserId = this.lastID;

                db.run('COMMIT', (commitErr) => {
                    if (commitErr) {
                        db.run('ROLLBACK'); // prevents global deadlock
                        return res.status(500).json({ error: 'Transaction commit failed!' });
                    }
                    // assign jwt and return
                    const newUser = { id: newUserId, bio: '', profile_pic_url: null };
                    const jwtToken = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1y' });

                    return res.json({ 
                        message: 'Sign-up successful!', 
                        user: newUser, 
                        token: jwtToken, 
                        isNewUser: true 
                    });
                });
            });
        });
    });
});

// 3. fetch the active my blipkeys endpoint
router.get('/my-blipkey', authenticateToken, (req, res) => {
    const profileId = req.user.id;

    // selects the keys belonging to the user
    db.get(`
        SELECT key, expiry
        FROM blipkeys
        WHERE bearer = ? AND status = 0 AND redeemer_hash IS NULL AND expiry > dateTime('now')
    `, [profileId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (row) {
            res.json({ hasKey: true, key: row.key, expiry: row.expiry });
        } else {
            res.json({ hasKey: false });
        }
    });
});

module.exports = router;
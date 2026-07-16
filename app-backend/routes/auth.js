const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/jwt');

const applyPepper = (clientHash) => {
    const pepper = process.env.PHONE_PEPPER;
    return crypto.createHash('sha256').update(clientHash + pepper).digest('hex');
}

// 1. check user endpoint
router.post('/check-user', (req, res) => {
    const { phoneHash } = req.body;

    if (!phoneHash || !/^[a-f0-9]{64}$/.test(phoneHash)) return res.status(400).json({ error: 'Phone number is required!' });

    const finalHash = applyPepper(phoneHash);

    // database check
    db.get('SELECT passcode_type FROM profiles WHERE phone_hash = ?', [finalHash], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error!' });

        if (user) {
            return res.json({ exists: true, passType: user.passcode_type });
        } else {
            return res.status(404).json({ exists: false, error: 'User not found! Please sign up.' });
        }
    });
});

// 2. secure login endpoint
router.post('/login', (req, res) => {
    const { phoneHash, pass } = req.body;

    if (!phoneHash || !/^[a-f0-9]{64}$/.test(phoneHash) || !pass) return res.status(400).json({ error: 'Missing credentials!' });

    const finalHash = applyPepper(phoneHash);

    db.get('SELECT id, passcode_hash FROM profiles WHERE phone_hash = ?', [finalHash], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error!' });

        if (user) {
            // user exists - generate token and log in
            const isMatch = await bcrypt.compare(pass, user.passcode_hash);
            if (!isMatch) {
                return res.status(401).json({ error: 'Incorrect passcode!' });
            }

            const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1y' });
            return res.json({ message: 'Login successful', token: jwtToken });
        } else {
            // 404 error to redirect non-existing user to blip gate screen
            return res.status(404).json({ error: 'User not found!' });
        }
    });
});

// 2. register endpoint
router.post('/register', async (req, res) => {
    const { phoneHash, blipkey, pass, passType } = req.body;

    if (!phoneHash || !/^[a-f0-9]{64}$/.test(phoneHash) || !blipkey || !/^blp-[a-z]{3}-[a-z]{3}$/.test(blipkey) || !pass || !passType) {
        return res.status(400).json({ error: 'Missing or invalid fields!' });
    }
    
    const finalHash = applyPepper(phoneHash);

    try {
        // hash the passcode safely using bcrypt before logging in the database
        const salt = await bcrypt.genSalt(10);
        const passHash = await bcrypt.hash(pass, salt);

        // atomic transaction
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // i. create new user first (if failed, rollback is done to prevent blipkey burning)
            db.run('INSERT INTO profiles (phone_hash, passcode_hash, passcode_type) VALUES (?, ?, ?)',
            [finalHash, passHash, passType], function(insertErr) {
                if (insertErr) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Could not create user or user already exists!' });
                }
                
                const newUserId = this.lastID;

                // ii. updating the key so that it is certain no one else claimed it, also block expired keys
                db.run('UPDATE blipkeys SET status = 1, redeemer_hash = ? WHERE key = ? AND status = 0 AND datetime(expiry) > datetime(\'now\')',
                [finalHash, blipkey], function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Database error!' });
                    }

                    // checking if key entered is fake, already used or expired
                    if (this.changes === 0) {
                        db.run('ROLLBACK');
                        return res.status(400).json({ error: 'Invalid, expired or used Blipkey!' });
                    }
                    
                    // iii. commit the transaction permanently to database
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
    } catch (hashError) {
        console.error("Hashing error:", hashError);
        return res.status(500).json({ error: 'Failed to secure passcode!' });
    }
});

// 3. fetch the active my blipkeys endpoint
router.get('/my-blipkey', authenticateToken, (req, res) => {
    const profileId = req.user.id;

    // selects the keys belonging to the user
    db.get(`
        SELECT key, expiry
        FROM blipkeys
        WHERE bearer = ? AND status = 0 AND redeemer_hash IS NULL AND datetime(expiry) > dateTime('now')
    `, [profileId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error!' });

        if (row) {
            res.json({ hasKey: true, key: row.key, expiry: row.expiry });
        } else {
            res.json({ hasKey: false });
        }
    });
});

// check if a blipkey is valid before letting them set a passcode
router.post('/check-blipkey', (req, res) => {
    const { blipkey } = req.body;

    if (!blipkey) {
        return res.status(400).json({ error: 'Blipkey is required!' });
    }

    db.get('SELECT id FROM blipkeys WHERE key = ? AND status = 0 AND datetime(expiry) > datetime(\'now\')',
    [blipkey], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error!' });

        if (row) {
            res.json({ valid: true });
        } else {
            res.status(400).json({ error: 'Invalid, used, or expired Blipkey!' });
        }
    });
});

module.exports = router;
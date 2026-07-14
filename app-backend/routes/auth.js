const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken')
const authenticateToken = require('../middleware/jwt');

const hashPhoneNumber = (phone) => {
    const pepper = process.env.PHONE_PEPPER;
    const cleaned = phone.replace(/\D/g, '');
    const clientHash = crypto.createHash('sha256').update(cleaned).digest('hex');
    return crypto.createHash('sha256').update(clientHash + pepper).digest('hex');
}

// 1. login endpoint
router.post('/login', (req, res) => {
    const { phone } = req.body;

    if (!phone || typeof phone !== 'string') return res.status(400).json({ error: 'Phone number is required!' });

    const phoneHash = hashPhoneNumber(phone);

    // database check
    db.get('SELECT id, bio, profile_pic_url, created_at FROM profiles WHERE phone_hash = ?', [phoneHash], (err, user) => {
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
router.post('/register', async (req, res) => {
    const { phone, blipkey } = req.body;

    if (!phone || !blipkey) {
        return res.status(400).json({ error: 'Phone number and Blipkey required!' });
    }
    
    const phoneHash = hashPhoneNumber(phone);

    // updating the key first so that it is certain no one else claimed it
    db.run('UPDATE blipkeys SET status = 1, redeemer_hash = ? WHERE key = ? AND status = 0', [phoneHash, blipkey], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });

        // checking if key entered is fake, already used or expired
        if (this.changes === 0) return res.status(400).json({ error: 'Invalid, expired or used Blipkey!' });

        // create new user
        db.run('INSERT INTO profiles (phone_hash) VALUES (?)', [phoneHash], function(insertErr) {
            if (insertErr) return res.status(500).json({ error: 'Could not create user or user already exists!' });
            
            // assign jwt and return
            const newUser = { id: this.lastID, bio: '', profile_pic_url: null };
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
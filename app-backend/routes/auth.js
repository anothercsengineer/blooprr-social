const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

// NOTE: will have to add redis later to temporarily store OTPs
const mockOtpStore = {};

const hashPhoneNumber = (phone) => {
    const pepper = process.env.PHONE_PEPPER || 'default-blooprr-pepper';
    return crypto.createHash('sha256').update(phone + pepper).digest('hex');
}

// 1. otp request endpoint
router.post('/request-otp', (req, res) => {
    const { phone } = req.body;

    if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ error: 'Phone number is required!' });
    }

    // E.164 format validation
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'Invalid phone number format. Use E.164 format (e.g. +919876543210)' });
    }

    // generate fake otp
    const otp = crypto.randomInt(100000, 999999).toString();
    mockOtpStore[phone] = {
        otp: otp,
        expiresAt: Date.now() + (5 * 60 * 1000), // expires in 5 minutes
        attempts: 0
    };

    console.log(`[MOCK SMS] Sent OTP ${otp} to phone ${phone}`);

    res.json({ message: 'OTP sent successfully (check backend console)' });
});

// 2. otp verification and login/signup endpoint
router.post('/verify-otp', (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone number and OTP are required!' });
    }

    if (mockOtpStore[phone] === otp) {
        const record = mockOtpStore[phone];

        if (!record) {
            return res.status(400).json({ error: 'No OTP requested for this number!' });
        }

        if (Date.now() > record.expiresAt) {
            delete mockOtpStore[phone];
            return res.status(400).json({ error: 'OTP has expired!'})
        }

        if (record.attempts >= 5) {
            delete mockOtpStore[phone];
            return res.status(429).json({ error: 'Too many failed attempts! Request a new OTP.'});
        }

        if (record.otp !== otp) {
            record.attempts += 1;
            return res.status(400).json({ error: 'Invalid OTP!' });
        }
        
        // if otp matches, its cleared from the memory
        delete mockOtpStore[phone];

        const phoneHash = hashPhoneNumber(phone);

        // checking if user exists in database
        db.get('SELECT id, bio, profile_pic_url, created_at FROM profiles WHERE phone_hash = ?', [phoneHash], (err, user) => {
            if (err) return res.status(500).json({ error: 'Database error!' });

            if (user) {
                // user exists - log in
                return res.json({ message: 'Login successful', user, isNewUser: false }); // NOTE: will have to add JWT later
            } else {
                // new user - sign up
                db.run('INSERT INTO profiles (phone_hash) VALUES (?)', [phoneHash], function(insertErr) {
                    if (insertErr) return res.status(500).json({ error: 'Could not create user!' });

                    const newUser = { id: this.lastID, phone_hash: phoneHash, bio: '', profile_pic_url: null };
                    return res.json({ message: 'Sign-up successful!', user: newUser, isNewUser: true });
                });
            }
        });
    } else {
        res.status(401).json({ error: 'Invalid OTP' });
    }
});

module.exports = router;
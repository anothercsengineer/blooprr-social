const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken')

// NOTE: will have to add redis later to temporarily store OTPs
const mockOtpStore = {};

const hashPhoneNumber = (phone) => {
    const pepper = process.env.PHONE_PEPPER || 'default-blooprr-pepper';
    const cleaned = phone.replace(/\D/g, '');
    const clientHash = crypto.createHash('sha256').update(cleaned).digest('hex');
    return crypto.createHash('sha256').update(clientHash + pepper).digest('hex');
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

    // toll fraud protection
    const existingRecord = mockOtpStore[phone];
    if (existingRecord && Date.now() < existingRecord.requestedAt + (45 * 1000)) {
        const timeLeft = Math.ceil(((existingRecord.requestedAt + 45000) - Date.now()) / 1000);
        return res.status(429).json({ error: `Please wait ${timeLeft} seconds before requesting another OTP.` });
    }

    // generate fake otp
    const otp = crypto.randomInt(100000, 999999).toString();
    mockOtpStore[phone] = {
        otp: otp,
        expiresAt: Date.now() + (5 * 60 * 1000), // expires in 5 minutes
        requestedAt: Date.now(), // tracks the cooldown
        attempts: 0
    };

    // only prints the otp to console in local dev
    if (process.env.NODE_ENV != 'production') {
        console.log(`[DEV ONLY SMS] Sent OTP ${otp} to phone ${phone}`);
    }

    res.json({ message: 'OTP sent successfully (check backend console)' });
});

// 2. otp verification and login/signup endpoint
router.post('/verify-otp', (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone number and OTP are required!' });
    }

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
            // user exists - generate token and log in
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'default-blooprr-jwt-secret', { expiresIn: '1y' });
            return res.json({ message: 'Login successful', user, token, isNewUser: false });
        } else {
            // new user - sign up
            db.run('INSERT INTO profiles (phone_hash) VALUES (?)', [phoneHash], function(insertErr) {
                if (insertErr) return res.status(500).json({ error: 'Could not create user!' });

                const newUser = { id: this.lastID, bio: '', profile_pic_url: null };
                const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET || 'default-blooprr-jwt-secret', { expiresIn: '1y' });
                return res.json({ message: 'Sign-up successful!', user: newUser, token, isNewUser: true });
            });
        }
    });
});

// garbage collector
setInterval(() => {
    const now = Date.now();
    for (const phone in mockOtpStore) {
        if (now > mockOtpStore[phone].expiresAt) {
            delete mockOtpStore[phone];
        }
    }
}, 10 * 60 * 1000);

module.exports = router;
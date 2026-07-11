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

    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required!' });
    }

    // generate fake otp
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    mockOtpStore[phone] = otp;

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
        // if otp matches, its cleared from the memory
        delete mockOtpStore[phone];

        const phoneHash = hashPhoneNumber(phone);

        // checking if user exists in database
        db.get('SELECT * FROM profiles WHERE phone_hash = ?', [phoneHash], (err, user) => {
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

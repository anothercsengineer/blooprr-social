const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken')
const authenticateToken = require('../middleware/jwt');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
    credential: cert(serviceAccount)
});

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
    const { phone, blipkey } = req.body;

    if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ error: 'Phone number is required!' });
    }

    // E.164 format validation
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'Invalid phone number format!' });
    }

    // toll fraud protection
    const existingRecord = mockOtpStore[phone];
    if (existingRecord && Date.now() < existingRecord.requestedAt + (45 * 1000)) {
        const timeLeft = Math.ceil(((existingRecord.requestedAt + 45000) - Date.now()) / 1000);
        return res.status(429).json({ error: `Please wait ${timeLeft} seconds before requesting another OTP.` });
    }

    const phoneHash = hashPhoneNumber(phone);
    const today = new Date().toISOString().split('T')[0];

    // check if user already exists
    db.get('SELECT id FROM profiles WHERE phone_hash = ?', [phoneHash], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (user) {
            // skip blipkey check for returning user
            checkQuotaAndSendOTP(phone, today, res);
        } else {
            // require blipkey for new user
            if (!blipkey) return res.status(400).json({ error: 'A blipkey (invite code) is required to sign up.' });

            db.get('SELECT * FROM blipkeys WHERE key = ?', [blipkey], (err, keyRow) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                if (!keyRow || keyRow.status === 1) return res.status(400).json({ error: 'Invalid or already used Blipkey!' });

                // if unbound, check expiry and bind it
                if (!keyRow.redeemer_hash) {
                    if (new Date(keyRow.expiry) < new Date()) return res.status(400).json({ error: 'This Blipkey has expired!' });
                    
                    db.run('UPDATE blipkeys SET redeemer_hash = ? WHERE key = ?', [phoneHash,blipkey], (err) => {
                        if (err) return res.status(500).json({ error: 'Failed to bind key!' });
                        checkQuotaAndSendOTP(phone, today, res);
                    });
                } else {
                    // safety net
                    if (keyRow.redeemer_hash === phoneHash) {
                        checkQuotaAndSendOTP(phone, today, res);
                    } else {
                        return res.status(400).json({ error: 'This Blipkey was already claimed by another phone number! '});
                    }
                }
            });
        }
    });
});

// helper function to handle quota and sending
function checkQuotaAndSendOTP(phone, today, res) {
    db.get('SELECT sms_count FROM daily_metrics WHERE date_string = ?', [today], (err, row) => {
        if (err) return res.status (500).json({ error: 'Database error' });

        const count = row ? row.sms_count : 0;

        // 10 SMS/day quota limit for developer testing
        if (count >= 10) {
            return res.status(429).json({ error: 'Blooprr is at capacity for today. Your invite is saved! Please try verifying tomorrow.' });
        }

        // increment quota
        db.run('INSERT INTO daily_metrics (date_string, sms_count) VALUES (?, 1) ON CONFLICT(date_string) DO UPDATE SET sms_count = sms_count + 1', [today]);

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
}

// 2. otp verification and login/signup endpoint
router.post('/verify-otp', async (req, res) => {
    const { phone, token } = req.body;

    if (!phone || !token) {
        return res.status(400).json({ error: 'Phone number and Firebase token are required!' });
    }

    try {
        // i. cryptographical verification of token from google
        const decodedToken = await getAuth().verifyIdToken(token);

        // ii. checking the phone no and token match
        if (decodedToken.phone_number !== phone) {
            return res.status(400).json({ error: 'Phone number mismatch!' });
        }
    } catch (error) {
        console.error("Firebase Error:", error);
        return res.status(400).json({ error: 'Invalid or expired Firebase token!' });
    }

    // if google approved it, proceeding with normal signup/login
    const phoneHash = hashPhoneNumber(phone);

    // checking if user exists in database
    db.get('SELECT id, bio, profile_pic_url, created_at FROM profiles WHERE phone_hash = ?', [phoneHash], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error!' });

        if (user) {
            // user exists - generate token and log in
            const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'default-blooprr-jwt-secret', { expiresIn: '1y' });
            return res.json({ message: 'Login successful', user, token: jwtToken, isNewUser: false });
        } else {
            // new user - sign up
            db.run('INSERT INTO profiles (phone_hash) VALUES (?)', [phoneHash], function(insertErr) {
                if (insertErr) return res.status(500).json({ error: 'Could not create user!' });

                // burning the blipkey so it cannot be used again
                db.run('UPDATE blipkeys SET status = 1 WHERE redeemer_hash = ?', [phoneHash]);

                const newUser = { id: this.lastID, bio: '', profile_pic_url: null };
                const jwtToken = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET || 'default-blooprr-jwt-secret', { expiresIn: '1y' });
                return res.json({ message: 'Sign-up successful!', user: newUser, token: jwtToken, isNewUser: true });
            });
        }
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
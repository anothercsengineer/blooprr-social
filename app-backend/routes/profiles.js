const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/jwt');

// setting up a profile for a new user
router.post('/setup', authenticateToken, (req, res) => {
    const profileId = req.user.id;
    const { bio, profilePicUrl } = req.body;

    // enforces the 150-char limit natively
    const safeBio = bio ? bio.substring(0, 150) : '';

    // updates the profile based on the cryptographically proven user ID
    db.run(
        'UPDATE profiles SET bio = ?, profile_pic_url = ? WHERE id = ?',
        [safeBio, profilePicUrl || null, profileId],
        function(err) {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: 'Database error!' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Profile not found!' });
            }

            res.json({ message: 'Profile updated successfully!' });
        }
    );
});

module.exports = router;
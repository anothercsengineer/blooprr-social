const express = require('express');
const cors = require('cors');
require('dotenv').config();
if (!process.env.JWT_SECRET || !process.env.PHONE_PEPPER) {
    console.error('FATAL ERROR: JWT_SECRET and PHONE_PEPPER must be set in .env!');
    process.exit(1);
}

const db = require('./db');
const app = express();
const PORT = process.env.PORT || 3001;

// middleware
const allowedOrigins = [
    'http://localhost:8081',
    'http://localhost:3000',
    'http://10.0.2.2:8081'
]
app.use(cors({
    origin: process.env.CORS_ALLOWED_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
app.use(helmet());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '1mb' }));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const contactsRoutes = require('./routes/contacts');
app.use('/api/contacts', contactsRoutes);

// test route
app.get('/api/health', (req, res) => {
    res.json({ message: 'Welcome to the blooprr API!' });
});

// server start
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// optimised shut down for the SQLite database when server is killed
process.on('SIGINT', () => {
    console.log('\nClosing SQLite database connection...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database closed successfully.');
        }
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log("Shutting down servers... (SIGTERM)");
    db.close((err) => {
        if (err) console.error("Error closing database:", err.message);
        else console.log("Database connection closed.");
        process.exit(0);
    });
});
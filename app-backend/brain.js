const express = require('express');
const cors = require('cors');
require('dotenv').config();
if (!process.env.JWT_SECRET || !process.env.PHONE_PEPPER) {
    console.error('FATAL ERROR: JWT_SECRET and PHONE_PEPPER must be set in .env!');
    process.exit(1);
}

if (!process.env.CORS_ALLOWED_ORIGIN) {
    console.error("FATAL ERROR: CORS_ALLOWED_ORIGIN is not defined in .env!");
    process.exit(1);
}

const db = require('./db');
const app = express();
const PORT = process.env.PORT || 3001;

// middleware
app.use(cors({
    origin: process.env.CORS_ALLOWED_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
app.use(helmet());
// required if running behind a reverse proxy so rate limiter doesn't block everyone globally
app.set('trust proxy', 1);
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, // limit for app usage (scrolling, syncing, etc.)
    message: { error: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // aggressive limit: maximum 10 auth attempts per ip
    message: { error: 'Too many authentication attempts from this IP. You are temporarily locked out.' }
});
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

app.use(express.json({ limit: '10mb' }));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const contactsRoutes = require('./routes/contacts');
app.use('/api/contacts', contactsRoutes);

const profileRoutes = require('./routes/profiles');
app.use('/api/profiles', profileRoutes);

// test route
app.get('/api/health', (req, res) => {
    res.json({ message: 'Welcome to the blooprr API!' });
});

// global error handler to prevent HTML stack trace leaks
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Malformed JSON payload!' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error!' });
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
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const contactsRoutes = require('./routes/contacts');
app.use('/api/contacts', contactsRoutes);

// test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the blooprr API!' });
});

// server start
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
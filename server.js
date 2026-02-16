const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'srif2026-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static Files
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const submissionRoutes = require('./routes/submissions');
const contactRoutes = require('./routes/contact');
const committeeRoutes = require('./routes/committees');
const speakerRoutes = require('./routes/speakers');

app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/committees', committeeRoutes);
app.use('/api/speakers', speakerRoutes);

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/submit-research', (req, res) => {
    res.sendFile(path.join(__dirname, 'submit-research.html'));
});

app.get('/submit-innovation', (req, res) => {
    res.sendFile(path.join(__dirname, 'submit-innovation.html'));
});

// Admin Panel
app.get('/admin', (req, res) => {
    res.redirect('/admin/login.html');
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'An error occurred'
            : err.message
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════════════════╗
    ║                                                        ║
    ║   🔬 SRIF 2026 - Scientific Research & Innovation     ║
    ║                      Forum Server                      ║
    ║                                                        ║
    ║   🚀 Server running on: http://localhost:${PORT}          ║
    ║   📊 Environment: ${process.env.NODE_ENV || 'development'}                       ║
    ║                                                        ║
    ╚════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;

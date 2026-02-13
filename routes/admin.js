const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { query, getOne, getAll } = require('../database/db');
const { sendStatusEmail } = require('../services/emailService');
const fs = require('fs');

// Ensure gallery upload directory exists
const galleryDir = path.join(__dirname, '..', 'uploads', 'gallery');
if (!fs.existsSync(galleryDir)) {
    fs.mkdirSync(galleryDir, { recursive: true });
    console.log('📁 Created uploads/gallery directory');
}

// Configure multer for gallery uploads
const galleryStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, galleryDir),
    filename: (req, file, cb) => {
        const uniqueName = `gallery-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const galleryUpload = multer({
    storage: galleryStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    }
});

const JWT_SECRET = process.env.JWT_SECRET || 'srif-2026-jwt-secret';

// Auth Middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await getOne('SELECT id, email, name, role FROM users WHERE id = $1 AND is_active = true', [decoded.userId]);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = await getOne('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log activity
        await query(`
            INSERT INTO activity_logs (user_id, action, details, ip_address)
            VALUES ($1, 'login', $2, $3)
        `, [user.id, JSON.stringify({ email: user.email }), req.ip]);

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Dashboard Stats
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const stats = {};

        // Total submissions
        const researchTotal = await getOne('SELECT COUNT(*) as count FROM research_submissions');
        const innovationTotal = await getOne('SELECT COUNT(*) as count FROM innovation_submissions');
        stats.totalSubmissions = parseInt(researchTotal.count) + parseInt(innovationTotal.count);
        stats.researchCount = parseInt(researchTotal.count);
        stats.innovationCount = parseInt(innovationTotal.count);

        // Status counts
        const researchApproved = await getOne("SELECT COUNT(*) as count FROM research_submissions WHERE status = 'approved'");
        const innovationApproved = await getOne("SELECT COUNT(*) as count FROM innovation_submissions WHERE status = 'approved'");
        stats.approvedCount = parseInt(researchApproved.count) + parseInt(innovationApproved.count);

        const researchPending = await getOne("SELECT COUNT(*) as count FROM research_submissions WHERE status = 'pending'");
        const innovationPending = await getOne("SELECT COUNT(*) as count FROM innovation_submissions WHERE status = 'pending'");
        stats.pendingCount = parseInt(researchPending.count) + parseInt(innovationPending.count);

        // Recent submissions
        const recentResearch = await getAll(`
            SELECT submission_id, author_name as author, title, status, created_at, 'research' as type
            FROM research_submissions
            ORDER BY created_at DESC
            LIMIT 5
        `);

        const recentInnovation = await getAll(`
            SELECT submission_id, innovator_name as author, title, status, created_at, 'innovation' as type
            FROM innovation_submissions
            ORDER BY created_at DESC
            LIMIT 5
        `);

        stats.recentSubmissions = [...recentResearch, ...recentInnovation]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10);

        res.json({ success: true, data: stats });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all research submissions
router.get('/research', authMiddleware, async (req, res) => {
    try {
        const { status, affiliation, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        const params = [];
        let paramIndex = 1;

        if (status) {
            whereClause += ` WHERE rs.status = $${paramIndex++}`;
            params.push(status);
        }

        if (affiliation) {
            whereClause += whereClause ? ' AND' : ' WHERE';
            whereClause += ` a.code = $${paramIndex++}`;
            params.push(affiliation);
        }

        params.push(limit, offset);

        const submissions = await getAll(`
            SELECT rs.*, a.name_en as affiliation_name, a.code as affiliation_code
            FROM research_submissions rs
            LEFT JOIN affiliations a ON rs.affiliation_id = a.id
            ${whereClause}
            ORDER BY rs.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex}
        `, params);

        const total = await getOne(`
            SELECT COUNT(*) as count 
            FROM research_submissions rs
            LEFT JOIN affiliations a ON rs.affiliation_id = a.id
            ${whereClause}
        `, params.slice(0, -2));

        res.json({
            success: true,
            data: submissions,
            pagination: {
                total: parseInt(total.count),
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total.count / limit)
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all innovation submissions
router.get('/innovation', authMiddleware, async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = status ? 'WHERE inn.status = $1' : '';
        const params = status ? [status, limit, offset] : [limit, offset];

        const submissions = await getAll(`
            SELECT inn.*, a.name_en as affiliation_name, a.code as affiliation_code
            FROM innovation_submissions inn
            LEFT JOIN affiliations a ON inn.affiliation_id = a.id
            ${whereClause}
            ORDER BY inn.created_at DESC
            LIMIT $${status ? 2 : 1} OFFSET $${status ? 3 : 2}
        `, params);

        const countParams = status ? [status] : [];
        const total = await getOne(`
            SELECT COUNT(*) as count FROM innovation_submissions ${status ? 'WHERE status = $1' : ''}
        `, countParams);

        res.json({
            success: true,
            data: submissions,
            pagination: {
                total: parseInt(total.count),
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total.count / limit)
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single submission
router.get('/submission/:type/:id', authMiddleware, async (req, res) => {
    try {
        const { type, id } = req.params;
        const table = type === 'research' ? 'research_submissions' : 'innovation_submissions';

        const submission = await getOne(`
            SELECT s.*, a.name_en as affiliation_name, a.name_ar as affiliation_name_ar
            FROM ${table} s
            LEFT JOIN affiliations a ON s.affiliation_id = a.id
            WHERE s.id = $1
        `, [id]);

        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        res.json({ success: true, data: submission });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update submission status + send email notification
router.patch('/submission/:type/:id', authMiddleware, async (req, res) => {
    try {
        const { type, id } = req.params;
        const { status, reviewerNotes, presentationType } = req.body;
        const table = type === 'research' ? 'research_submissions' : 'innovation_submissions';

        if (!['pending', 'approved', 'rejected', 'revision'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        // Get submission before updating (for email)
        const submission = await getOne(`SELECT * FROM ${table} WHERE id = $1`, [id]);
        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        await query(`
            UPDATE ${table}
            SET status = $1, reviewer_notes = $2, presentation_type = $3,
                reviewed_by = $4, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
        `, [status, reviewerNotes || null, presentationType || null, req.user.id, id]);

        // Log activity
        await query(`
            INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
            VALUES ($1, 'update_status', $2, $3, $4)
        `, [req.user.id, type, id, JSON.stringify({ status, reviewerNotes })]);

        // Send email notification (async, don't block response)
        let emailResult = { sent: false };
        if (status !== 'pending') {
            emailResult = await sendStatusEmail(submission, status, type, reviewerNotes);
        }

        res.json({
            success: true,
            message: 'Submission updated successfully',
            emailSent: emailResult.sent
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get announcements (admin)
router.get('/announcements', authMiddleware, async (req, res) => {
    try {
        const announcements = await getAll(`
            SELECT a.*, u.name as created_by_name
            FROM announcements a
            LEFT JOIN users u ON a.created_by = u.id
            ORDER BY a.created_at DESC
        `);
        res.json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Configure multer for news uploads
const newsDir = path.join(__dirname, '..', 'uploads', 'news');
if (!fs.existsSync(newsDir)) {
    fs.mkdirSync(newsDir, { recursive: true });
}
const newsUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, newsDir),
        filename: (req, file, cb) => cb(null, `news-${uuidv4()}${path.extname(file.originalname)}`)
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    }
});

// Auto-add image_path column if not exists
query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_path VARCHAR(500)`)
    .catch(() => { });

// Create announcement with image
router.post('/announcements', authMiddleware, newsUpload.single('image'), async (req, res) => {
    try {
        const { titleEn, titleAr, contentEn, contentAr, type, isPublished } = req.body;

        if (!titleEn || !contentEn) {
            return res.status(400).json({ success: false, message: 'Title and content are required' });
        }

        let imagePath = null;
        if (req.file) {
            imagePath = path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');
        }

        const result = await query(`
            INSERT INTO announcements (title_en, title_ar, content_en, content_ar, type, is_published, image_path, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `, [titleEn, titleAr || null, contentEn, contentAr || null, type || 'news', isPublished ?? true, imagePath, req.user.id]);

        res.status(201).json({
            success: true,
            message: 'Announcement created',
            data: { id: result.rows[0].id }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete announcement
router.delete('/announcements/:id', authMiddleware, async (req, res) => {
    try {
        await query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get settings
router.get('/settings', authMiddleware, async (req, res) => {
    try {
        const settings = await getAll('SELECT * FROM settings ORDER BY key');
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update settings
router.patch('/settings', authMiddleware, async (req, res) => {
    try {
        const updates = req.body;

        for (const [key, value] of Object.entries(updates)) {
            await query(`
                UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP
                WHERE key = $2
            `, [value, key]);
        }

        res.json({ success: true, message: 'Settings updated' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Export submissions
router.get('/export/:type', authMiddleware, async (req, res) => {
    try {
        const { type } = req.params;
        const { format = 'json' } = req.query;

        const table = type === 'research' ? 'research_submissions' : 'innovation_submissions';
        const submissions = await getAll(`
            SELECT s.*, a.name_en as affiliation_name
            FROM ${table} s
            LEFT JOIN affiliations a ON s.affiliation_id = a.id
            ORDER BY s.created_at DESC
        `);

        if (format === 'csv') {
            // Generate CSV
            const headers = Object.keys(submissions[0] || {}).join(',');
            const rows = submissions.map(s => Object.values(s).map(v => `"${v}"`).join(','));
            const csv = [headers, ...rows].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${type}_submissions.csv`);
            res.send(csv);
        } else {
            res.json({ success: true, data: submissions });
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== GALLERY ROUTES ====================

// Auto-create gallery table if not exists
query(`
    CREATE TABLE IF NOT EXISTS gallery (
        id SERIAL PRIMARY KEY,
        image_path VARCHAR(500) NOT NULL,
        caption_en VARCHAR(500),
        caption_ar VARCHAR(500),
        category VARCHAR(100) DEFAULT 'general',
        sort_order INTEGER DEFAULT 0,
        is_visible BOOLEAN DEFAULT true,
        uploaded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`).then(() => console.log('✅ Gallery table ready')).catch(err => console.error('Gallery table error:', err.message));

// Get all gallery images
router.get('/gallery', authMiddleware, async (req, res) => {
    try {
        const images = await getAll(`
            SELECT g.*, u.name as uploaded_by_name
            FROM gallery g
            LEFT JOIN users u ON g.uploaded_by = u.id
            ORDER BY g.sort_order ASC, g.created_at DESC
        `);
        res.json({ success: true, data: images });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Upload gallery image
router.post('/gallery', authMiddleware, galleryUpload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Image file is required' });
        }

        const { captionEn, captionAr, category } = req.body;

        const maxOrder = await getOne('SELECT COALESCE(MAX(sort_order), 0) as max_order FROM gallery');

        const relativePath = path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');

        const result = await query(`
            INSERT INTO gallery (image_path, caption_en, caption_ar, category, sort_order, uploaded_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [
            relativePath,
            captionEn || null,
            captionAr || null,
            category || 'general',
            parseInt(maxOrder.max_order) + 1,
            req.user.id
        ]);

        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            data: { id: result.rows[0].id, path: req.file.path }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update gallery image
router.patch('/gallery/:id', authMiddleware, async (req, res) => {
    try {
        const { captionEn, captionAr, category, sortOrder } = req.body;
        await query(`
            UPDATE gallery 
            SET caption_en = COALESCE($1, caption_en),
                caption_ar = COALESCE($2, caption_ar),
                category = COALESCE($3, category),
                sort_order = COALESCE($4, sort_order)
            WHERE id = $5
        `, [captionEn, captionAr, category, sortOrder, req.params.id]);
        res.json({ success: true, message: 'Image updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete gallery image
router.delete('/gallery/:id', authMiddleware, async (req, res) => {
    try {
        await query('DELETE FROM gallery WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Image deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { query } = require('../database/db');
const fs = require('fs');
const auth = require('../middleware/auth'); // Import auth middleware if needed later

const uploadDir = 'uploads/speakers/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/speakers/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp'];
        if (allowedTypes.includes(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Ensure table exists
(async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS speakers (
                id SERIAL PRIMARY KEY,
                name_en VARCHAR(255) NOT NULL,
                name_ar VARCHAR(255) NOT NULL,
                role_en VARCHAR(255),
                role_ar VARCHAR(255),
                bio_en TEXT,
                bio_ar TEXT,
                image_path VARCHAR(255),
                speaker_type VARCHAR(50) DEFAULT 'Keynote', -- e.g., 'Keynote', 'Panelist'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Speakers table ready');
    } catch (err) {
        console.error('Error creating speakers table:', err);
    }
})();

// Get all speakers
router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT * FROM speakers ORDER BY id');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create Speaker (Protected route ideally, but keeping open for now as per user pattern, or applying auth later)
// Adding upload middleware
router.post('/create', upload.single('image'), async (req, res) => {
    try {
        const { name_en, name_ar, role_en, role_ar, bio_en, bio_ar, speaker_type } = req.body;
        const image_path = req.file ? req.file.path : null;

        if (!name_en || !name_ar) {
            return res.status(400).json({ success: false, message: 'Names are required' });
        }

        const result = await query(
            'INSERT INTO speakers (name_en, name_ar, role_en, role_ar, bio_en, bio_ar, speaker_type, image_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [name_en, name_ar, role_en, role_ar, bio_en, bio_ar, speaker_type || 'Keynote', image_path]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete Speaker
router.delete('/:id', async (req, res) => {
    try {
        // First get image path to delete file
        const result = await query('SELECT image_path FROM speakers WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) {
            const imagePath = result.rows[0].image_path;
            if (imagePath && fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await query('DELETE FROM speakers WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Speaker deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

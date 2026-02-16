const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { query, getOne } = require('../database/db');
const fs = require('fs');

const uploadDir = 'uploads/committees/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/committees/');
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

// Ensure tables exist
(async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS committees (
                id SERIAL PRIMARY KEY,
                name_en VARCHAR(255) NOT NULL,
                name_ar VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS committee_members (
                id SERIAL PRIMARY KEY,
                committee_id INTEGER REFERENCES committees(id) ON DELETE CASCADE,
                name_en VARCHAR(255) NOT NULL,
                name_ar VARCHAR(255) NOT NULL,
                role_en VARCHAR(255),
                role_ar VARCHAR(255),
                image_path VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Committee tables ready');
    } catch (err) {
        console.error('Error creating committee tables:', err);
    }
})();

// Get all committees with members
router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT * FROM committees ORDER BY id');
        const committees = result.rows;

        for (let committee of committees) {
            const memberResult = await query('SELECT * FROM committee_members WHERE committee_id = $1 ORDER BY id', [committee.id]);
            committee.members = memberResult.rows;
        }

        res.json({ success: true, data: committees });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create Committee
router.post('/create', async (req, res) => {
    try {
        const { name_en, name_ar } = req.body;
        if (!name_en || !name_ar) return res.status(400).json({ success: false, message: 'Names are required' });

        const result = await query(
            'INSERT INTO committees (name_en, name_ar) VALUES ($1, $2) RETURNING *',
            [name_en, name_ar]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add Member to Committee
router.post('/member/add', upload.single('image'), async (req, res) => {
    try {
        const { committee_id, name_en, name_ar, role_en, role_ar } = req.body;
        const image_path = req.file ? req.file.path : null;

        if (!committee_id || !name_en || !name_ar) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        const result = await query(
            'INSERT INTO committee_members (committee_id, name_en, name_ar, role_en, role_ar, image_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [committee_id, name_en, name_ar, role_en, role_ar, image_path]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete Committee
router.delete('/:id', async (req, res) => {
    try {
        await query('DELETE FROM committees WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Committee deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete Member
router.delete('/member/:id', async (req, res) => {
    try {
        await query('DELETE FROM committee_members WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Member deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

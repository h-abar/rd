const express = require('express');
const router = express.Router();
const { getAll, getOne } = require('../database/db');

// Get all affiliations
router.get('/affiliations', async (req, res) => {
    try {
        const affiliations = await getAll('SELECT * FROM affiliations ORDER BY id');
        res.json({ success: true, data: affiliations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get settings
router.get('/settings', async (req, res) => {
    try {
        const settings = await getAll('SELECT key, value FROM settings');
        const settingsObj = {};
        settings.forEach(s => settingsObj[s.key] = s.value);
        res.json({ success: true, data: settingsObj });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get published announcements
router.get('/announcements', async (req, res) => {
    try {
        const announcements = await getAll(`
            SELECT id, title_en, title_ar, content_en, content_ar, type, published_at
            FROM announcements
            WHERE is_published = true
            ORDER BY published_at DESC
            LIMIT 10
        `);
        res.json({ success: true, data: announcements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get statistics (public)
router.get('/stats', async (req, res) => {
    try {
        const researchCount = await getOne('SELECT COUNT(*) as count FROM research_submissions');
        const innovationCount = await getOne('SELECT COUNT(*) as count FROM innovation_submissions');
        const approvedCount = await getOne(`
            SELECT 
                (SELECT COUNT(*) FROM research_submissions WHERE status = 'approved') +
                (SELECT COUNT(*) FROM innovation_submissions WHERE status = 'approved') as count
        `);

        res.json({
            success: true,
            data: {
                totalSubmissions: parseInt(researchCount.count) + parseInt(innovationCount.count),
                researchCount: parseInt(researchCount.count),
                innovationCount: parseInt(innovationCount.count),
                approvedCount: parseInt(approvedCount.count)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get published gallery images (public)
router.get('/gallery', async (req, res) => {
    try {
        const { category } = req.query;
        let whereClause = 'WHERE is_visible = true';
        const params = [];

        if (category) {
            params.push(category);
            whereClause += ` AND category = $1`;
        }

        const images = await getAll(`
            SELECT id, image_path, caption_en, caption_ar, category
            FROM gallery
            ${whereClause}
            ORDER BY sort_order ASC, created_at DESC
        `, params);
        res.json({ success: true, data: images });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get published news (public)
router.get('/news', async (req, res) => {
    try {
        const news = await getAll(`
            SELECT id, title_en, title_ar, content_en, content_ar, type, image_path, published_at
            FROM announcements
            WHERE is_published = true
            ORDER BY published_at DESC
            LIMIT 20
        `);
        res.json({ success: true, data: news });
    } catch (error) {
        res.status(500).json({ success: true, data: [] });
    }
});

// Get single news item (public)
router.get('/news/:id', async (req, res) => {
    try {
        const item = await getOne(`
            SELECT id, title_en, title_ar, content_en, content_ar, type, image_path, published_at
            FROM announcements
            WHERE id = $1 AND is_published = true
        `, [req.params.id]);

        if (!item) {
            return res.status(404).json({ success: false, message: 'News not found' });
        }
        res.json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'SRIF 2026 API is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;

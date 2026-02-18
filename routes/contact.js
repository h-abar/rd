const express = require('express');
const router = express.Router();
const { query, getOne, getAll } = require('../database/db');
const { sendContactEmail } = require('../services/emailService');

// Submit contact message (public)
// Submit contact message (public)
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        await query(`
            INSERT INTO contact_messages (name, email, subject, message)
            VALUES ($1, $2, $3, $4)
        `, [name, email, subject || null, message]);

        // Send Email Notification
        const emailSent = await sendContactEmail({ name, email, subject, message });

        if (!emailSent) {
            console.warn('Contact email failed to send, but message stored in DB.');
        }

        res.status(201).json({
            success: true,
            message: 'Message sent successfully'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again.'
        });
    }
});

// Get all messages (admin)
router.get('/', async (req, res) => {
    try {
        const messages = await getAll(`
            SELECT * FROM contact_messages
            ORDER BY created_at DESC
        `);
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark message as read (admin)
router.patch('/:id/read', async (req, res) => {
    try {
        await query(
            'UPDATE contact_messages SET is_read = true WHERE id = $1',
            [req.params.id]
        );
        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete message (admin)
router.delete('/:id', async (req, res) => {
    try {
        await query('DELETE FROM contact_messages WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;

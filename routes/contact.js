const express = require('express');
const router = express.Router();
const { query, getOne, getAll } = require('../database/db');
let nodemailer;
try {
    nodemailer = require('nodemailer');
} catch (e) {
    console.warn('Nodemailer not installed. Email sending will be disabled.');
}

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

        // Basic email validation
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
        if (nodemailer && process.env.SMTP_HOST) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });

                await transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: 'rs@um.edu.sa',
                    subject: `SRIF Contact: ${subject || 'New Message'}`,
                    html: `
                        <h3>New Contact Message</h3>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
                        <hr>
                        <p><strong>Message:</strong></p>
                        <p>${message.replace(/\n/g, '<br>')}</p>
                    `
                });
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
            }
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

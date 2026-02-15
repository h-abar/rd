const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { query, getOne } = require('../database/db');

// Ensure database schema is up to date
(async () => {
    try {
        await query(`
            DO $$
            BEGIN
                BEGIN
                    ALTER TABLE research_submissions ADD COLUMN presentation_type VARCHAR(50);
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END;
                BEGIN
                    ALTER TABLE innovation_submissions ADD COLUMN presentation_type VARCHAR(50);
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END;
            END $$;
        `);
    } catch (err) {
        console.error('Schema update error:', err);
    }
})();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
        }
    }
});

// Generate submission ID
function generateSubmissionId(type) {
    const prefix = type === 'research' ? 'R' : 'I';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${year}-${random}`;
}

// Submit Research Abstract
router.post('/research', upload.single('file'), async (req, res) => {
    try {
        const {
            authorName,
            supervisorName,
            teamMembers,
            email,
            affiliation,
            externalInstitution,
            title,
            background,
            methods,
            results,
            conclusion,
            presentationType // New field
        } = req.body;

        // Validate required fields
        if (!authorName || !supervisorName || !email || !affiliation ||
            !title || !background || !methods || !results || !conclusion || !presentationType) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be filled'
            });
        }

        // Get affiliation ID
        const affiliationData = await getOne(
            'SELECT id FROM affiliations WHERE code = $1',
            [affiliation]
        );

        if (!affiliationData) {
            return res.status(400).json({
                success: false,
                message: 'Invalid affiliation'
            });
        }

        const submissionId = generateSubmissionId('research');
        const filePath = req.file ? req.file.path : null;
        const fileName = req.file ? req.file.originalname : null;

        await query(`
            INSERT INTO research_submissions (
                submission_id, author_name, supervisor_name, team_members,
                email, affiliation_id, external_institution, title,
                background, methods, results, conclusion,
                file_path, file_name, status, presentation_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending', $15)
        `, [
            submissionId, authorName, supervisorName, teamMembers || null,
            email, affiliationData.id, externalInstitution || null, title,
            background, methods, results, conclusion,
            filePath, fileName, presentationType
        ]);

        res.status(201).json({
            success: true,
            message: 'Research abstract submitted successfully',
            data: {
                submissionId,
                message: 'You will receive a confirmation email shortly'
            }
        });

    } catch (error) {
        console.error('Research submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit abstract. Please try again.'
        });
    }
});

// Submit Innovation Abstract
router.post('/innovation', upload.single('file'), async (req, res) => {
    try {
        const {
            innovatorName,
            mentorName,
            teamMembers,
            email,
            affiliation,
            externalInstitution,
            title,
            problemStatement,
            innovationDescription,
            keyFeatures,
            implementation,
            presentationType // New field
        } = req.body;

        // Validate required fields
        if (!innovatorName || !mentorName || !email || !affiliation ||
            !title || !problemStatement || !innovationDescription ||
            !keyFeatures || !implementation || !presentationType) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be filled'
            });
        }

        // Get affiliation ID
        const affiliationData = await getOne(
            'SELECT id FROM affiliations WHERE code = $1',
            [affiliation]
        );

        if (!affiliationData) {
            return res.status(400).json({
                success: false,
                message: 'Invalid affiliation'
            });
        }

        const submissionId = generateSubmissionId('innovation');
        const filePath = req.file ? req.file.path : null;
        const fileName = req.file ? req.file.originalname : null;

        await query(`
            INSERT INTO innovation_submissions (
                submission_id, innovator_name, mentor_name, team_members,
                email, affiliation_id, external_institution, title,
                problem_statement, innovation_description, key_features, implementation,
                file_path, file_name, status, presentation_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending', $15)
        `, [
            submissionId, innovatorName, mentorName, teamMembers || null,
            email, affiliationData.id, externalInstitution || null, title,
            problemStatement, innovationDescription, keyFeatures, implementation,
            filePath, fileName, presentationType
        ]);

        res.status(201).json({
            success: true,
            message: 'Innovation abstract submitted successfully',
            data: {
                submissionId,
                message: 'You will receive a confirmation email shortly'
            }
        });

    } catch (error) {
        console.error('Innovation submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit abstract. Please try again.'
        });
    }
});

// Check submission status
router.get('/status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const type = id.startsWith('R') ? 'research' : 'innovation';
        const table = type === 'research' ? 'research_submissions' : 'innovation_submissions';

        const submission = await getOne(`
            SELECT submission_id, status, created_at
            FROM ${table}
            WHERE submission_id = $1
        `, [id]);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        res.json({
            success: true,
            data: submission
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

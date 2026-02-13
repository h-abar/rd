const { pool } = require('../database/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initDatabase() {
    console.log('🚀 Initializing SRIF 2026 Database...\n');

    try {
        // Create tables
        await pool.query(`
            -- Users/Admins Table
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Affiliations Table
            CREATE TABLE IF NOT EXISTS affiliations (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                name_en VARCHAR(255) NOT NULL,
                name_ar VARCHAR(255) NOT NULL,
                is_external BOOLEAN DEFAULT false
            );

            -- Research Submissions Table
            CREATE TABLE IF NOT EXISTS research_submissions (
                id SERIAL PRIMARY KEY,
                submission_id VARCHAR(20) UNIQUE NOT NULL,
                author_name VARCHAR(255) NOT NULL,
                supervisor_name VARCHAR(255) NOT NULL,
                team_members TEXT,
                email VARCHAR(255) NOT NULL,
                affiliation_id INTEGER REFERENCES affiliations(id),
                external_institution VARCHAR(255),
                title VARCHAR(500) NOT NULL,
                background TEXT NOT NULL,
                methods TEXT NOT NULL,
                results TEXT NOT NULL,
                conclusion TEXT NOT NULL,
                file_path VARCHAR(500),
                file_name VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                reviewer_notes TEXT,
                reviewed_by INTEGER REFERENCES users(id),
                reviewed_at TIMESTAMP,
                presentation_type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Innovation Submissions Table
            CREATE TABLE IF NOT EXISTS innovation_submissions (
                id SERIAL PRIMARY KEY,
                submission_id VARCHAR(20) UNIQUE NOT NULL,
                innovator_name VARCHAR(255) NOT NULL,
                mentor_name VARCHAR(255) NOT NULL,
                team_members TEXT,
                email VARCHAR(255) NOT NULL,
                affiliation_id INTEGER REFERENCES affiliations(id),
                external_institution VARCHAR(255),
                title VARCHAR(500) NOT NULL,
                problem_statement TEXT NOT NULL,
                innovation_description TEXT NOT NULL,
                key_features TEXT NOT NULL,
                implementation TEXT NOT NULL,
                file_path VARCHAR(500),
                file_name VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                reviewer_notes TEXT,
                reviewed_by INTEGER REFERENCES users(id),
                reviewed_at TIMESTAMP,
                presentation_type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- News/Announcements Table
            CREATE TABLE IF NOT EXISTS announcements (
                id SERIAL PRIMARY KEY,
                title_en VARCHAR(500) NOT NULL,
                title_ar VARCHAR(500),
                content_en TEXT NOT NULL,
                content_ar TEXT,
                type VARCHAR(50) DEFAULT 'news',
                is_published BOOLEAN DEFAULT true,
                published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Event Settings Table
            CREATE TABLE IF NOT EXISTS settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(100) UNIQUE NOT NULL,
                value TEXT NOT NULL,
                description VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Activity Log Table
            CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                action VARCHAR(100) NOT NULL,
                entity_type VARCHAR(50),
                entity_id INTEGER,
                details JSONB,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Contact Messages Table
            CREATE TABLE IF NOT EXISTS contact_messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(500),
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT false,
                replied_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Gallery Table
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
            );
        `);

        console.log('✅ Tables created successfully\n');

        // Insert default affiliations
        const affiliations = [
            { code: 'medicine', name_en: 'AlMaarefa University, College of Medicine', name_ar: 'جامعة المعرفة، كلية الطب', is_external: false },
            { code: 'pharmacy', name_en: 'AlMaarefa University, College of Pharmacy', name_ar: 'جامعة المعرفة، كلية الصيدلة', is_external: false },
            { code: 'medical-sciences', name_en: 'AlMaarefa University, College of Medical Sciences', name_ar: 'جامعة المعرفة، كلية العلوم الطبية', is_external: false },
            { code: 'alumni', name_en: 'Alumni/Graduate of AlMaarefa University', name_ar: 'خريج جامعة المعرفة', is_external: false },
            { code: 'external', name_en: 'External University/Institution', name_ar: 'جامعة/مؤسسة خارجية', is_external: true }
        ];

        for (const aff of affiliations) {
            await pool.query(`
                INSERT INTO affiliations (code, name_en, name_ar, is_external)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (code) DO NOTHING
            `, [aff.code, aff.name_en, aff.name_ar, aff.is_external]);
        }

        console.log('✅ Default affiliations inserted\n');

        // Insert default settings
        const settings = [
            { key: 'event_name_en', value: 'Scientific Research and Innovation Forum 2026', description: 'Event name in English' },
            { key: 'event_name_ar', value: 'منتدى البحث العلمي والابتكار 2026', description: 'Event name in Arabic' },
            { key: 'event_start_date', value: '2026-05-05', description: 'Event start date' },
            { key: 'event_end_date', value: '2026-05-06', description: 'Event end date' },
            { key: 'submission_deadline', value: '2026-04-18', description: 'Abstract submission deadline' },
            { key: 'contact_email', value: 'rs@um.edu.sa', description: 'Contact email address' },
            { key: 'submissions_open', value: 'true', description: 'Whether submissions are open' }
        ];

        for (const setting of settings) {
            await pool.query(`
                INSERT INTO settings (key, value, description)
                VALUES ($1, $2, $3)
                ON CONFLICT (key) DO NOTHING
            `, [setting.key, setting.value, setting.description]);
        }

        console.log('✅ Default settings inserted\n');

        // Create default admin user
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@um.edu.sa';
        const adminPassword = process.env.ADMIN_PASSWORD || 'srif2026admin';
        const hashedPassword = await bcrypt.hash(adminPassword, 12);

        await pool.query(`
            INSERT INTO users (email, password, name, role)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) DO NOTHING
        `, [adminEmail, hashedPassword, 'System Administrator', 'super_admin']);

        console.log('✅ Default admin user created');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}\n`);

        // Create indexes for better performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_research_status ON research_submissions(status);
            CREATE INDEX IF NOT EXISTS idx_research_email ON research_submissions(email);
            CREATE INDEX IF NOT EXISTS idx_research_created ON research_submissions(created_at);
            CREATE INDEX IF NOT EXISTS idx_innovation_status ON innovation_submissions(status);
            CREATE INDEX IF NOT EXISTS idx_innovation_email ON innovation_submissions(email);
            CREATE INDEX IF NOT EXISTS idx_innovation_created ON innovation_submissions(created_at);
            CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published, published_at);
            CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id, created_at);
            CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(is_read, created_at);
        `);

        console.log('✅ Indexes created for optimal performance\n');
        console.log('🎉 Database initialization complete!\n');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));

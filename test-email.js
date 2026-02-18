require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }, // Authentication
    debug: false,
    logger: false
});

async function main() {
    try {
        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ Connection verified!');

        console.log('✉️ Sending test email from ' + process.env.SMTP_FROM + ' to rs@um.edu.sa...');
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
            to: 'rs@um.edu.sa',
            subject: 'Test Email Verification',
            text: 'If you receive this email, the SMTP configuration is working correctly.',
            html: '<h3>Test Email</h3><p>SMTP configuration is working correctly.</p>'
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Error occurred:', error);
    }
}

main().catch(console.error);

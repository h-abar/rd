const nodemailer = require('nodemailer');
require('dotenv').config();

// Create SMTP transporter (Mailjet)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'in-v3.mailjet.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    debug: process.env.SMTP_DEBUG === 'true',
    logger: process.env.SMTP_DEBUG === 'true'
});

// Verify connection on startup
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter.verify().then(() => {
        console.log('📧 SMTP (Mailjet) connection verified successfully');
    }).catch(err => {
        console.warn('⚠️  SMTP connection failed (emails will not be sent):', err.message);
    });
} else {
    console.warn('⚠️  SMTP credentials not set — email notifications disabled');
}

// Email templates
const statusLabels = {
    approved: { en: 'Approved', ar: 'مقبول', color: '#10b981', icon: '✅' },
    rejected: { en: 'Rejected', ar: 'مرفوض', color: '#ef4444', icon: '❌' },
    revision: { en: 'Needs Revision', ar: 'يحتاج مراجعة', color: '#f59e0b', icon: '🔄' },
    pending: { en: 'Under Review', ar: 'قيد المراجعة', color: '#3b82f6', icon: '⏳' }
};

function generateEmailTemplate(data) {
    const { submissionId, authorName, title, status, type, reviewerNotes } = data;
    const statusInfo = statusLabels[status] || statusLabels.pending;
    const trackLabel = type === 'research' ? 'Scientific Research / البحث العلمي' : 'Innovation / الابتكار';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                        <!-- Header -->
                        <tr>
                            <td style="background:linear-gradient(135deg,#0a0f1a 0%,#1e293b 100%);padding:32px 40px;text-align:center;">
                                <h1 style="color:#00d4ff;margin:0;font-size:28px;letter-spacing:2px;">SRIF 2026</h1>
                                <p style="color:#94a3b8;margin:8px 0 0;font-size:13px;">Scientific Research & Innovation Forum</p>
                                <p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">منتدى البحث العلمي والابتكار</p>
                            </td>
                        </tr>

                        <!-- Status Banner -->
                        <tr>
                            <td style="padding:0;">
                                <div style="background:${statusInfo.color};padding:16px 40px;text-align:center;">
                                    <span style="color:#ffffff;font-size:20px;font-weight:700;">
                                        ${statusInfo.icon} Submission ${statusInfo.en} / الطلب ${statusInfo.ar}
                                    </span>
                                </div>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding:40px;">
                                <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 20px;">
                                    Dear <strong>${authorName}</strong>,
                                </p>
                                <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
                                    Your submission status has been updated. Here are the details:
                                </p>

                                <!-- Details Card -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin:0 0 24px;">
                                    <tr>
                                        <td style="padding:20px;">
                                            <table width="100%" cellpadding="4" cellspacing="0">
                                                <tr>
                                                    <td style="color:#64748b;font-size:13px;padding:6px 0;width:140px;">Submission ID:</td>
                                                    <td style="color:#0f172a;font-size:14px;font-weight:600;padding:6px 0;">${submissionId}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color:#64748b;font-size:13px;padding:6px 0;">Track / المسار:</td>
                                                    <td style="color:#0f172a;font-size:14px;padding:6px 0;">${trackLabel}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color:#64748b;font-size:13px;padding:6px 0;">Title / العنوان:</td>
                                                    <td style="color:#0f172a;font-size:14px;font-weight:600;padding:6px 0;">${title}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color:#64748b;font-size:13px;padding:6px 0;">Status / الحالة:</td>
                                                    <td style="padding:6px 0;">
                                                        <span style="background:${statusInfo.color};color:#fff;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;">${statusInfo.en} / ${statusInfo.ar}</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                ${reviewerNotes ? `
                                <!-- Reviewer Notes -->
                                <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px;">
                                    <p style="color:#92400e;font-size:13px;margin:0 0 6px;font-weight:600;">Reviewer Notes / ملاحظات المراجع:</p>
                                    <p style="color:#78350f;font-size:14px;margin:0;line-height:1.5;">${reviewerNotes}</p>
                                </div>
                                ` : ''}

                                ${status === 'approved' ? `
                                <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px;">
                                    <p style="color:#065f46;font-size:14px;margin:0;line-height:1.5;">
                                        🎉 Congratulations! Your submission has been accepted. Further details about presentation scheduling will be sent soon.
                                        <br><br>
                                        تهانينا! تم قبول طلبك. سيتم إرسال تفاصيل إضافية حول جدولة العرض قريبًا.
                                    </p>
                                </div>
                                ` : ''}

                                ${status === 'revision' ? `
                                <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px;">
                                    <p style="color:#92400e;font-size:14px;margin:0;line-height:1.5;">
                                        Please review the notes above and resubmit your updated abstract.
                                        <br><br>
                                        يرجى مراجعة الملاحظات أعلاه وإعادة تقديم ملخصك المحدث.
                                    </p>
                                </div>
                                ` : ''}

                                <p style="color:#64748b;font-size:14px;line-height:1.6;margin:24px 0 0;">
                                    If you have any questions, please contact us at: 
                                    <a href="mailto:rs@um.edu.sa" style="color:#0ea5e9;">rs@um.edu.sa</a>
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background:#0f172a;padding:24px 40px;text-align:center;">
                                <p style="color:#64748b;font-size:12px;margin:0;">
                                    © 2026 Scientific Research & Innovation Forum | AlMaarefa University
                                </p>
                                <p style="color:#475569;font-size:11px;margin:8px 0 0;">
                                    منتدى البحث العلمي والابتكار | جامعة المعرفة
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

/**
 * Send status change email notification
 * @param {Object} submission - The submission object from DB
 * @param {string} newStatus - The new status (approved, rejected, revision)
 * @param {string} type - 'research' or 'innovation'
 * @param {string} reviewerNotes - Optional reviewer notes
 */
async function sendStatusEmail(submission, newStatus, type, reviewerNotes) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️  SMTP not configured — skipping email notification');
        return { sent: false, reason: 'SMTP not configured' };
    }

    const authorName = type === 'research' ? submission.author_name : submission.innovator_name;
    const statusInfo = statusLabels[newStatus] || statusLabels.pending;

    const fromName = process.env.SMTP_FROM_NAME || 'SRIF 2026';
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: submission.email,
        subject: `${statusInfo.icon} SRIF 2026 - Submission ${statusInfo.en} | الطلب ${statusInfo.ar}`,
        html: generateEmailTemplate({
            submissionId: submission.submission_id,
            authorName,
            title: submission.title,
            status: newStatus,
            type,
            reviewerNotes
        })
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Status email sent to ${submission.email}: ${info.messageId}`);
        return { sent: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Failed to send email to ${submission.email}:`, error.message);
        return { sent: false, reason: error.message };
    }
}

module.exports = { sendStatusEmail };

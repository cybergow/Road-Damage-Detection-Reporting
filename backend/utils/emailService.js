const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize the Nodemailer transporter.
 * Silently skips if SMTP is not configured.
 */
const initTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      '⚠️  SMTP not configured. Email sending is disabled. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env'
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
};

/**
 * Send an email. Gracefully fails if SMTP is not configured.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email body in HTML
 * @returns {Promise<object|null>} Nodemailer info object or null
 */
const sendEmail = async (to, subject, html) => {
  try {
    if (!transporter) {
      initTransporter();
    }

    if (!transporter) {
      console.warn(`⚠️  Email not sent to ${to} – SMTP not configured`);
      return null;
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@roadguard.ai',
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Email send failed: ${error.message}`);
    return null;
  }
};

// ── Email Templates ─────────────────────────────────────────────────────────────

/**
 * Generate HTML for a report status update notification.
 * @param {string} reportTitle - Title of the report
 * @param {string} newStatus - New status value
 * @param {string} [adminNotes=''] - Optional notes from admin
 * @returns {string} HTML email body
 */
const reportStatusUpdateEmail = (reportTitle, newStatus, adminNotes = '') => {
  const statusColors = {
    pending: '#f59e0b',
    approved: '#10b981',
    in_progress: '#3b82f6',
    resolved: '#22c55e',
    rejected: '#ef4444',
  };

  const color = statusColors[newStatus] || '#6b7280';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 0;">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🛣️ RoadGuard AI</h1>
        <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">Road Damage Detection & Reporting</p>
      </div>
      <div style="padding: 32px; background: #ffffff;">
        <h2 style="color: #1e293b; margin: 0 0 16px 0;">Report Status Updated</h2>
        <p style="color: #475569; line-height: 1.6;">Your report <strong>"${reportTitle}"</strong> has been updated.</p>
        <div style="background: #f1f5f9; border-left: 4px solid ${color}; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">New Status</p>
          <p style="margin: 4px 0 0 0; color: ${color}; font-size: 20px; font-weight: 700; text-transform: uppercase;">${newStatus.replace('_', ' ')}</p>
        </div>
        ${adminNotes ? `
        <div style="background: #fefce8; border: 1px solid #fde68a; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Admin Notes</p>
          <p style="margin: 8px 0 0 0; color: #78350f;">${adminNotes}</p>
        </div>` : ''}
        <p style="color: #475569; line-height: 1.6; margin-top: 24px;">Log in to your RoadGuard AI dashboard to view full details.</p>
      </div>
      <div style="padding: 24px; text-align: center; background: #f1f5f9;">
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} RoadGuard AI. All rights reserved.</p>
      </div>
    </div>
  `;
};

/**
 * Generate HTML for a welcome email.
 * @param {string} userName - Name of the new user
 * @returns {string} HTML email body
 */
const welcomeEmail = (userName) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 0;">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🛣️ RoadGuard AI</h1>
        <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">Road Damage Detection & Reporting</p>
      </div>
      <div style="padding: 32px; background: #ffffff;">
        <h2 style="color: #1e293b; margin: 0 0 16px 0;">Welcome, ${userName}! 👋</h2>
        <p style="color: #475569; line-height: 1.6;">Thank you for joining RoadGuard AI. Together, we can make our roads safer.</p>
        <div style="background: #eff6ff; padding: 24px; border-radius: 12px; margin: 24px 0;">
          <h3 style="color: #1e40af; margin: 0 0 12px 0;">Getting Started</h3>
          <ul style="color: #475569; line-height: 2; padding-left: 20px; margin: 0;">
            <li>📸 Take a photo of road damage</li>
            <li>📍 Submit a report with location details</li>
            <li>🤖 Our AI will analyze the damage automatically</li>
            <li>📊 Track the status of your reports</li>
          </ul>
        </div>
        <p style="color: #475569; line-height: 1.6;">Start by submitting your first road damage report on the dashboard.</p>
      </div>
      <div style="padding: 24px; text-align: center; background: #f1f5f9;">
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} RoadGuard AI. All rights reserved.</p>
      </div>
    </div>
  `;
};

/**
 * Generate HTML for an admin notification about a new report.
 * @param {string} reportTitle - Title of the new report
 * @param {string} reporterName - Name of the user who submitted the report
 * @param {string} severity - Severity level of the report
 * @returns {string} HTML email body
 */
const adminNotificationEmail = (reportTitle, reporterName, severity) => {
  const severityColors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
  const color = severityColors[severity] || '#6b7280';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 0;">
      <div style="background: linear-gradient(135deg, #7c2d12 0%, #dc2626 100%); padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🛣️ RoadGuard AI – Admin Alert</h1>
      </div>
      <div style="padding: 32px; background: #ffffff;">
        <h2 style="color: #1e293b; margin: 0 0 16px 0;">New Report Submitted</h2>
        <p style="color: #475569; line-height: 1.6;">A new road damage report requires your attention.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 120px;">Title</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 600;">${reportTitle}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Reporter</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${reporterName}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Severity</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
              <span style="background: ${color}; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${severity}</span>
            </td>
          </tr>
        </table>
        <p style="color: #475569; line-height: 1.6;">Please log in to the admin dashboard to review and take action.</p>
      </div>
      <div style="padding: 24px; text-align: center; background: #f1f5f9;">
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} RoadGuard AI. All rights reserved.</p>
      </div>
    </div>
  `;
};

module.exports = {
  sendEmail,
  reportStatusUpdateEmail,
  welcomeEmail,
  adminNotificationEmail,
};

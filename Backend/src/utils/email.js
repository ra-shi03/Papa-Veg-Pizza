import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from './logger.js';
import { getBusinessInfo } from '../modules/food/admin/services/businessSettings.service.js';

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    const { emailHost, emailPort, emailUser, emailPass } = config;
    if (!emailHost || !emailUser || !emailPass) {
        logger.warn('Email not configured: EMAIL_HOST, EMAIL_USER, EMAIL_PASS required');
        return null;
    }
    transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort || 587,
        secure: emailPort === 465,
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });
    return transporter;
}

/**
 * Send OTP email for admin forgot password.
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<boolean>} true if sent, false if skipped/failed
 */
export async function sendAdminResetOtpEmail(to, otp) {
    const trans = getTransporter();
    if (!trans) {
        logger.warn('Admin OTP email skipped: SMTP not configured');
        return false;
    }
    const from = config.emailFrom || config.emailUser;
    const { companyName } = await getBusinessInfo().catch(() => ({ companyName: '' }));
    const brand = companyName ? `${companyName} Admin` : 'Admin';
    const subject = `Your password reset code – ${brand}`;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 480px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #111;">Password reset code</h2>
  <p>Use the code below to reset your admin password. It is valid for 10 minutes.</p>
  <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; background: #f5f5f5; padding: 12px 16px; border-radius: 8px;">${otp}</p>
  <p style="color: #666; font-size: 14px;">If you did not request this, you can ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">${brand}</p>
</body>
</html>`;
    const text = `Your password reset code is: ${otp}. It is valid for 10 minutes. If you did not request this, ignore this email.`;

    try {
        await trans.sendMail({
            from: typeof from === 'string' && from.includes('<') ? from : `${brand} <${from}>`,
            to,
            subject,
            text,
            html
        });
        logger.info(`Admin reset OTP email sent to ${to}`);
        return true;
    } catch (err) {
        logger.error(`Failed to send admin OTP email to ${to}:`, err.message);
        return false;
    }
}

let senderOverride = null;
/** Tests replace the real sender; production uses SMTP. */
export function setEmailSenderForTests(fn) {
    senderOverride = fn;
}

/**
 * Send a plain email (used for bulk order updates). Never throws: returns false when SMTP is not configured or fails.
 * @param {{to: string, subject: string, text: string}} mail
 */
export async function sendEmail({ to, subject, text }) {
    if (senderOverride) return senderOverride({ to, subject, text });
    const trans = getTransporter();
    if (!trans || !to) return false;
    const from = config.emailFrom || config.emailUser;
    const { companyName } = await getBusinessInfo().catch(() => ({ companyName: '' }));
    const brand = companyName || 'Papa Veg Pizza';
    const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 520px; margin: 0 auto; padding: 20px;">${esc(text).split('\n').map((l) => `<p style="margin:0 0 8px">${l}</p>`).join('')}<hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="color:#999;font-size:12px">${esc(brand)}</p></div>`;
    try {
        await trans.sendMail({ from: typeof from === 'string' && from.includes('<') ? from : `${brand} <${from}>`, to, subject, text, html });
        return true;
    } catch (err) {
        logger.error(`Failed to send email to ${to}: ${err.message}`);
        return false;
    }
}

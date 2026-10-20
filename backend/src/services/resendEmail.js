import { config } from '../config/env.js';

export async function sendPasswordResetEmail(to, resetUrl) {
  if (!config.resend.apiKey || !config.resend.fromEmail) {
    throw new Error('Resend email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${config.resend.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.resend.fromEmail,
      to: [to],
      subject: 'Reset your password',
      text: `Use this link to reset your password. It expires in one hour:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Use this link to reset your password. It expires in one hour:</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend rejected the password reset email (${response.status}).`);
  }
}

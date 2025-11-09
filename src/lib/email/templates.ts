/**
 * Email Templates
 * Reusable email template components and utilities
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Base email template wrapper
 */
export function createEmailTemplate(
  title: string,
  content: string,
  headerColor: string = '#3b82f6'
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: ${headerColor};
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
            background-color: white;
          }
          .content h2 {
            color: #1f2937;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .content p {
            color: #4b5563;
            margin: 15px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background-color: ${headerColor};
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
            transition: background-color 0.3s;
          }
          .button:hover {
            opacity: 0.9;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .footer {
            background-color: #f9fafb;
            text-align: center;
            padding: 30px 20px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .footer a {
            color: #3b82f6;
            text-decoration: none;
          }
          .divider {
            border: 0;
            height: 1px;
            background-color: #e5e7eb;
            margin: 30px 0;
          }
          .info-box {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .success-box {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .code {
            background-color: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 14px;
            color: #1f2937;
          }
          .link {
            color: #3b82f6;
            word-break: break-all;
          }
          ul {
            padding-left: 20px;
          }
          li {
            margin: 10px 0;
            color: #4b5563;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PACSUM ERP</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} PACSUM ERP. All rights reserved.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}">Visit Website</a> •
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/support">Support</a> •
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy">Privacy Policy</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Create a button HTML
 */
export function createButton(text: string, url: string, color: string = '#3b82f6'): string {
  return `
    <div class="button-container">
      <a href="${url}" class="button" style="background-color: ${color};">
        ${text}
      </a>
    </div>
  `;
}

/**
 * Create an info box
 */
export function createInfoBox(content: string): string {
  return `<div class="info-box">${content}</div>`;
}

/**
 * Create a warning box
 */
export function createWarningBox(content: string): string {
  return `<div class="warning-box"><strong>⚠️ Warning:</strong> ${content}</div>`;
}

/**
 * Create a success box
 */
export function createSuccessBox(content: string): string {
  return `<div class="success-box"><strong>✓ Success:</strong> ${content}</div>`;
}

/**
 * Create a link section
 */
export function createLinkSection(label: string, url: string): string {
  return `
    <p>${label}</p>
    <p class="link">${url}</p>
  `;
}

/**
 * Email verification template
 */
export function emailVerificationTemplate(firstName: string, verificationUrl: string): EmailTemplate {
  const content = `
    <h2>Welcome, ${firstName}!</h2>
    <p>Thank you for signing up for PACSUM ERP. To complete your registration, please verify your email address.</p>
    ${createButton('Verify Email Address', verificationUrl)}
    ${createLinkSection('Or copy and paste this link into your browser:', verificationUrl)}
    ${createInfoBox('This link will expire in 24 hours.')}
    <p>If you didn't create an account with PACSUM ERP, you can safely ignore this email.</p>
  `;

  return {
    subject: 'Verify Your Email Address - PACSUM ERP',
    html: createEmailTemplate('Verify Your Email', content),
    text: `Welcome, ${firstName}! Please verify your email by visiting: ${verificationUrl}`,
  };
}

/**
 * Password reset template
 */
export function passwordResetTemplate(firstName: string, resetUrl: string): EmailTemplate {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hi ${firstName},</p>
    <p>We received a request to reset your password for your PACSUM ERP account.</p>
    ${createButton('Reset Password', resetUrl)}
    ${createLinkSection('Or copy and paste this link into your browser:', resetUrl)}
    ${createInfoBox('This link will expire in 1 hour.')}
    ${createWarningBox('If you didn\'t request a password reset, please ignore this email. Your password will remain unchanged.')}
  `;

  return {
    subject: 'Reset Your Password - PACSUM ERP',
    html: createEmailTemplate('Password Reset', content),
    text: `Hi ${firstName}, reset your password by visiting: ${resetUrl}`,
  };
}

/**
 * Welcome email template
 */
export function welcomeEmailTemplate(firstName: string): EmailTemplate {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`;

  const content = `
    <h2>🎉 Welcome to PACSUM ERP!</h2>
    <p>Hi ${firstName},</p>
    <p>Your email has been verified and your account is now active!</p>
    <p>You can now access all features of PACSUM ERP:</p>
    <ul>
      <li>Manage clients and transactions</li>
      <li>Generate financial reports</li>
      <li>Upload and organize documents</li>
      <li>Collaborate with your team</li>
    </ul>
    ${createButton('Go to Dashboard', loginUrl, '#10b981')}
    <hr class="divider">
    <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
  `;

  return {
    subject: 'Welcome to PACSUM ERP! 🎉',
    html: createEmailTemplate('Welcome!', content, '#10b981'),
    text: `Welcome to PACSUM ERP, ${firstName}! Your account is now active.`,
  };
}

/**
 * MFA enabled template
 */
export function mfaEnabledTemplate(firstName: string): EmailTemplate {
  const content = `
    <h2>🔒 Security Update</h2>
    <p>Hi ${firstName},</p>
    ${createSuccessBox('Two-factor authentication has been successfully enabled on your account.')}
    <p>Your account is now more secure. You'll need to enter a verification code from your authenticator app each time you log in.</p>
    ${createWarningBox('Make sure to save your recovery codes in a safe place. You\'ll need them if you lose access to your authenticator app.')}
    <p>If you didn't enable two-factor authentication, please contact our support team immediately.</p>
  `;

  return {
    subject: 'Two-Factor Authentication Enabled - PACSUM ERP',
    html: createEmailTemplate('Security Update', content, '#10b981'),
    text: `Hi ${firstName}, two-factor authentication has been enabled on your PACSUM ERP account.`,
  };
}

/**
 * Password changed template
 */
export function passwordChangedTemplate(firstName: string): EmailTemplate {
  const content = `
    <h2>Password Changed</h2>
    <p>Hi ${firstName},</p>
    ${createSuccessBox('Your PACSUM ERP account password was successfully changed.')}
    ${createWarningBox('If you didn\'t make this change, please contact our support team immediately to secure your account.')}
  `;

  return {
    subject: 'Password Changed - PACSUM ERP',
    html: createEmailTemplate('Password Changed', content),
    text: `Hi ${firstName}, your PACSUM ERP password was changed.`,
  };
}

/**
 * Login alert template
 */
export function loginAlertTemplate(
  firstName: string,
  ipAddress: string,
  userAgent: string,
  location?: string
): EmailTemplate {
  const content = `
    <h2>New Login to Your Account</h2>
    <p>Hi ${firstName},</p>
    <p>We detected a new login to your PACSUM ERP account:</p>
    ${createInfoBox(`
      <strong>Time:</strong> ${new Date().toLocaleString()}<br>
      <strong>IP Address:</strong> ${ipAddress}<br>
      <strong>Device:</strong> ${userAgent}<br>
      ${location ? `<strong>Location:</strong> ${location}<br>` : ''}
    `)}
    ${createWarningBox('If this wasn\'t you, please change your password immediately and enable two-factor authentication.')}
  `;

  return {
    subject: 'New Login to Your Account - PACSUM ERP',
    html: createEmailTemplate('Login Alert', content, '#f59e0b'),
    text: `Hi ${firstName}, new login detected from IP: ${ipAddress}`,
  };
}

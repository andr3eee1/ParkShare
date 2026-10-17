import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;
export const DEFAULT_FROM_EMAIL = process.env.FROM_EMAIL || 'ParkShare <noreply@park-share.ro>';
export const APP_URL = process.env.APP_URL || 'https://park-share.ro';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Generic email sender using Resend.
 * In development or when RESEND_API_KEY is not configured, logs the email instead of failing.
 */
export async function sendEmail(options: SendEmailOptions) {
  const from = options.from || DEFAULT_FROM_EMAIL;

  if (!apiKey || apiKey === 're_your_api_key_here') {
    console.log(`\x1b[33m[Resend: Dev/Mock]\x1b[0m API key not configured. Mocking email send:`);
    console.log(`  To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
    console.log(`  From: ${from}`);
    console.log(`  Subject: ${options.subject}`);
    return { id: 'mock-email-id', mock: true };
  }

  try {
    const response = await resend!.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (response.error) {
      console.error('[Resend Error]', response.error);
      throw new Error(`Resend error: ${response.error.message}`);
    }

    console.log(`\x1b[32m[Resend Success]\x1b[0m Email sent to ${options.to}. ID: ${response.data?.id}`);
    return response.data;
  } catch (error: any) {
    console.error('[Resend Exception]', error);
    throw error;
  }
}

/**
 * Shared HTML Master Layout with the ParkShare logo, responsive card, and verified footer.
 */
function renderEmailLayout(params: {
  previewText?: string;
  badge?: { text: string; bg?: string; color?: string };
  title: string;
  subtitle?: string;
  bodyContent: string;
}): string {
  const badgeHtml = params.badge
    ? `
    <div style="text-align: center; margin-bottom: 14px;">
      <span style="display: inline-block; background-color: ${params.badge.bg || '#eff6ff'}; color: ${params.badge.color || '#1d4ed8'}; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px;">
        ${params.badge.text}
      </span>
    </div>`
    : '';

  const subtitleHtml = params.subtitle
    ? `<p style="font-size: 15px; line-height: 1.5; color: #64748b; margin: 0 0 20px 0; text-align: center;">${params.subtitle}</p>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${params.previewText ? `<meta name="description" content="${params.previewText}">` : ''}
  <title>${params.title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto;">
    <!-- Brand Header -->
    <tr>
      <td align="center" style="padding-bottom: 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: middle;">
              <img src="https://park-share.ro/assets/logo-mark.png" width="44" height="44" alt="ParkShare" style="display: block; border-radius: 10px; border: 0; background: #2563eb;" onerror="this.style.display='none'" />
            </td>
            <td style="vertical-align: middle; padding-left: 12px;">
              <span style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">Park<span style="color: #2563eb;">Share</span></span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Card -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); padding: 36px 32px;">
          <tr>
            <td>
              ${badgeHtml}
              <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; text-align: center;">${params.title}</h1>
              ${subtitleHtml}

              <!-- Content Slot -->
              <div style="font-size: 15px; line-height: 1.6; color: #334155;">
                ${params.bodyContent}
              </div>

              <!-- Footer Signature -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 36px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
                <tr>
                  <td align="center" style="font-size: 12px; line-height: 1.6; color: #94a3b8;">
                    <p style="margin: 0 0 6px 0; font-weight: 600; color: #64748b;">
                      🅿️ ParkShare &bull; Smart Community Parking
                    </p>
                    <p style="margin: 0 0 6px 0;">
                      <a href="${APP_URL}" style="color: #2563eb; text-decoration: none; font-weight: 500;">park-share.ro</a> &bull;
                      <a href="mailto:support@park-share.ro" style="color: #2563eb; text-decoration: none; font-weight: 500;">support@park-share.ro</a>
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                      Secured with Resend &bull; Bucharest, Romania
                    </p>
                  </td>
                </tr>
              </table>
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
 * Helper to render high-contrast 6-digit OTP code container.
 */
function renderOtpBox(code: string, label = 'VERIFICATION CODE', validMinutes = 10): string {
  return `
    <div style="background-color: #f0f7ff; border: 2px dashed #93c5fd; border-radius: 12px; padding: 22px 16px; text-align: center; margin: 24px 0;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; font-weight: 700; margin-bottom: 6px;">
        ${label}
      </div>
      <div style="font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #1e3a8a; margin: 6px 0;">
        ${code}
      </div>
      <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
        Expires in <strong>${validMinutes} minutes</strong> &bull; Do not share this code
      </div>
    </div>
  `;
}

/**
 * Helper to render standard call-to-action button.
 */
function renderButton(text: string, url: string): string {
  return `
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${url}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 30px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.25);">
        ${text}
      </a>
    </div>
  `;
}

// ==========================================
// 1. ACCOUNT CONFIRMATION / EMAIL VERIFICATION
// ==========================================
export async function sendAccountVerificationEmail(params: {
  email: string;
  firstName: string;
  code: string;
  verifyUrl?: string;
}) {
  const verifyLink = params.verifyUrl || `${APP_URL}/verify-email?email=${encodeURIComponent(params.email)}&code=${params.code}`;

  const html = renderEmailLayout({
    previewText: `Your ParkShare verification code is ${params.code}`,
    badge: { text: 'Account Verification', bg: '#dbeafe', color: '#1e40af' },
    title: 'Confirm your email address',
    subtitle: `Welcome, ${params.firstName}! Please verify your account to unlock full access.`,
    bodyContent: `
      <p>Thank you for signing up for ParkShare! To complete your registration and secure your profile, enter the 6-digit confirmation code below in the app:</p>
      
      ${renderOtpBox(params.code, 'ACCOUNT VERIFICATION CODE', 15)}
      
      <p style="text-align: center; margin-bottom: 8px;">Or verify instantly with a single tap:</p>
      ${renderButton('Verify My Account', verifyLink)}

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 12px 16px; margin-top: 24px; font-size: 13px; color: #64748b; border: 1px solid #e2e8f0;">
        <strong>Didn't create an account?</strong> If you did not sign up for ParkShare, you can safely ignore this email.
      </div>
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `${params.code} is your ParkShare confirmation code`,
    html,
    text: `Hello ${params.firstName},\n\nYour ParkShare confirmation code is: ${params.code}\n\nOr click here to verify: ${verifyLink}\n\nThis code expires in 15 minutes.`,
  });
}

// ==========================================
// 2. PASSWORD RESET REQUEST
// ==========================================
export async function sendPasswordResetEmail(params: {
  email: string;
  firstName: string;
  code: string;
  resetUrl?: string;
}) {
  const resetLink = params.resetUrl || `${APP_URL}/reset-password?email=${encodeURIComponent(params.email)}&code=${params.code}`;

  const html = renderEmailLayout({
    previewText: `Reset your ParkShare password with code ${params.code}`,
    badge: { text: 'Security Request', bg: '#fef3c7', color: '#92400e' },
    title: 'Password Reset Request',
    subtitle: `Hi ${params.firstName}, we received a request to reset your password.`,
    bodyContent: `
      <p>Enter the 6-digit PIN below in the ParkShare app to choose a new password:</p>

      ${renderOtpBox(params.code, 'PASSWORD RESET PIN', 15)}

      <p style="text-align: center; margin-bottom: 8px;">Alternatively, reset your password directly online:</p>
      ${renderButton('Reset Password', resetLink)}

      <div style="background-color: #fffbeb; border-radius: 8px; padding: 14px 16px; margin-top: 24px; font-size: 13px; color: #78350f; border: 1px solid #fde68a;">
        <strong>⚠️ Security Advisory:</strong> If you did NOT request this password reset, please ignore this email or update your password immediately if you suspect unauthorized access.
      </div>
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `Password Reset Code: ${params.code}`,
    html,
    text: `Hello ${params.firstName},\n\nYour ParkShare password reset code is: ${params.code}\n\nOr reset directly: ${resetLink}\n\nThis code expires in 15 minutes. If you did not request this, please ignore.`,
  });
}

// ==========================================
// 3. PASSWORD CHANGED CONFIRMATION
// ==========================================
export async function sendPasswordChangedAlertEmail(params: {
  email: string;
  firstName: string;
}) {
  const html = renderEmailLayout({
    previewText: 'Your ParkShare password was updated successfully',
    badge: { text: 'Security Notice', bg: '#ecfdf5', color: '#047857' },
    title: 'Password Successfully Changed',
    subtitle: `Hello ${params.firstName}, your account password has been updated.`,
    bodyContent: `
      <p>This is a confirmation that your ParkShare account password was recently updated at <strong>${new Date().toUTCString()}</strong>.</p>
      
      <p>If you made this change, no further action is required.</p>

      <div style="background-color: #fef2f2; border-radius: 8px; padding: 14px 16px; margin-top: 24px; font-size: 13px; color: #991b1b; border: 1px solid #fecaca;">
        <strong>Didn't make this change?</strong> Your account may be compromised. Please contact our security support team immediately at <a href="mailto:security@park-share.ro" style="color: #dc2626; font-weight: 600;">security@park-share.ro</a>.
      </div>
    `,
  });

  return sendEmail({
    to: params.email,
    subject: 'Security Alert: Your ParkShare password was changed',
    html,
    text: `Hello ${params.firstName},\n\nYour ParkShare account password was just successfully changed. If you did not perform this action, please contact security@park-share.ro immediately.`,
  });
}

// ==========================================
// 4. TWO-FACTOR AUTHENTICATION (2FA) LOGIN CODE
// ==========================================
export async function send2FACodeEmail(params: {
  email: string;
  firstName: string;
  code: string;
}) {
  const html = renderEmailLayout({
    previewText: `${params.code} is your 2FA authentication code`,
    badge: { text: 'Two-Factor Authentication', bg: '#ede9fe', color: '#6d28d9' },
    title: 'Login Authentication Code',
    subtitle: `Hello ${params.firstName}, someone is signing in to your ParkShare account.`,
    bodyContent: `
      <p>Enter the security verification code below to authorize your sign-in attempt:</p>

      ${renderOtpBox(params.code, '2FA LOGIN CODE', 10)}

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 14px 16px; margin-top: 24px; font-size: 13px; color: #475569; border: 1px solid #e2e8f0;">
        <strong>Security Notice:</strong> This code was generated for a login attempt at <strong>${new Date().toUTCString()}</strong>. If this wasn't you, someone may have your password. We recommend resetting your password immediately.
      </div>
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `${params.code} is your ParkShare 2FA login code`,
    html,
    text: `Hello ${params.firstName},\n\nYour ParkShare 2FA login code is: ${params.code}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
  });
}

// ==========================================
// 5. WELCOME EMAIL
// ==========================================
export async function sendWelcomeEmail(user: { email: string; firstName: string }) {
  const html = renderEmailLayout({
    previewText: 'Welcome to ParkShare - the smart community parking network',
    badge: { text: 'Welcome', bg: '#dcfce7', color: '#166534' },
    title: `Welcome to ParkShare, ${user.firstName}! 🎉`,
    subtitle: 'Your smart community parking account is ready.',
    bodyContent: `
      <p>Thank you for joining <strong>ParkShare</strong> — Romania's premier community parking network.</p>

      <div style="background-color: #f0f7ff; border-radius: 12px; padding: 18px 20px; margin: 20px 0; border: 1px solid #bfdbfe;">
        <p style="margin: 0; font-weight: 700; color: #1e40af; font-size: 14px;">With your new account, you can:</p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
          <li><strong>Find & Reserve:</strong> Secure private parking spots instantly on our interactive live map.</li>
          <li><strong>Monetize:</strong> List your unused parking space and earn guaranteed passive income.</li>
          <li><strong>Trust & Safety:</strong> Enjoy automatic deposits, dynamic trust ratings, and verified drivers.</li>
        </ul>
      </div>

      ${renderButton('Explore Parking Spots', APP_URL)}
    `,
  });

  return sendEmail({
    to: user.email,
    subject: 'Welcome to ParkShare!',
    html,
    text: `Hello ${user.firstName},\n\nWelcome to ParkShare! Start reserving spots or listing your parking spaces today.\n\nVisit: ${APP_URL}`,
  });
}

// ==========================================
// 6. BOOKING CONFIRMATION (DRIVER)
// ==========================================
export async function sendBookingConfirmationEmail(params: {
  email: string;
  firstName: string;
  spotName: string;
  startTime: Date;
  deposit: number;
  reservationId: string;
}) {
  const formattedDate = new Intl.DateTimeFormat('ro-RO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Bucharest',
  }).format(params.startTime);

  const html = renderEmailLayout({
    previewText: `Booking confirmed for ${params.spotName}`,
    badge: { text: 'Booking Active', bg: '#dcfce7', color: '#166534' },
    title: 'Spot Reserved Successfully',
    subtitle: `Hi ${params.firstName}, your parking reservation is active!`,
    bodyContent: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; font-size: 14px;">
        <tr style="background-color: #f8fafc;">
          <td style="padding: 12px 16px; color: #64748b; font-weight: 500;">Parking Space</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #0f172a;">${params.spotName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #64748b; font-weight: 500; border-top: 1px solid #f1f5f9;">Start Time</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #0f172a; border-top: 1px solid #f1f5f9;">${formattedDate}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 12px 16px; color: #64748b; font-weight: 500; border-top: 1px solid #f1f5f9;">Security Deposit Held</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #2563eb; border-top: 1px solid #f1f5f9;">${params.deposit.toFixed(2)} RON</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #64748b; font-weight: 500; border-top: 1px solid #f1f5f9;">Booking Reference</td>
          <td style="padding: 12px 16px; text-align: right; font-family: monospace; font-size: 13px; color: #475569; border-top: 1px solid #f1f5f9;">${params.reservationId.slice(0, 8).toUpperCase()}</td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #64748b; text-align: center;">
        Remember to click <strong>"End Parking"</strong> in the app when you leave to release your deposit.
      </p>

      ${renderButton('View Booking in App', `${APP_URL}/bookings`)}
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `Booking Confirmed: ${params.spotName}`,
    html,
    text: `Booking confirmed for ${params.spotName} starting ${formattedDate}. Security deposit held: ${params.deposit.toFixed(2)} RON.`,
  });
}

// ==========================================
// 7. SPOT BOOKED NOTIFICATION (HOST)
// ==========================================
export async function sendHostSpotBookedEmail(params: {
  hostEmail: string;
  hostName: string;
  driverName: string;
  spotName: string;
  startTime: Date;
  hourlyPrice: number;
}) {
  const formattedDate = new Intl.DateTimeFormat('ro-RO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Bucharest',
  }).format(params.startTime);

  const html = renderEmailLayout({
    previewText: `Your parking spot ${params.spotName} was just booked!`,
    badge: { text: 'New Reservation', bg: '#ecfdf5', color: '#059669' },
    title: 'Your Spot Was Booked! 🚗',
    subtitle: `Great news, ${params.hostName}! A driver just reserved your spot.`,
    bodyContent: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; font-size: 14px;">
        <tr style="background-color: #f8fafc;">
          <td style="padding: 12px 16px; color: #64748b; font-weight: 500;">Spot</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #0f172a;">${params.spotName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #64748b; font-weight: 500; border-top: 1px solid #f1f5f9;">Driver</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #0f172a; border-top: 1px solid #f1f5f9;">${params.driverName}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 12px 16px; color: #64748b; font-weight: 500; border-top: 1px solid #f1f5f9;">Start Time</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #0f172a; border-top: 1px solid #f1f5f9;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #64748b; font-weight: 500; border-top: 1px solid #f1f5f9;">Rate</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #16a34a; border-top: 1px solid #f1f5f9;">${params.hourlyPrice.toFixed(2)} RON / hr</td>
        </tr>
      </table>

      ${renderButton('View Host Dashboard', `${APP_URL}/provider`)}
    `,
  });

  return sendEmail({
    to: params.hostEmail,
    subject: `New Booking: ${params.spotName} has been reserved`,
    html,
    text: `Hello ${params.hostName},\n\nYour spot "${params.spotName}" was just booked by ${params.driverName} starting ${formattedDate} at ${params.hourlyPrice} RON/hr.`,
  });
}

// ==========================================
// 8. BOOKING COMPLETED RECEIPT (DRIVER)
// ==========================================
export async function sendBookingCompletedDriverEmail(params: {
  email: string;
  firstName: string;
  spotName: string;
  totalCost: number;
  refundedDeposit: number;
  durationMinutes: number;
}) {
  const durationText = params.durationMinutes < 60
    ? `${Math.max(1, Math.round(params.durationMinutes))} min`
    : `${(params.durationMinutes / 60).toFixed(1)} hrs`;

  const html = renderEmailLayout({
    previewText: `Receipt for your parking at ${params.spotName}`,
    badge: { text: 'Session Completed', bg: '#f1f5f9', color: '#475569' },
    title: 'Parking Session Completed',
    subtitle: `Thanks for using ParkShare, ${params.firstName}! Here is your receipt.`,
    bodyContent: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; font-size: 14px;">
        <tr style="background-color: #f8fafc;">
          <td style="padding: 12px 16px; color: #64748b; font-weight: 500;">Spot</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #0f172a;">${params.spotName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #64748b; font-weight: 500; border-top: 1px solid #f1f5f9;">Duration</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #0f172a; border-top: 1px solid #f1f5f9;">${durationText}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 12px 16px; color: #64748b; font-weight: 500; border-top: 1px solid #f1f5f9;">Deposit Released</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #16a34a; border-top: 1px solid #f1f5f9;">+${params.refundedDeposit.toFixed(2)} RON</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #64748b; font-weight: 500; border-top: 1px solid #f1f5f9;">Total Parking Fee</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #0f172a; border-top: 1px solid #f1f5f9;">${params.totalCost.toFixed(2)} RON</td>
        </tr>
      </table>

      ${renderButton('Leave a Review', `${APP_URL}/bookings`)}
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `Parking Receipt: ${params.spotName} (${params.totalCost.toFixed(2)} RON)`,
    html,
    text: `Your parking at ${params.spotName} has concluded. Duration: ${durationText}. Total fee: ${params.totalCost.toFixed(2)} RON. Deposit released.`,
  });
}

// ==========================================
// 9. HOST EARNINGS CREDITED (HOST)
// ==========================================
export async function sendHostEarningsEmail(params: {
  hostEmail: string;
  hostName: string;
  spotName: string;
  earnings: number;
}) {
  const html = renderEmailLayout({
    previewText: `You earned ${params.earnings.toFixed(2)} RON on ParkShare!`,
    badge: { text: 'Earnings Credited', bg: '#dcfce7', color: '#15803d' },
    title: 'Payout Added to Wallet! 💰',
    subtitle: `Hi ${params.hostName}, your spot earnings have been credited.`,
    bodyContent: `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
        <div style="font-size: 13px; color: #166534; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Credited to Wallet</div>
        <div style="font-size: 36px; font-weight: 800; color: #15803d; margin: 8px 0;">+${params.earnings.toFixed(2)} RON</div>
        <div style="font-size: 13px; color: #4ade80;">Spot: <strong>${params.spotName}</strong></div>
      </div>

      ${renderButton('View Wallet Balance', `${APP_URL}/wallet`)}
    `,
  });

  return sendEmail({
    to: params.hostEmail,
    subject: `💰 You earned ${params.earnings.toFixed(2)} RON from ${params.spotName}`,
    html,
    text: `You just earned ${params.earnings.toFixed(2)} RON from parking on "${params.spotName}". The funds have been added to your ParkShare wallet balance.`,
  });
}

// ==========================================
// 10. WALLET DEPOSIT RECEIPT
// ==========================================
export async function sendWalletDepositEmail(params: {
  email: string;
  firstName: string;
  amount: number;
  newBalance: number;
}) {
  const html = renderEmailLayout({
    previewText: `Deposit confirmed: +${params.amount.toFixed(2)} RON added`,
    badge: { text: 'Wallet Top-Up', bg: '#dbeafe', color: '#1d4ed8' },
    title: 'Wallet Deposit Confirmed',
    subtitle: `Hello ${params.firstName}, your top-up was processed successfully.`,
    bodyContent: `
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
        <div style="font-size: 13px; color: #1e40af; font-weight: 600; text-transform: uppercase;">Amount Added</div>
        <div style="font-size: 36px; font-weight: 800; color: #1e3a8a; margin: 8px 0;">+${params.amount.toFixed(2)} RON</div>
        <div style="font-size: 14px; color: #3b82f6;">Updated Balance: <strong>${params.newBalance.toFixed(2)} RON</strong></div>
      </div>

      ${renderButton('Open Wallet', `${APP_URL}/wallet`)}
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `Wallet Top-Up Confirmed (+${params.amount.toFixed(2)} RON)`,
    html,
    text: `Hello ${params.firstName},\n\nYour deposit of ${params.amount.toFixed(2)} RON has been added to your wallet. Your new balance is ${params.newBalance.toFixed(2)} RON.`,
  });
}

// ==========================================
// 11. PASS ACTIVATION RECEIPT
// ==========================================
export async function sendPassActivatedEmail(params: {
  email: string;
  firstName: string;
  passKind: string;
  activeUntil: Date;
}) {
  const expiryFormatted = new Intl.DateTimeFormat('ro-RO', {
    dateStyle: 'medium',
  }).format(params.activeUntil);

  const passNames: Record<string, string> = {
    'commuter': 'Commuter Pass (Mon-Fri)',
    'night-owl': 'Night-Owl Pass (Overnight)',
    'park-plus': 'ParkPlus All-Access Pass',
  };
  const passTitle = passNames[params.passKind] || params.passKind;

  const html = renderEmailLayout({
    previewText: `Your ${passTitle} is now active`,
    badge: { text: 'Membership Pass', bg: '#f3e8ff', color: '#7e22ce' },
    title: 'Parking Pass Activated! 🎟️',
    subtitle: `Congratulations ${params.firstName}, your pass is ready to use.`,
    bodyContent: `
      <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 22px; margin: 20px 0;">
        <h3 style="margin: 0 0 6px 0; color: #6b21a8; font-size: 18px;">${passTitle}</h3>
        <p style="margin: 0; color: #7e22ce; font-size: 14px;">Valid until: <strong>${expiryFormatted}</strong></p>
      </div>

      ${renderButton('Explore Pass Spots', `${APP_URL}/passes`)}
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `Pass Activated: ${passTitle}`,
    html,
    text: `Your ${passTitle} has been activated and is valid until ${expiryFormatted}.`,
  });
}

// ==========================================
// 12. MODERATION & TRUST SCORE NOTICES
// ==========================================
export async function sendModerationNoticeEmail(params: {
  email: string;
  firstName: string;
  action: string;
  reason?: string;
  suspendedUntil?: Date | null;
}) {
  const isSuspension = params.action === 'SUSPEND' || params.action === 'AUTO_SUSPEND';
  const isBan = params.action === 'BAN';
  const isWarning = params.action === 'WARN' || params.action === 'AUTO_WARN';

  const title = isBan
    ? 'Account Permanently Suspended'
    : isSuspension
    ? 'Temporary Account Suspension'
    : 'Trust & Safety Warning';

  const badgeColor = isBan ? '#7f1d1d' : isSuspension ? '#991b1b' : '#92400e';
  const badgeBg = isBan ? '#fee2e2' : isSuspension ? '#fee2e2' : '#fef3c7';

  const html = renderEmailLayout({
    previewText: `Important Trust & Safety Notice: ${title}`,
    badge: { text: 'Trust & Safety', bg: badgeBg, color: badgeColor },
    title,
    subtitle: `Hello ${params.firstName}, please review this moderation update regarding your account.`,
    bodyContent: `
      <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 18px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-weight: 700; color: #9f1239;">Reason for this action:</p>
        <p style="margin: 0; color: #881337; font-size: 14px;">${params.reason || 'Violation of community trust guidelines or repeated low reviews.'}</p>
        ${
          params.suspendedUntil
            ? `<p style="margin: 12px 0 0 0; font-size: 13px; color: #be123c;">Suspension expires: <strong>${new Intl.DateTimeFormat('ro-RO', { dateStyle: 'medium', timeStyle: 'short' }).format(params.suspendedUntil)}</strong></p>`
            : ''
        }
      </div>

      <p style="font-size: 14px; color: #475569;">
        If you believe this action was applied in error, you may submit a formal appeal through your profile dashboard.
      </p>

      ${renderButton('Submit an Appeal', `${APP_URL}/standing`)}
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `Important Notice: ${title}`,
    html,
    text: `Hello ${params.firstName},\n\nA moderation action (${params.action}) was applied to your ParkShare account.\nReason: ${params.reason || 'Community guidelines violation'}.\n\nYou can review or appeal this decision at ${APP_URL}/standing`,
  });
}

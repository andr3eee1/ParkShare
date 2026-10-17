import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;
export const DEFAULT_FROM_EMAIL = process.env.FROM_EMAIL || 'ParkShare <noreply@park-share.ro>';

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
 * Sends a welcome email to newly registered users.
 */
export async function sendWelcomeEmail(user: { email: string; firstName: string }) {
  const subject = 'Welcome to ParkShare!';
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { margin-bottom: 24px; text-align: center; }
    .logo { font-size: 26px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; }
    h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; }
    p { font-size: 15px; line-height: 1.6; color: #475569; }
    .highlight-box { background-color: #eff6ff; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #bfdbfe; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 12px; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">🅿️ ParkShare</div>
    </div>
    <h1>Welcome aboard, ${user.firstName}!</h1>
    <p>Thank you for joining <strong>ParkShare</strong> — the smart community parking network in Romania.</p>
    <div class="highlight-box">
      <p style="margin: 0; font-weight: 600; color: #1e40af;">With your account you can:</p>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #1e3a8a;">
        <li>Find and reserve private parking spots in seconds</li>
        <li>List your own parking spot and monetize it effortlessly</li>
        <li>Enjoy automated security deposits with trust scoring</li>
      </ul>
    </div>
    <p>Get started by browsing available parking spaces or adding your vehicle profile in the app.</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="https://park-share.ro" class="btn">Open ParkShare</a>
    </div>
    <div class="footer">
      Sent with ❤️ from ParkShare &bull; <a href="https://park-share.ro" style="color: #64748b;">park-share.ro</a><br/>
      If you did not sign up for this account, you can safely ignore this email.
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: user.email,
    subject,
    html,
    text: `Hello ${user.firstName},\n\nWelcome to ParkShare! Start reserving spots or listing your parking spaces today.\n\nVisit: https://park-share.ro`,
  });
}

/**
 * Sends a confirmation email when a booking is created.
 */
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

  const subject = `Booking Confirmed: ${params.spotName}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { margin-bottom: 20px; text-align: center; }
    .logo { font-size: 26px; font-weight: 800; color: #2563eb; }
    .badge { display: inline-block; background-color: #dcfce7; color: #166534; font-size: 13px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; }
    h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 16px 0 8px 0; }
    p { font-size: 15px; line-height: 1.6; color: #475569; }
    .detail-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
    .detail-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .detail-label { color: #64748b; font-weight: 500; }
    .detail-value { text-align: right; font-weight: 600; color: #0f172a; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">🅿️ ParkShare</div>
    </div>
    <div style="text-align: center;">
      <span class="badge">Booking Active</span>
      <h1>Spot Confirmed</h1>
      <p>Hi ${params.firstName}, your parking spot is booked and ready for you.</p>
    </div>
    
    <table class="detail-table">
      <tr>
        <td class="detail-label">Parking Spot</td>
        <td class="detail-value">${params.spotName}</td>
      </tr>
      <tr>
        <td class="detail-label">Start Time</td>
        <td class="detail-value">${formattedDate}</td>
      </tr>
      <tr>
        <td class="detail-label">Security Deposit</td>
        <td class="detail-value">${params.deposit.toFixed(2)} RON</td>
      </tr>
      <tr>
        <td class="detail-label">Booking ID</td>
        <td class="detail-value" style="font-family: monospace; font-size: 12px;">${params.reservationId.slice(0, 8)}...</td>
      </tr>
    </table>

    <p style="font-size: 13px; color: #64748b; margin-top: 16px;">
      Remember to end your session in the app when you vacate the spot so your deposit can be released.
    </p>

    <div class="footer">
      ParkShare &bull; <a href="https://park-share.ro" style="color: #64748b;">park-share.ro</a>
    </div>
  </div>
</body>
</html>
`;

  return sendEmail({
    to: params.email,
    subject,
    html,
    text: `Booking confirmed for ${params.spotName} starting ${formattedDate}. Security deposit: ${params.deposit.toFixed(2)} RON.`,
  });
}

import dotenv from 'dotenv';
dotenv.config();

import { sendEmail } from './email';

async function main() {
  const recipient = process.argv[2] || process.env.TEST_EMAIL_RECIPIENT;
  if (!recipient) {
    console.log('\n\x1b[33mUsage:\x1b[0m npm run test:email <your-email@example.com>');
    console.log('Example: npm run test:email mytest@gmail.com\n');
    process.exit(1);
  }

  console.log(`\nTesting Resend with custom domain park-share.ro...`);
  console.log(`Target recipient: ${recipient}`);
  console.log(`From address:     ${process.env.FROM_EMAIL || 'ParkShare <noreply@park-share.ro>'}`);
  console.log(`API Key configured: ${Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your_api_key_here')}\n`);

  try {
    const result = await sendEmail({
      to: recipient,
      subject: 'ParkShare & Resend Setup Test',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-top: 0;">🅿️ ParkShare Email Integration</h2>
          <p>Congratulations! If you received this email, your <strong>Resend</strong> configuration with <strong>park-share.ro</strong> is verified and working properly.</p>
          <div style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 13px; color: #334155;">
            <strong>Timestamp:</strong> ${new Date().toISOString()}<br/>
            <strong>Sender:</strong> ${process.env.FROM_EMAIL || 'noreply@park-share.ro'}
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">ParkShare - Smart Community Parking Network</p>
        </div>
      `,
      text: `Congratulations! If you received this, your Resend configuration with custom domain park-share.ro is working. Timestamp: ${new Date().toISOString()}`,
    });

    console.log('Done! Result:', result);
  } catch (error: any) {
    console.error('Failed to send test email:', error.message || error);
    process.exit(1);
  }
}

main();

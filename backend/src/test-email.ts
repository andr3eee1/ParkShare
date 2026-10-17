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

  console.log(`\nTesting Resend with custom domain park-share.ro (Emerald Brand Edition)...`);
  console.log(`Target recipient: ${recipient}`);
  console.log(`From address:     ${process.env.FROM_EMAIL || 'ParkShare <noreply@park-share.ro>'}`);
  console.log(`API Key configured: ${Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your_api_key_here')}\n`);

  try {
    const result = await sendEmail({
      to: recipient,
      subject: 'ParkShare & Resend Setup Test 🅿️',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #D6E8DF; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 101, 82, 0.08);">
          <div style="text-align: center; margin-bottom: 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td style="vertical-align: middle;">
                  <img src="https://park-share.ro/api/assets/logo-mark.png" width="46" height="46" alt="🅿️" style="display: block; border-radius: 12px; width: 46px; height: 46px;" />
                </td>
                <td style="vertical-align: middle; padding-left: 12px; text-align: left;">
                  <div style="font-size: 24px; font-weight: 800; color: #101826; letter-spacing: -0.5px;">Park<span style="color: #009967;">Share</span></div>
                  <div style="font-size: 12px; color: #62748E; font-weight: 500;">Park smarter. Share more.</div>
                </td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <span style="display: inline-block; background-color: #D7F8E8; color: #006552; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 9999px; text-transform: uppercase;">
              Test Reușit &bull; Emerald Brand
            </span>
            <h2 style="color: #101826; margin: 12px 0 6px 0; font-size: 20px;">Integrare Email Verificată</h2>
            <p style="color: #62748E; font-size: 14px; margin: 0;">Domeniul <strong>park-share.ro</strong> și logo-ul integrat funcționează optim!</p>
          </div>

          <div style="background-color: #EAF9F1; border: 1.5px solid #B8EAD1; border-radius: 12px; padding: 16px; font-size: 13px; color: #006552; margin: 20px 0;">
            <div style="margin-bottom: 6px;"><strong>Sender:</strong> ${process.env.FROM_EMAIL || 'ParkShare <noreply@park-share.ro>'}</div>
            <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
          </div>

          <div style="text-align: center; margin-top: 28px; padding-top: 16px; border-top: 1px solid #EAF2EE; font-size: 11px; color: #94A3B8;">
            ParkShare &bull; Rețeaua inteligentă de parcare din România
          </div>
        </div>
      `,
      text: `Felicitări! Dacă primești acest mesaj, integrarea Resend cu domeniul park-share.ro și paleta de culori Emerald este complet configurată. Timestamp: ${new Date().toISOString()}`,
    });

    console.log('Done! Result:', result);
  } catch (error: any) {
    console.error('Failed to send test email:', error.message || error);
    process.exit(1);
  }
}

main();

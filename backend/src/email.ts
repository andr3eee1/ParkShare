import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;
export const DEFAULT_FROM_EMAIL = process.env.FROM_EMAIL || 'ParkShare <noreply@park-share.ro>';
export const API_BASE_URL = process.env.API_BASE_URL || 'https://park-share.ro/api';
export const APP_URL = process.env.APP_URL || 'https://park-share.ro/platform';
export const LOGO_URL = process.env.LOGO_URL || `${API_BASE_URL}/assets/logo-mark.png`;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: any[];
  sender?: string;
  userId?: string;
}

/**
 * Generic email sender using Resend.
 * Uses public hosted HTTPS assets on park-share.ro/api/assets/ for maximum
 * deliverability and instant rendering across all webmail and mobile clients.
 * Automatically persists to the EmailLog database table for audit & admin visibility.
 */
export async function sendEmail(options: SendEmailOptions) {
  const from = options.from || DEFAULT_FROM_EMAIL;
  const toStr = Array.isArray(options.to) ? options.to.join(', ') : options.to;
  const firstRecipient = Array.isArray(options.to) ? options.to[0] : options.to;

  const bodyPreview = options.text
    ? options.text.slice(0, 300)
    : options.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);

  let status = 'SENT';
  let sendError: string | null = null;
  let result: any = null;

  if (!apiKey || apiKey === 're_your_api_key_here') {
    console.log(`\x1b[33m[Resend: Dev/Mock]\x1b[0m API key not configured. Mocking email send:`);
    console.log(`  To: ${toStr}`);
    console.log(`  From: ${from}`);
    console.log(`  Subject: ${options.subject}`);
    result = { id: 'mock-email-id', mock: true };
  } else {
    try {
      const response = await resend!.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });

      if (response.error) {
        console.error('[Resend Error]', response.error);
        status = 'FAILED';
        sendError = response.error.message;
        throw new Error(`Resend error: ${response.error.message}`);
      }

      console.log(`\x1b[32m[Resend Success]\x1b[0m Email sent to ${toStr}. ID: ${response.data?.id}`);
      result = response.data;
    } catch (error: any) {
      console.error('[Resend Exception]', error);
      status = 'FAILED';
      sendError = error?.message || String(error);

      // Still record failure to database for admin visibility
      try {
        let matchedUserId = options.userId;
        if (!matchedUserId && firstRecipient) {
          const u = await prisma.user.findUnique({ where: { email: firstRecipient }, select: { id: true } });
          if (u) matchedUserId = u.id;
        }
        await prisma.emailLog.create({
          data: {
            to: toStr,
            subject: options.subject,
            bodyPreview,
            htmlContent: options.html,
            status,
            error: sendError,
            sender: options.sender || from,
            userId: matchedUserId || null,
          },
        });
      } catch (logErr) {
        console.error('Failed to log failed email:', logErr);
      }
      throw error;
    }
  }

  // Log successful or mocked email send
  try {
    let matchedUserId = options.userId;
    if (!matchedUserId && firstRecipient) {
      const u = await prisma.user.findUnique({ where: { email: firstRecipient }, select: { id: true } });
      if (u) matchedUserId = u.id;
    }
    await prisma.emailLog.create({
      data: {
        to: toStr,
        subject: options.subject,
        bodyPreview,
        htmlContent: options.html,
        status,
        error: sendError,
        sender: options.sender || from,
        userId: matchedUserId || null,
      },
    });
  } catch (logErr) {
    console.error('Failed to log sent email:', logErr);
  }

  return result;
}

/**
 * Shared Green-Forward HTML Master Layout (matches docs/brand/brand-spec.md §3):
 * - Primary Emerald: #009967
 * - Deep Emerald: #006552
 * - Emerald Wash: #EAF9F1
 * - Emerald Tint: #D7F8E8
 * - Ink: #101826
 * - Slate: #62748E
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
      <span style="display: inline-block; background-color: ${params.badge.bg || '#D7F8E8'}; color: ${params.badge.color || '#006552'}; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; padding: 5px 14px; border-radius: 9999px;">
        ${params.badge.text}
      </span>
    </div>`
    : '';

  const subtitleHtml = params.subtitle
    ? `<p style="font-size: 15px; line-height: 1.5; color: #62748E; margin: 0 0 20px 0; text-align: center;">${params.subtitle}</p>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${params.previewText ? `<meta name="description" content="${params.previewText}">` : ''}
  <title>${params.title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #EDF5F2; margin: 0; padding: 32px 16px; color: #101826; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto;">
    <!-- Brand Header with Logo -->
    <tr>
      <td align="center" style="padding-bottom: 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: middle;">
              <img src="${LOGO_URL}" width="48" height="48" alt="🅿️" style="display: block; border-radius: 12px; width: 48px; height: 48px; border: 0;" />
            </td>
            <td style="vertical-align: middle; padding-left: 12px; text-align: left;">
              <div style="font-size: 26px; font-weight: 800; color: #101826; letter-spacing: -0.5px; line-height: 1.1;">
                Park<span style="color: #009967;">Share</span>
              </div>
              <div style="font-size: 12px; color: #62748E; font-weight: 500; margin-top: 2px;">
                Park smarter. Share more.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Card -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #FFFFFF; border-radius: 18px; border: 1px solid #D6E8DF; box-shadow: 0 4px 16px -2px rgba(0, 101, 82, 0.08); overflow: hidden;">
          <!-- Top Accent Stripe -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #009967 0%, #006552 100%); line-height: 5px; font-size: 0;">&nbsp;</td>
          </tr>

          <!-- Card Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              ${badgeHtml}
              <h1 style="font-size: 22px; font-weight: 700; color: #101826; margin: 0 0 8px 0; text-align: center;">${params.title}</h1>
              ${subtitleHtml}

              <!-- Content Slot -->
              <div style="font-size: 15px; line-height: 1.6; color: #101826;">
                ${params.bodyContent}
              </div>

              <!-- Footer Signature -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 36px; border-top: 1px solid #EAF2EE; padding-top: 24px;">
                <tr>
                  <td align="center" style="font-size: 12px; line-height: 1.6; color: #62748E;">
                    <p style="margin: 0 0 6px 0; font-weight: 700; color: #006552;">
                      🅿️ ParkShare &bull; Rețeaua inteligentă de parcare din România
                    </p>
                    <p style="margin: 0 0 6px 0;">
                      <a href="${APP_URL}" style="color: #009967; text-decoration: none; font-weight: 600;">park-share.ro</a> &bull;
                      <a href="mailto:support@park-share.ro" style="color: #009967; text-decoration: none; font-weight: 600;">support@park-share.ro</a>
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                      Sent from custom domain park-share.ro via Resend
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
 * Helper to render emerald-themed 6-digit OTP code container.
 */
function renderOtpBox(code: string, label = 'VERIFICATION CODE', validMinutes = 10): string {
  return `
    <div style="background-color: #EAF9F1; border: 2px dashed #009967; border-radius: 14px; padding: 22px 16px; text-align: center; margin: 24px 0;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #009967; font-weight: 700; margin-bottom: 6px;">
        ${label}
      </div>
      <div style="font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #006552; margin: 6px 0;">
        ${code}
      </div>
      <div style="font-size: 12px; color: #62748E; margin-top: 6px;">
        Valabil <strong>${validMinutes} minute</strong> &bull; Nu divulga acest cod nimănui
      </div>
    </div>
  `;
}

/**
 * Helper to render primary emerald call-to-action button.
 */
function renderButton(text: string, url: string): string {
  return `
    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="${url}" target="_blank" style="display: inline-block; background-color: #009967; color: #FFFFFF !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 153, 103, 0.28);">
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
    previewText: `Codul tău de verificare ParkShare este ${params.code}`,
    badge: { text: 'Verificare Cont', bg: '#D7F8E8', color: '#006552' },
    title: 'Confirmă adresa de email',
    subtitle: `Bun venit, ${params.firstName}! Confirmă contul pentru a avea acces complet la rețeaua ParkShare.`,
    bodyContent: `
      <p>Îți mulțumim că te-ai alăturat comunității <strong>ParkShare</strong>! Pentru a-ți securiza contul și a debloca toate funcțiile, introdu codul de 6 cifre de mai jos în aplicație:</p>
      
      ${renderOtpBox(params.code, 'COD VERIFICARE EMAIL', 15)}
      
      <p style="text-align: center; margin-bottom: 8px; color: #62748E; font-size: 14px;">Sau verifică instant contul cu un singur click:</p>
      ${renderButton('Confirmă Contul Meu', verifyLink)}

      <div style="background-color: #F9FAFB; border-radius: 10px; padding: 14px 16px; margin-top: 24px; font-size: 13px; color: #62748E; border: 1px solid #E5E7EB;">
        <strong>Nu ai creat acest cont?</strong> Dacă nu te-ai înregistrat pe ParkShare, poți ignora în siguranță acest mesaj.
      </div>
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `${params.code} este codul tău de confirmare ParkShare`,
    html,
    text: `Salut ${params.firstName},\n\nCodul tău de confirmare ParkShare este: ${params.code}\n\nSau accesează linkul: ${verifyLink}\n\nCodul expiră în 15 minute.`,
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
    previewText: `Resetează parola ParkShare cu codul ${params.code}`,
    badge: { text: 'Securitate', bg: '#FEF3C7', color: '#92400E' },
    title: 'Resetare Parolă',
    subtitle: `Salut ${params.firstName}, am primit o solicitare de resetare a parolei tale.`,
    bodyContent: `
      <p>Introdu codul PIN de 6 cifre de mai jos în aplicația ParkShare pentru a-ți alege o parolă nouă:</p>

      ${renderOtpBox(params.code, 'PIN RESETARE PAROLĂ', 15)}

      <p style="text-align: center; margin-bottom: 8px; color: #62748E; font-size: 14px;">Sau resetează parola direct online:</p>
      ${renderButton('Resetează Parola', resetLink)}

      <div style="background-color: #FFFBEB; border-radius: 10px; padding: 14px 16px; margin-top: 24px; font-size: 13px; color: #78350F; border: 1px solid #FDE68A;">
        <strong>⚠️ Notă de securitate:</strong> Dacă NU ai solicitat resetarea parolei, ignoră acest email. Parola ta rămâne neschimbată și în siguranță.
      </div>
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `Cod Resetare Parolă: ${params.code}`,
    html,
    text: `Salut ${params.firstName},\n\nCodul tău de resetare a parolei este: ${params.code}\n\nSau resetează direct: ${resetLink}\n\nCodul expiră în 15 minute.`,
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
    previewText: 'Parola contului tău ParkShare a fost schimbată',
    badge: { text: 'Alertă Securitate', bg: '#D7F8E8', color: '#006552' },
    title: 'Parola a fost actualizată',
    subtitle: `Salut ${params.firstName}, parola contului tău a fost modificată cu succes.`,
    bodyContent: `
      <p>Îți confirmăm că parola asociată contului ParkShare a fost schimbată la data de <strong>${new Date().toUTCString()}</strong>.</p>
      
      <p>Dacă ai efectuat tu această schimbare, nu este necesară nicio altă acțiune.</p>

      <div style="background-color: #FEF2F2; border-radius: 10px; padding: 14px 16px; margin-top: 24px; font-size: 13px; color: #991B1B; border: 1px solid #FECACA;">
        <strong>Nu ai fost tu?</strong> Contul tău poate fi compromis. Te rugăm să contactezi de urgență echipa noastră de securitate la <a href="mailto:security@park-share.ro" style="color: #DC2626; font-weight: 700;">security@park-share.ro</a>.
      </div>
    `,
  });

  return sendEmail({
    to: params.email,
    subject: 'Securitate: Parola contului ParkShare a fost actualizată',
    html,
    text: `Salut ${params.firstName},\n\nParola contului tău a fost actualizată cu succes. Dacă nu ai fost tu, contactează imediat security@park-share.ro.`,
  });
}

// ==========================================
// 4. TWO-FACTOR AUTHENTICATION (2FA) CODE
// ==========================================
export async function send2FACodeEmail(params: {
  email: string;
  firstName: string;
  code: string;
}) {
  const html = renderEmailLayout({
    previewText: `Codul tău de autentificare 2FA este ${params.code}`,
    badge: { text: 'Autentificare 2FA', bg: '#D7F8E8', color: '#006552' },
    title: 'Cod de Autentificare',
    subtitle: `Salut ${params.firstName}, o încercare de conectare a fost inițiată.`,
    bodyContent: `
      <p>Introdu codul de securitate de mai jos pentru a autoriza conectarea în contul tău ParkShare:</p>

      ${renderOtpBox(params.code, 'COD DE CONECTARE 2FA', 10)}

      <div style="background-color: #F9FAFB; border-radius: 10px; padding: 14px 16px; margin-top: 24px; font-size: 13px; color: #62748E; border: 1px solid #E5E7EB;">
        <strong>Notă:</strong> Acest cod a fost generat pentru o încercare de conectare la data de <strong>${new Date().toUTCString()}</strong>. Dacă nu ai fost tu, îți recomandăm să schimbi parola imediat.
      </div>
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `${params.code} este codul tău 2FA ParkShare`,
    html,
    text: `Salut ${params.firstName},\n\nCodul tău de securitate 2FA este: ${params.code}\n\nExpiră în 10 minute. Nu divulga acest cod nimănui.`,
  });
}

// ==========================================
// 5. WELCOME EMAIL
// ==========================================
export async function sendWelcomeEmail(user: { email: string; firstName: string }) {
  const html = renderEmailLayout({
    previewText: 'Bine ai venit în comunitatea ParkShare!',
    badge: { text: 'Bun Venit', bg: '#D7F8E8', color: '#006552' },
    title: `Bun venit la ParkShare, ${user.firstName}! 🎉`,
    subtitle: 'Contul tău inteligent de parcare este activ.',
    bodyContent: `
      <p>Îți mulțumim că te-ai alăturat <strong>ParkShare</strong> — prima rețea comunitară de parcări private din România.</p>

      <div style="background-color: #EAF9F1; border-radius: 14px; padding: 20px 22px; margin: 20px 0; border: 1px solid #B8EAD1;">
        <p style="margin: 0; font-weight: 700; color: #006552; font-size: 15px;">Ce poți face acum cu contul tău:</p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #006552; font-size: 14px; line-height: 1.7;">
          <li><strong>Găsește & Rezervă:</strong> Locuri de parcare private pe harta noastră interactivă în timp real.</li>
          <li><strong>Monetizează:</strong> Adaugă locul tău liber de parcare și generează venit pasiv garantat.</li>
          <li><strong>Siguranță Garantată:</strong> Garanții automate de securitate și evaluare mutuală prin TrustScore.</li>
        </ul>
      </div>

      ${renderButton('Explorează Locurile Libere', APP_URL)}
    `,
  });

  return sendEmail({
    to: user.email,
    subject: 'Bun venit la ParkShare!',
    html,
    text: `Salut ${user.firstName},\n\nBun venit la ParkShare! Rezervă locuri de parcare sau adaugă propriul loc pe https://park-share.ro`,
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
    previewText: `Rezervare confirmată: ${params.spotName}`,
    badge: { text: 'Rezervare Activă', bg: '#D7F8E8', color: '#006552' },
    title: 'Loc Rezervat cu Succes! 🚗',
    subtitle: `Salut ${params.firstName}, locul tău de parcare te așteaptă!`,
    bodyContent: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border: 1px solid #D6E8DF; border-radius: 12px; overflow: hidden; font-size: 14px;">
        <tr style="background-color: #F3FCF8;">
          <td style="padding: 12px 16px; color: #62748E; font-weight: 500;">Loc de Parcare</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #101826;">${params.spotName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #62748E; font-weight: 500; border-top: 1px solid #EAF2EE;">Ora Începerii</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #101826; border-top: 1px solid #EAF2EE;">${formattedDate}</td>
        </tr>
        <tr style="background-color: #F3FCF8;">
          <td style="padding: 12px 16px; color: #62748E; font-weight: 500; border-top: 1px solid #EAF2EE;">Garanție Reținută</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 800; color: #009967; border-top: 1px solid #EAF2EE;">${params.deposit.toFixed(2)} RON</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #62748E; font-weight: 500; border-top: 1px solid #EAF2EE;">ID Rezervare</td>
          <td style="padding: 12px 16px; text-align: right; font-family: monospace; font-size: 13px; color: #62748E; border-top: 1px solid #EAF2EE;">${params.reservationId.slice(0, 8).toUpperCase()}</td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #62748E; text-align: center;">
        Nu uita să apeși <strong>"Încheie Rezervarea"</strong> în aplicație când părăsești locul pentru a-ți elibera garanția.
      </p>

      ${renderButton('Deschide Rezervarea', `${APP_URL}/bookings`)}
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `Rezervare Confirmată: ${params.spotName}`,
    html,
    text: `Rezervarea pentru ${params.spotName} a început la ${formattedDate}. Garanție reținută: ${params.deposit.toFixed(2)} RON.`,
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
    previewText: `Locul tău ${params.spotName} a fost rezervat!`,
    badge: { text: 'Rezervare Nouă', bg: '#D7F8E8', color: '#006552' },
    title: 'Locul tău a fost rezervat! 🅿️',
    subtitle: `Vești excelente, ${params.hostName}! Un șofer a rezervat spațiul tău.`,
    bodyContent: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border: 1px solid #D6E8DF; border-radius: 12px; overflow: hidden; font-size: 14px;">
        <tr style="background-color: #F3FCF8;">
          <td style="padding: 12px 16px; color: #62748E; font-weight: 500;">Spațiu Parcare</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #101826;">${params.spotName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #62748E; font-weight: 500; border-top: 1px solid #EAF2EE;">Șofer</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #101826; border-top: 1px solid #EAF2EE;">${params.driverName}</td>
        </tr>
        <tr style="background-color: #F3FCF8;">
          <td style="padding: 12px 16px; color: #62748E; font-weight: 500; border-top: 1px solid #EAF2EE;">Ora Sosirii</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #101826; border-top: 1px solid #EAF2EE;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #62748E; font-weight: 500; border-top: 1px solid #EAF2EE;">Tarif Orar</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 800; color: #009967; border-top: 1px solid #EAF2EE;">${params.hourlyPrice.toFixed(2)} RON / oră</td>
        </tr>
      </table>

      ${renderButton('Panou Gazdă', `${APP_URL}/provider`)}
    `,
  });

  return sendEmail({
    to: params.hostEmail,
    subject: `Rezervare Nouă: ${params.spotName} a fost rezervat`,
    html,
    text: `Salut ${params.hostName},\n\nLocul tău "${params.spotName}" a fost rezervat de ${params.driverName} începând cu ${formattedDate} (${params.hourlyPrice} RON/h).`,
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
    : `${(params.durationMinutes / 60).toFixed(1)} ore`;

  const html = renderEmailLayout({
    previewText: `Chitanță pentru parcarea la ${params.spotName}`,
    badge: { text: 'Sesiune Încheiată', bg: '#D7F8E8', color: '#006552' },
    title: 'Sesiune de Parcare Încheiată',
    subtitle: `Mulțumim că folosești ParkShare, ${params.firstName}! Iată sumarul sesiunii tale.`,
    bodyContent: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border: 1px solid #D6E8DF; border-radius: 12px; overflow: hidden; font-size: 14px;">
        <tr style="background-color: #F3FCF8;">
          <td style="padding: 12px 16px; color: #62748E; font-weight: 500;">Loc de Parcare</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #101826;">${params.spotName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #62748E; font-weight: 500; border-top: 1px solid #EAF2EE;">Durată</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #101826; border-top: 1px solid #EAF2EE;">${durationText}</td>
        </tr>
        <tr style="background-color: #F3FCF8;">
          <td style="padding: 12px 16px; color: #62748E; font-weight: 500; border-top: 1px solid #EAF2EE;">Garanție Eliberată</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 800; color: #009967; border-top: 1px solid #EAF2EE;">+${params.refundedDeposit.toFixed(2)} RON</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #62748E; font-weight: 500; border-top: 1px solid #EAF2EE;">Cost Total Parcare</td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 800; color: #101826; border-top: 1px solid #EAF2EE;">${params.totalCost.toFixed(2)} RON</td>
        </tr>
      </table>

      ${renderButton('Lasă o Recenzie', `${APP_URL}/bookings`)}
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `Chitanță Parcare: ${params.spotName} (${params.totalCost.toFixed(2)} RON)`,
    html,
    text: `Sesiunea de parcare la ${params.spotName} s-a încheiat. Durată: ${durationText}. Total: ${params.totalCost.toFixed(2)} RON. Garanție eliberată.`,
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
    previewText: `Ai câștigat ${params.earnings.toFixed(2)} RON pe ParkShare!`,
    badge: { text: 'Venit Înregistrat', bg: '#D7F8E8', color: '#006552' },
    title: 'Banii au intrat în Portofel! 💰',
    subtitle: `Salut ${params.hostName}, câștigul tău pentru locul de parcare a fost transferat.`,
    bodyContent: `
      <div style="background-color: #EAF9F1; border: 1.5px solid #B8EAD1; border-radius: 14px; padding: 24px; text-align: center; margin: 20px 0;">
        <div style="font-size: 13px; color: #006552; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Adăugat în Portofel</div>
        <div style="font-size: 38px; font-weight: 800; color: #006552; margin: 8px 0;">+${params.earnings.toFixed(2)} RON</div>
        <div style="font-size: 13px; color: #009967; font-weight: 600;">Loc: <strong>${params.spotName}</strong></div>
      </div>

      ${renderButton('Vezi Soldul Portofelului', `${APP_URL}/wallet`)}
    `,
  });

  return sendEmail({
    to: params.hostEmail,
    subject: `💰 Ai câștigat ${params.earnings.toFixed(2)} RON pentru ${params.spotName}`,
    html,
    text: `Ai câștigat ${params.earnings.toFixed(2)} RON pentru parcarea pe "${params.spotName}". Fondurile sunt disponibile în portofelul tău.`,
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
    previewText: `Depunere confirmată: +${params.amount.toFixed(2)} RON adăugați`,
    badge: { text: 'Alimentare Portofel', bg: '#D7F8E8', color: '#006552' },
    title: 'Alimentare Portofel Confirmată',
    subtitle: `Salut ${params.firstName}, depunerea ta a fost procesată cu succes.`,
    bodyContent: `
      <div style="background-color: #EAF9F1; border: 1.5px solid #B8EAD1; border-radius: 14px; padding: 24px; text-align: center; margin: 20px 0;">
        <div style="font-size: 13px; color: #006552; font-weight: 700; text-transform: uppercase;">Sumă Depusă</div>
        <div style="font-size: 38px; font-weight: 800; color: #006552; margin: 8px 0;">+${params.amount.toFixed(2)} RON</div>
        <div style="font-size: 14px; color: #009967; font-weight: 600;">Sold Actualizat: <strong>${params.newBalance.toFixed(2)} RON</strong></div>
      </div>

      ${renderButton('Deschide Portofelul', `${APP_URL}/wallet`)}
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `Alimentare Portofel Confirmată (+${params.amount.toFixed(2)} RON)`,
    html,
    text: `Salut ${params.firstName},\n\nDepunerea de ${params.amount.toFixed(2)} RON a fost adăugată. Noul tău sold este ${params.newBalance.toFixed(2)} RON.`,
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
    'commuter': 'Abonament Navetist (Luni-Vineri)',
    'night-owl': 'Abonament Night-Owl (Nocturn)',
    'park-plus': 'Abonament ParkPlus All-Access',
  };
  const passTitle = passNames[params.passKind] || params.passKind;

  const html = renderEmailLayout({
    previewText: `Abonamentul ${passTitle} este acum activ`,
    badge: { text: 'Abonament Activ', bg: '#D7F8E8', color: '#006552' },
    title: 'Abonament Activat! 🎟️',
    subtitle: `Felicitări ${params.firstName}, abonamentul tău este gata de utilizare.`,
    bodyContent: `
      <div style="background-color: #EAF9F1; border: 1.5px solid #B8EAD1; border-radius: 14px; padding: 22px; margin: 20px 0;">
        <h3 style="margin: 0 0 6px 0; color: #006552; font-size: 18px;">${passTitle}</h3>
        <p style="margin: 0; color: #009967; font-size: 14px; font-weight: 600;">Valabil până la: <strong>${expiryFormatted}</strong></p>
      </div>

      ${renderButton('Vezi Locurile Eligibile', `${APP_URL}/passes`)}
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `Abonament Activat: ${passTitle}`,
    html,
    text: `Abonamentul ${passTitle} a fost activat și este valabil până la ${expiryFormatted}.`,
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

  const title = isBan
    ? 'Cont Suspendat Permanent'
    : isSuspension
    ? 'Suspendare Temporară a Contului'
    : 'Avertisment Încredere & Siguranță';

  const badgeColor = isBan ? '#7F1D1D' : isSuspension ? '#991B1B' : '#92400E';
  const badgeBg = isBan ? '#FEE2E2' : isSuspension ? '#FEE2E2' : '#FEF3C7';

  const html = renderEmailLayout({
    previewText: `Notificare Siguranță: ${title}`,
    badge: { text: 'Încredere & Siguranță', bg: badgeBg, color: badgeColor },
    title,
    subtitle: `Salut ${params.firstName}, te rugăm să consulți această decizie de moderare.`,
    bodyContent: `
      <div style="background-color: #FFF1F2; border: 1px solid #FECDD3; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-weight: 700; color: #9F1239;">Motivul acțiunii:</p>
        <p style="margin: 0; color: #881337; font-size: 14px;">${params.reason || 'Încălcarea standardelor de încredere sau recenzii negative repetate.'}</p>
        ${
          params.suspendedUntil
            ? `<p style="margin: 12px 0 0 0; font-size: 13px; color: #BE123C;">Expirare suspendare: <strong>${new Intl.DateTimeFormat('ro-RO', { dateStyle: 'medium', timeStyle: 'short' }).format(params.suspendedUntil)}</strong></p>`
            : ''
        }
      </div>

      <p style="font-size: 14px; color: #62748E;">
        Dacă consideri că această măsură a fost luată dintr-o eroare, poți depune o contestație direct din profilul tău.
      </p>

      ${renderButton('Depune Contestație', `${APP_URL}/standing`)}
    `,
  });

  return sendEmail({
    to: params.email,
    subject: `Notificare Importantă: ${title}`,
    html,
    text: `Salut ${params.firstName},\n\nO acțiune de moderare (${params.action}) a fost aplicată contului tău.\nMotiv: ${params.reason || 'Standarde comunitare'}.\n\nPoți contesta decizia la ${APP_URL}/standing`,
  });
}

/**
 * Send a custom admin-crafted email to a user with the brand-consistent ParkShare green layout.
 */
export async function sendCustomAdminEmail(params: {
  to: string;
  subject: string;
  message: string;
  senderAdminName?: string;
  senderAdminEmail?: string;
  actionUrl?: string;
  actionText?: string;
}) {
  const previewText = params.message.slice(0, 100);
  const actionButtonHtml = params.actionUrl
    ? `
    <div style="text-align: center; margin: 26px 0 12px 0;">
      <a href="${params.actionUrl}" style="background-color: #009967; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 12px; display: inline-block;">
        ${params.actionText || 'Open ParkShare'}
      </a>
    </div>`
    : '';

  const formattedParagraphs = params.message
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p style="margin: 0 0 14px 0; line-height: 1.6; color: #101826; font-size: 15px;">${line}</p>`)
    .join('');

  const bodyContent = `
    <div style="padding: 6px 0;">
      ${formattedParagraphs}
      ${actionButtonHtml}
      ${
        params.senderAdminName
          ? `<p style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #E5E7EB; font-size: 13px; color: #62748E;">
               Sent by <strong>${params.senderAdminName}</strong> from ParkShare Administration.
             </p>`
          : ''
      }
    </div>
  `;

  const html = renderEmailLayout({
    previewText,
    badge: { text: 'Admin Communication', bg: '#D7F8E8', color: '#006552' },
    title: params.subject,
    bodyContent,
  });

  return sendEmail({
    to: params.to,
    subject: params.subject,
    html,
    text: `${params.subject}\n\n${params.message}\n\n${params.actionUrl ? `${params.actionText || 'Open'}: ${params.actionUrl}\n\n` : ''}ParkShare Team`,
    sender: params.senderAdminEmail || params.senderAdminName || 'ParkShare Admin',
  });
}


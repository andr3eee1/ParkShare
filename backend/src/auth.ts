import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { requireAuth, AuthRequest } from './middleware';
import {
  sendWelcomeEmail,
  sendAccountVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedAlertEmail,
  send2FACodeEmail,
} from './email';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';

/** Shape of the user object safe to return to the client (includes standing, verification & 2FA). */
const toPublicUser = (user: any) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  avatarUrl: user.avatarUrl,
  role: user.role,
  walletBalance: user.walletBalance,
  trustScore: user.trustScore,
  hostRating: user.hostRating,
  accountStatus: user.accountStatus,
  suspendedUntil: user.suspendedUntil,
  warningCount: user.warningCount,
  driverReviewsCount: user.driverReviewsCount,
  hostReviewsCount: user.hostReviewsCount,
  completedBookings: user.completedBookings,
  emailVerified: user.emailVerified ?? false,
  twoFactorEnabled: user.twoFactorEnabled ?? false,
});

function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ==========================================
// REGISTRATION & EMAIL CONFIRMATION
// ==========================================
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  avatarUrl: z.string().url().optional(),
  role: z.enum(['USER', 'PROVIDER']).optional()
});

router.post('/register', async (req, res): Promise<any> => {
  try {
    const data = RegisterSchema.parse(req.body);
    
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const verificationCode = generate6DigitCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        avatarUrl: data.avatarUrl,
        role: data.role || 'USER',
        emailVerified: false,
        verificationCode,
        verificationExpires,
      }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, walletBalance: user.walletBalance },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send account confirmation email with 6-digit code via Resend
    sendAccountVerificationEmail({
      email: user.email,
      firstName: user.firstName,
      code: verificationCode,
    }).catch(err => {
      console.error('[Account Verification Email Error]:', err);
    });

    res.status(201).json({
      message: 'User registered. Please check your email for the confirmation code.',
      token,
      user: toPublicUser(user),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const VerifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

router.post('/verify-email', async (req, res): Promise<any> => {
  try {
    const { email, code } = VerifyEmailSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid verification code or email' });
    }

    if (user.emailVerified) {
      return res.json({ message: 'Email is already verified', emailVerified: true });
    }

    if (!user.verificationCode || !user.verificationExpires) {
      return res.status(400).json({ error: 'No verification code requested or already expired' });
    }

    if (user.verificationCode !== code || user.verificationExpires < new Date()) {
      return res.status(400).json({ error: 'Verification code is invalid or has expired' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationExpires: null,
      }
    });

    // Send welcome email after successful confirmation
    sendWelcomeEmail({
      email: updatedUser.email,
      firstName: updatedUser.firstName,
    }).catch(err => console.error('[Welcome Email Error]:', err));

    res.json({
      message: 'Email successfully verified! Welcome to ParkShare.',
      emailVerified: true,
      user: toPublicUser(updatedUser),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const ResendVerificationSchema = z.object({
  email: z.string().email(),
});

router.post('/resend-verification', async (req, res): Promise<any> => {
  try {
    const { email } = ResendVerificationSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: 'If an account exists, a new verification code has been sent.' });
    }

    if (user.emailVerified) {
      return res.json({ message: 'Email is already verified.', emailVerified: true });
    }

    const verificationCode = generate6DigitCode();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode, verificationExpires },
    });

    sendAccountVerificationEmail({
      email: user.email,
      firstName: user.firstName,
      code: verificationCode,
    }).catch(err => console.error('[Resend Verification Error]:', err));

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// LOGIN & 2FA AUTHENTICATION
// ==========================================
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/login', async (req, res): Promise<any> => {
  try {
    const data = LoginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user has Two-Factor Authentication (2FA) enabled
    if (user.twoFactorEnabled) {
      const twoFactorCode = generate6DigitCode();
      const twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorCode, twoFactorExpires },
      });

      send2FACodeEmail({
        email: user.email,
        firstName: user.firstName,
        code: twoFactorCode,
      }).catch(err => console.error('[2FA Email Error]:', err));

      return res.json({
        require2FA: true,
        email: user.email,
        message: 'A 2FA authentication code has been sent to your email address.',
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, walletBalance: user.walletBalance },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: toPublicUser(user),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const Login2FASchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

router.post('/login-2fa', async (req, res): Promise<any> => {
  try {
    const { email, code } = Login2FASchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.twoFactorCode || !user.twoFactorExpires) {
      return res.status(400).json({ error: 'Invalid or expired 2FA code' });
    }

    if (user.twoFactorCode !== code || user.twoFactorExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired 2FA code' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCode: null, twoFactorExpires: null },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, walletBalance: user.walletBalance },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '2FA authentication successful',
      token,
      user: toPublicUser(user),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Login 2FA error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// PASSWORD RESETS
// ==========================================
const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

router.post('/forgot-password', async (req, res): Promise<any> => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return positive message regardless to prevent email enumeration
      return res.json({ message: 'If this email is registered, a password reset PIN has been sent.' });
    }

    const resetPasswordCode = generate6DigitCode();
    const resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordCode, resetPasswordExpires },
    });

    sendPasswordResetEmail({
      email: user.email,
      firstName: user.firstName,
      code: resetPasswordCode,
    }).catch(err => console.error('[Password Reset Email Error]:', err));

    res.json({ message: 'If this email is registered, a password reset PIN has been sent.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const ResetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6),
});

router.post('/reset-password', async (req, res): Promise<any> => {
  try {
    const { email, code, newPassword } = ResetPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetPasswordCode || !user.resetPasswordExpires) {
      return res.status(400).json({ error: 'Invalid or expired password reset PIN' });
    }

    if (user.resetPasswordCode !== code || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired password reset PIN' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordCode: null,
        resetPasswordExpires: null,
      },
    });

    sendPasswordChangedAlertEmail({
      email: user.email,
      firstName: user.firstName,
    }).catch(err => console.error('[Password Changed Alert Error]:', err));

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// 2FA PROFILE SETTINGS (Enable / Disable)
// ==========================================
router.post('/2fa/request-enable', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: 'Two-Factor Authentication is already enabled' });
    }

    const code = generate6DigitCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorCode: code, twoFactorExpires: expiry },
    });

    send2FACodeEmail({
      email: user.email,
      firstName: user.firstName,
      code,
    }).catch(err => console.error('[2FA Enable Request Error]:', err));

    res.json({ message: 'Verification code sent to your email to confirm 2FA enablement.' });
  } catch (error) {
    console.error('2FA request enable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const Confirm2FASchema = z.object({
  code: z.string().length(6),
});

router.post('/2fa/confirm-enable', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { code } = Confirm2FASchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorCode || !user.twoFactorExpires) {
      return res.status(400).json({ error: 'No 2FA setup request found or expired' });
    }

    if (user.twoFactorCode !== code || user.twoFactorExpires < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorCode: null,
        twoFactorExpires: null,
      },
    });

    res.json({
      message: 'Two-Factor Authentication enabled successfully!',
      twoFactorEnabled: true,
      user: toPublicUser(updated),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    console.error('2FA confirm enable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const Disable2FASchema = z.object({
  password: z.string(),
});

router.post('/2fa/disable', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { password } = Disable2FASchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorCode: null,
        twoFactorExpires: null,
      },
    });

    res.json({
      message: 'Two-Factor Authentication disabled successfully.',
      twoFactorEnabled: false,
      user: toPublicUser(updated),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// PROFILE & AVATAR
// ==========================================
const UpdateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  avatarUrl: z.union([z.string().url(), z.string().startsWith('/'), z.literal('')]).optional(),
});

router.put('/profile', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const data = UpdateProfileSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl === '' ? null : data.avatarUrl }),
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: toPublicUser(updatedUser),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${(req as AuthRequest).user?.userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

router.post('/upload-avatar', requireAuth, upload.single('avatar'), async (req: AuthRequest, res: any): Promise<any> => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const host = req.get('host');
    let baseUrl = process.env.API_PUBLIC_URL;
    if (!baseUrl) {
      const protocol = req.headers['x-forwarded-proto'] as string || req.protocol;
      baseUrl = `${protocol}://${host}`;
    }
    const url = `/uploads/${req.file.filename}`;
    
    res.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res: any): Promise<any> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: toPublicUser(user),
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

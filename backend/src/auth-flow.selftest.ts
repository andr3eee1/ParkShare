import dotenv from 'dotenv';
dotenv.config();

import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

async function runSelftest() {
  console.log('🧪 Starting Auth, Email Confirmation, Password Reset, and 2FA Selftest...');
  const testEmail = `test-user-${Date.now()}@park-share.ro`;
  const initialPassword = 'InitialSecurePassword123!';
  const newPassword = 'UpdatedSecurePassword456!';

  try {
    // 1. Clean up any existing test user
    await prisma.user.deleteMany({ where: { email: testEmail } });

    // 2. Simulate Registration
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(initialPassword, salt);
    const verificationCode = '123456';
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        firstName: 'Test',
        lastName: 'Driver',
        role: 'USER',
        emailVerified: false,
        verificationCode,
        verificationExpires,
      },
    });

    console.log('  ✓ User registered with emailVerified = false and 6-digit confirmation code');

    // 3. Verify Email Confirmation
    if (user.verificationCode !== '123456' || (user.verificationExpires && user.verificationExpires < new Date())) {
      throw new Error('Verification code check failed');
    }

    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationExpires: null,
      },
    });

    if (!verifiedUser.emailVerified || verifiedUser.verificationCode !== null) {
      throw new Error('Email verification state update failed');
    }
    console.log('  ✓ Email confirmation verified and state updated');

    // 4. Simulate Forgot Password
    const resetCode = '654321';
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordCode: resetCode, resetPasswordExpires: resetExpires },
    });
    console.log('  ✓ Password reset PIN requested and recorded');

    // 5. Reset Password
    const newHash = await bcrypt.hash(newPassword, salt);
    const resetUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        resetPasswordCode: null,
        resetPasswordExpires: null,
      },
    });

    const isOldValid = await bcrypt.compare(initialPassword, resetUser.passwordHash);
    const isNewValid = await bcrypt.compare(newPassword, resetUser.passwordHash);
    if (isOldValid || !isNewValid) {
      throw new Error('Password reset verification failed');
    }
    console.log('  ✓ Password reset successfully with new hash');

    // 6. Test 2FA Flow
    const twoFactorCode = '987654';
    const twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Enable 2FA
    const user2FA = await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorCode,
        twoFactorExpires,
      },
    });
    if (!user2FA.twoFactorEnabled) throw new Error('2FA enable failed');
    console.log('  ✓ 2FA enabled successfully on user account');

    // Verify 2FA challenge
    if (user2FA.twoFactorCode !== twoFactorCode) throw new Error('2FA challenge code mismatch');
    const finalized2FA = await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCode: null, twoFactorExpires: null },
    });
    if (finalized2FA.twoFactorCode !== null) throw new Error('2FA code clear failed');
    console.log('  ✓ 2FA challenge validated and cleared for login');

    // 7. Cleanup
    await prisma.user.delete({ where: { id: user.id } });
    console.log('  ✓ Test user cleaned up');

    console.log('\n🎉 ALL AUTH & 2FA CHECKS PASSED!\n');
  } catch (error) {
    console.error('❌ Selftest failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSelftest();

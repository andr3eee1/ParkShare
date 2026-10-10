import { Prisma, PrismaClient } from '@prisma/client';

type Db = PrismaClient | Prisma.TransactionClient;

/** Deposit is proportional to the spot price (5 hours of parking), capped. */
export const DEPOSIT_HOURS_MULTIPLIER = 5;
export const DEPOSIT_CAP_RON = 50;

export type DepositTier = 'PASS_HOLDER' | 'TRUSTED' | 'REGULAR' | 'NEW';

export interface DepositQuote {
  baseDeposit: number;
  deposit: number;
  tier: DepositTier;
  trustScore: number;
  completedBookings: number;
  reason: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Single source of truth for the security deposit. NEVER trust a client-sent value.
 *  - Active pass holders: 0
 *  - Trusted (>= 3 completed bookings, trust >= 4.5): 0
 *  - Regular (>= 1 completed booking, trust >= 4.0): 50%
 *  - New / low trust: 100%
 */
export async function quoteDeposit(db: Db, userId: string, spotPrice: number): Promise<DepositQuote> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { trustScore: true, completedBookings: true },
  });
  if (!user) throw new Error('User not found');

  const baseDeposit = round2(Math.min(Math.max(spotPrice, 0) * DEPOSIT_HOURS_MULTIPLIER, DEPOSIT_CAP_RON));
  const common = { baseDeposit, trustScore: user.trustScore, completedBookings: user.completedBookings };

  const activePass = await db.userPass.findFirst({
    where: { userId, OR: [{ activeUntil: null }, { activeUntil: { gt: new Date() } }] },
  });
  if (activePass) {
    return { ...common, deposit: 0, tier: 'PASS_HOLDER', reason: 'Deposit waived: active pass' };
  }
  if (user.completedBookings >= 3 && user.trustScore >= 4.5) {
    return { ...common, deposit: 0, tier: 'TRUSTED', reason: 'Deposit waived: trusted driver' };
  }
  if (user.completedBookings >= 1 && user.trustScore >= 4.0) {
    return { ...common, deposit: round2(baseDeposit / 2), tier: 'REGULAR', reason: '50% off deposit: good standing' };
  }
  return {
    ...common,
    deposit: baseDeposit,
    tier: 'NEW',
    reason: user.completedBookings === 0
      ? 'Full deposit: complete 3 bookings with good ratings to waive it'
      : 'Full deposit: trust score below 4.0',
  };
}

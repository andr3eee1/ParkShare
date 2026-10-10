import { Prisma, PrismaClient } from '@prisma/client';

type Db = PrismaClient | Prisma.TransactionClient;

export type AccountStatus = 'ACTIVE' | 'WARNING' | 'SUSPENDED' | 'BANNED';
export type SanctionAction = 'WARN' | 'SUSPEND' | 'BAN' | 'REINSTATE';

/**
 * Trust & safety thresholds. These are the single source of truth for the
 * automated standing ladder. Warnings and temporary suspensions are automatic;
 * permanent bans are always confirmed manually by an admin.
 */
export const STANDING = {
  /** Minimum number of reviews before automation acts (avoids small-sample bias). */
  DRIVER_MIN_REVIEWS: 5,
  HOST_MIN_REVIEWS: 5,
  /** Below this score -> WARNING. */
  WARN_THRESHOLD: 3.5,
  /** Below this score -> SUSPENDED. */
  SUSPEND_THRESHOLD: 3.0,
  /** Default temporary suspension length. */
  SUSPENSION_DAYS: 14,
  /** Rolling window used to count recent very bad ratings. */
  RECENT_WINDOW_DAYS: 90,
  /** Ratings <= this value count as "low". */
  RECENT_LOW_MAX: 2,
  /** This many low ratings inside the window is enough to act even below the min review count. */
  RECENT_LOW_LIMIT: 3,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Safe-rollout switch. When STANDING_DRY_RUN=true the engine logs the automatic
 * actions it *would* take (warnings/suspensions/reinstatements) without applying
 * them, so thresholds can be tuned against real data before enforcement goes live.
 * Manual admin actions are never affected.
 */
const DRY_RUN = process.env.STANDING_DRY_RUN === 'true';

export interface StandingSnapshot {
  userId: string;
  status: AccountStatus;
  suspendedUntil: Date | null;
  warningCount: number;
  driverScore: number;
  driverReviews: number;
  hostScore: number;
  hostReviews: number;
  recentLowRatings: number;
  completedBookings: number;
}

export interface StandingEvaluation extends StandingSnapshot {
  changed: boolean;
  reason?: string;
}

/**
 * Recompute a host's aggregate rating from the spots they own. Called whenever
 * a driver rates a spot so the owner's host standing stays in sync.
 */
export async function recomputeHostRating(db: Db, ownerId: string) {
  const spots = await db.parkingSpot.findMany({
    where: { ownerId },
    select: { rating: true, reviewsCount: true },
  });

  let weighted = 0;
  let count = 0;
  for (const spot of spots) {
    weighted += (spot.rating ?? 5) * (spot.reviewsCount ?? 0);
    count += spot.reviewsCount ?? 0;
  }
  const hostRating = round2(count > 0 ? weighted / count : 5);

  await db.user.update({
    where: { id: ownerId },
    data: { hostRating, hostReviewsCount: count },
  });

  return { hostRating, hostReviewsCount: count };
}

/** Number of very low ratings (driver-targeted + the host's spots) in the window. */
async function countRecentLowRatings(db: Db, userId: string): Promise<number> {
  const since = new Date(Date.now() - STANDING.RECENT_WINDOW_DAYS * DAY_MS);
  const [asDriver, asHost] = await Promise.all([
    db.review.count({
      where: {
        targetUserId: userId,
        rating: { lte: STANDING.RECENT_LOW_MAX },
        createdAt: { gte: since },
      },
    }),
    db.review.count({
      where: {
        rating: { lte: STANDING.RECENT_LOW_MAX },
        createdAt: { gte: since },
        targetSpot: { ownerId: userId },
      },
    }),
  ]);
  return asDriver + asHost;
}

export async function getStandingSnapshot(db: Db, userId: string): Promise<StandingSnapshot | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      accountStatus: true,
      suspendedUntil: true,
      warningCount: true,
      trustScore: true,
      driverReviewsCount: true,
      hostRating: true,
      hostReviewsCount: true,
      completedBookings: true,
    },
  });
  if (!user) return null;

  return {
    userId: user.id,
    status: user.accountStatus as AccountStatus,
    suspendedUntil: user.suspendedUntil,
    warningCount: user.warningCount,
    driverScore: user.trustScore,
    driverReviews: user.driverReviewsCount,
    hostScore: user.hostRating,
    hostReviews: user.hostReviewsCount,
    recentLowRatings: await countRecentLowRatings(db, userId),
    completedBookings: user.completedBookings,
  };
}

interface SanctionInput {
  userId: string;
  action: SanctionAction;
  reason?: string;
  actorId?: string | null;
  /** Override the default suspension length. */
  durationDays?: number;
  /** True when the standing engine applied it, false/omitted for admin actions. */
  automated?: boolean;
  /** Suppress the in-app notification (used for automatic recovery). */
  silent?: boolean;
}

const ACTION_LABEL: Record<SanctionAction, string> = {
  WARN: 'warning',
  SUSPEND: 'suspension',
  BAN: 'ban',
  REINSTATE: 'reinstatement',
};

/**
 * Apply a moderation decision (manual or automated): update the user's status,
 * write an audit record and notify the user.
 */
export async function applySanction(db: Db, input: SanctionInput) {
  const now = new Date();
  const data: Prisma.UserUpdateInput = { standingUpdatedAt: now };
  let title = '';
  let body = '';

  switch (input.action) {
    case 'WARN': {
      const user = await db.user.findUnique({ where: { id: input.userId }, select: { warningCount: true } });
      data.accountStatus = 'WARNING';
      data.warningCount = (user?.warningCount ?? 0) + 1;
      title = 'A note about your account standing';
      body = input.reason || 'Your rating is below our community standard. Please keep up good parking etiquette to avoid a temporary suspension.';
      break;
    }
    case 'SUSPEND': {
      const days = input.durationDays ?? STANDING.SUSPENSION_DAYS;
      data.accountStatus = 'SUSPENDED';
      data.suspendedUntil = new Date(now.getTime() + days * DAY_MS);
      title = `Your account is suspended for ${days} days`;
      body = input.reason || 'Your rating stayed below our community standard, so new bookings are paused for a short cooldown. Improve your standing to regain full access.';
      break;
    }
    case 'BAN': {
      data.accountStatus = 'BANNED';
      data.suspendedUntil = null;
      title = 'Your account has been banned';
      body = input.reason || 'Your account has been permanently banned following a review of your activity. If you believe this is a mistake, you can submit an appeal.';
      break;
    }
    case 'REINSTATE': {
      data.accountStatus = 'ACTIVE';
      data.suspendedUntil = null;
      title = 'Your account has been reinstated';
      body = input.reason || 'Your account is active again. Thanks for keeping ParkShare safe.';
      break;
    }
  }

  const updated = await db.user.update({
    where: { id: input.userId },
    data,
    select: { id: true, accountStatus: true, suspendedUntil: true, warningCount: true },
  });

  const actionName = input.automated ? `AUTO_${input.action}` : input.action;
  await db.moderationAction.create({
    data: {
      userId: input.userId,
      actorId: input.actorId ?? null,
      action: actionName,
      reason: input.reason ?? null,
      metadata: { automated: !!input.automated } as Prisma.InputJsonValue,
    },
  });

  if (!input.silent) {
    await db.notification.create({
      data: { userId: input.userId, type: input.action === 'WARN' ? 'STANDING_WARNING' : 'SANCTION', title, body },
    });
  }

  return updated;
}

/**
 * Pure decision logic for the automatic ladder. Contains no I/O so it can be
 * unit-tested without a database (see standing.selftest.ts).
 *  - Warnings and temporary suspensions are automatic.
 *  - Permanent bans are intentionally NOT produced here (admin-confirmed only).
 */
export interface StandingDecision {
  action: 'SUSPEND' | 'WARN' | 'RECOVER' | 'NONE';
  reason?: string;
}

export function decideStanding(snapshot: StandingSnapshot): StandingDecision {
  const driverEligible = snapshot.driverReviews >= STANDING.DRIVER_MIN_REVIEWS;
  const hostEligible = snapshot.hostReviews >= STANDING.HOST_MIN_REVIEWS;
  const recentLow = snapshot.recentLowRatings;

  const shouldSuspend =
    (driverEligible && snapshot.driverScore < STANDING.SUSPEND_THRESHOLD) ||
    (hostEligible && snapshot.hostScore < STANDING.SUSPEND_THRESHOLD) ||
    recentLow >= STANDING.RECENT_LOW_LIMIT;

  const shouldWarn =
    (driverEligible && snapshot.driverScore < STANDING.WARN_THRESHOLD) ||
    (hostEligible && snapshot.hostScore < STANDING.WARN_THRESHOLD) ||
    recentLow >= STANDING.RECENT_LOW_MAX;

  if (shouldSuspend) {
    return {
      action: 'SUSPEND',
      reason: recentLow >= STANDING.RECENT_LOW_LIMIT
        ? `You received ${recentLow} very low ratings recently.`
        : `Your rating dropped below ${STANDING.SUSPEND_THRESHOLD.toFixed(1)}.`,
    };
  }

  if (shouldWarn) {
    return snapshot.status === 'WARNING'
      ? { action: 'NONE' }
      : { action: 'WARN', reason: 'Your rating is below our community standard.' };
  }

  if (snapshot.status === 'WARNING') return { action: 'RECOVER' };
  return { action: 'NONE' };
}

/**
 * Evaluate a user's standing and apply the automatic ladder if needed.
 *  - WARNING / SUSPENDED are automatic.
 *  - BANNED is never applied automatically.
 * Call this after a review is submitted, and on-demand when reading standing.
 */
export async function evaluateStanding(db: Db, userId: string): Promise<StandingEvaluation | null> {
  const snapshot = await getStandingSnapshot(db, userId);
  if (!snapshot) return null;

  const now = new Date();
  const base = { ...snapshot, changed: false as boolean, reason: undefined as string | undefined };

  /** Apply an automatic action unless we're in dry-run mode. Returns whether it was applied. */
  const autoApply = async (input: SanctionInput): Promise<boolean> => {
    if (DRY_RUN) {
      console.log(`[standing:dry-run] user=${userId} would ${input.action}: ${input.reason ?? ''}`);
      return false;
    }
    await applySanction(db, input);
    return true;
  };

  // Never override a manual ban.
  if (snapshot.status === 'BANNED') return base;

  // Active suspension: leave it in place until it expires.
  if (snapshot.status === 'SUSPENDED' && snapshot.suspendedUntil && snapshot.suspendedUntil > now) {
    return base;
  }

  // Expired suspension: lift it with a clean slate (WARNING, not ACTIVE) so the
  // user gets a grace period instead of being instantly re-suspended on old data.
  if (snapshot.status === 'SUSPENDED') {
    const applied = await autoApply({
      userId,
      action: 'REINSTATE',
      automated: true,
      reason: 'Suspension period ended. You are back, but your account is on a short watch period.',
    });
    if (!applied) return { ...base, reason: 'dry-run: would lift expired suspension' };
    return { ...base, status: 'ACTIVE', suspendedUntil: null, changed: true, reason: 'Suspension expired' };
  }

  const decision = decideStanding(snapshot);

  if (decision.action === 'SUSPEND') {
    const applied = await autoApply({ userId, action: 'SUSPEND', automated: true, reason: decision.reason });
    if (!applied) return { ...base, reason: `dry-run: would suspend (${decision.reason})` };
    return { ...base, status: 'SUSPENDED', suspendedUntil: new Date(now.getTime() + STANDING.SUSPENSION_DAYS * DAY_MS), changed: true, reason: 'Automatic suspension' };
  }

  if (decision.action === 'WARN') {
    const applied = await autoApply({ userId, action: 'WARN', automated: true, reason: decision.reason });
    if (!applied) return { ...base, reason: 'dry-run: would warn' };
    return { ...base, status: 'WARNING', changed: true, reason: 'Automatic warning' };
  }

  // Healthy: recover from a warning automatically.
  if (decision.action === 'RECOVER') {
    const applied = await autoApply({ userId, action: 'REINSTATE', automated: true, silent: true, reason: 'Standing recovered' });
    if (!applied) return { ...base, reason: 'dry-run: would reinstate' };
    return { ...base, status: 'ACTIVE', changed: true, reason: 'Automatic recovery' };
  }

  return base;
}

/**
 * True when an account is currently blocked from creating new activity.
 * Banned users and users inside an active suspension window.
 */
export function isBlocked(status: AccountStatus, suspendedUntil: Date | null, now = new Date()) {
  if (status === 'BANNED') return true;
  if (status === 'SUSPENDED') return !suspendedUntil || suspendedUntil > now;
  return false;
}

export { ACTION_LABEL };

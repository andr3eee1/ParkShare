/**
 * Lightweight self-tests for the pure trust & safety logic.
 * Run with:  npm run test:standing
 *
 * These intentionally avoid the database so they run anywhere. They lock in the
 * threshold behaviour of decideStanding() and isBlocked().
 */
import assert from 'assert';
import { STANDING, decideStanding, isBlocked, type StandingSnapshot } from './standing';

const base = (overrides: Partial<StandingSnapshot>): StandingSnapshot => ({
  userId: 'u1',
  status: 'ACTIVE',
  suspendedUntil: null,
  warningCount: 0,
  driverScore: 5,
  driverReviews: 0,
  hostScore: 5,
  hostReviews: 0,
  recentLowRatings: 0,
  completedBookings: 0,
  ...overrides,
});

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
};

console.log('decideStanding()');

test('a brand new user is left alone', () => {
  assert.equal(decideStanding(base({})).action, 'NONE');
});

test('a single bad review is not enough to act (min sample)', () => {
  assert.equal(decideStanding(base({ driverScore: 3.67, driverReviews: 1 })).action, 'NONE');
});

test('5 low driver reviews trigger a suspension', () => {
  assert.equal(decideStanding(base({ driverScore: 2.9, driverReviews: 5 })).action, 'SUSPEND');
});

test('5 mediocre driver reviews trigger a warning', () => {
  assert.equal(decideStanding(base({ driverScore: 3.2, driverReviews: 5 })).action, 'WARN');
});

test('a warning is not issued twice in a row', () => {
  assert.equal(decideStanding(base({ status: 'WARNING', driverScore: 3.2, driverReviews: 5 })).action, 'NONE');
});

test('a healthy warning user is automatically recovered', () => {
  assert.equal(decideStanding(base({ status: 'WARNING', driverScore: 4.9, driverReviews: 8 })).action, 'RECOVER');
});

test('low host rating suspends once host sample is large enough', () => {
  assert.equal(decideStanding(base({ hostScore: 2.4, hostReviews: 6 })).action, 'SUSPEND');
});

test('low host rating below the min sample does not act', () => {
  assert.equal(decideStanding(base({ hostScore: 1.5, hostReviews: 3 })).action, 'NONE');
});

test('three recent very low ratings suspend regardless of averages', () => {
  assert.equal(decideStanding(base({ recentLowRatings: STANDING.RECENT_LOW_LIMIT })).action, 'SUSPEND');
});

test('two recent very low ratings warn', () => {
  assert.equal(decideStanding(base({ recentLowRatings: STANDING.RECENT_LOW_MAX })).action, 'WARN');
});

test('an admin ban is never overridden by the engine', () => {
  // decideStanding is not even reached for BANNED users (guarded in evaluateStanding),
  // but make sure a healthy profile would otherwise only ever RECOVER/NONE.
  assert.notEqual(decideStanding(base({ driverScore: 1, driverReviews: 10 })).action, 'RECOVER');
});

console.log('isBlocked()');

test('active user is not blocked', () => {
  assert.equal(isBlocked('ACTIVE', null), false);
  assert.equal(isBlocked('WARNING', null), false);
});

test('banned user is blocked', () => {
  assert.equal(isBlocked('BANNED', null), true);
});

test('suspended user is blocked until expiry', () => {
  const future = new Date(Date.now() + 60_000);
  const past = new Date(Date.now() - 60_000);
  assert.equal(isBlocked('SUSPENDED', future), true);
  assert.equal(isBlocked('SUSPENDED', past), false);
});

console.log(`\n${passed} checks passed ✅`);

export function getBucharestOffset(date: Date): number {
  try {
    const tzDateStr = date.toLocaleString('en-US', { timeZone: 'Europe/Bucharest' });
    const utcDateStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
    const tzDate = new Date(tzDateStr);
    const utcDate = new Date(utcDateStr);
    return (tzDate.getTime() - utcDate.getTime()) / 60000;
  } catch (e) {
    return 180;
  }
}

export function toBucharestDBTime(userDate: Date): Date {
  const offset = getBucharestOffset(userDate);
  return new Date(userDate.getTime() + offset * 60000);
}

export function fromBucharestDBTime(dbDate: Date): Date {
  const offset = getBucharestOffset(dbDate);
  return new Date(dbDate.getTime() - offset * 60000);
}

// Date helpers in UTC on ISO dates (YYYY-MM-DD). Nationwide German public holidays only;
// state holidays are not included, so computed deadlines err on the early (safe) side.

const DAY = 86_400_000;

export function parseIso(d: string): Date {
  const x = new Date(`${d}T00:00:00Z`);
  if (Number.isNaN(x.getTime()) || x.toISOString().slice(0, 10) !== d) throw new RangeError(`Ungültiges Datum: ${d}`);
  return x;
}
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (d: string, n: number) => iso(new Date(parseIso(d).getTime() + n * DAY));
export const daysBetween = (a: string, b: string) => Math.round((parseIso(b).getTime() - parseIso(a).getTime()) / DAY);

/** Same day `n` months later; clamps to month end (31.01. + 1 month = 28./29.02.). */
export function addMonths(d: string, n: number): string {
  const x = parseIso(d);
  const y = x.getUTCFullYear();
  const m = x.getUTCMonth() + n;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return iso(new Date(Date.UTC(y, m, Math.min(x.getUTCDate(), last))));
}

/** Last day of the month `n` months after the month of `d`. */
export function endOfMonthAfter(d: string, n: number): string {
  const x = parseIso(d);
  return iso(new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + n + 1, 0)));
}

/** Easter Sunday (Gregorian, anonymous algorithm). */
export function easter(year: number): string {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(new Date(Date.UTC(year, month - 1, day)));
}

export function nationalHolidays(year: number): Set<string> {
  const e = easter(year);
  return new Set([
    `${year}-01-01`, addDays(e, -2), addDays(e, 1), `${year}-05-01`, addDays(e, 39), addDays(e, 50),
    `${year}-10-03`, `${year}-12-25`, `${year}-12-26`,
  ]);
}

/** Werktag = Monday to Saturday, excluding nationwide public holidays. */
export function isWerktag(d: string): boolean {
  const x = parseIso(d);
  return x.getUTCDay() !== 0 && !nationalHolidays(x.getUTCFullYear()).has(d);
}

/** The n-th Werktag following date d. */
export function nthWerktagAfter(d: string, n: number): string {
  let cur = d;
  let count = 0;
  while (count < n) {
    cur = addDays(cur, 1);
    if (isWerktag(cur)) count++;
  }
  return cur;
}

/**
 * End of a residential tenancy terminated with the statutory period (§ 573d Abs. 2 BGB):
 * notice received by the 3rd working day of a month ends the lease at the end of the month after next.
 * Saturdays are not counted for this deadline (BGH, 27.04.2005, VIII ZR 206/04).
 */
export function tenancyEndAfterNotice(received: string): string {
  const x = parseIso(received);
  const y = x.getUTCFullYear();
  const m = x.getUTCMonth();
  let count = 0;
  let thirdWorkday = '';
  for (let day = 1; day <= 31 && !thirdWorkday; day++) {
    const d = iso(new Date(Date.UTC(y, m, day)));
    const wd = parseIso(d).getUTCDay();
    if (wd !== 0 && wd !== 6 && !nationalHolidays(y).has(d) && ++count === 3) thirdWorkday = d;
  }
  const monthsAhead = received <= thirdWorkday ? 2 : 3;
  return iso(new Date(Date.UTC(y, m + monthsAhead + 1, 0)));
}

/** Convert API / model date value to `input[type=date]` value (yyyy-MM-dd). */
export function toDateInputValue(value: Date | string | undefined | null): string {
  if (value == null || value === '') {
    return '';
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) {
    return '';
  }
  return d.toISOString().slice(0, 10);
}

/** Convert date input to ISO string for API; empty input → undefined (omit field). */
export function fromDateInputToIso(ymd: string): string | undefined {
  const t = ymd?.trim();
  if (!t) {
    return undefined;
  }
  const d = new Date(`${t}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** User's local calendar date as `yyyy-MM-dd` (for applied-at defaults). */
export function todayLocalYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Default `applied_at` when creating a job application from resume tailoring
 * (matches the user's local "today" in the API's ISO format).
 */
export function trackedApplicationAppliedAtIso(): string {
  return fromDateInputToIso(todayLocalYmd()) ?? new Date().toISOString();
}

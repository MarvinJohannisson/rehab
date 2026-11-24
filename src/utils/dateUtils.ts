import type { WorkoutLog } from '../types';

export const SWEDISH_MONTHS = [
  'Januari',
  'Februari',
  'Mars',
  'April',
  'Maj',
  'Juni',
  'Juli',
  'Augusti',
  'September',
  'Oktober',
  'November',
  'December',
];

export const SWEDISH_WEEKDAYS_SHORT = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

export function toLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatSwedishDate(dateKey: string): string {
  const date = parseLocalDateKey(dateKey);
  const weekday = date.toLocaleDateString('sv-SE', { weekday: 'long' });
  const day = date.getDate();
  const month = SWEDISH_MONTHS[date.getMonth()].toLowerCase();
  const year = date.getFullYear();
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} ${month} ${year}`;
}

export function formatDurationMinutes(seconds: number): string {
  const totalMins = Math.max(1, Math.round(seconds / 60));
  return `${totalMins} min`;
}

export function formatClock(seconds: number): string {
  const clamped = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  if (mins > 0) {
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
  return `${secs}`;
}

/** Returns Monday 00:00 of the week containing `date` */
export function startOfIsoWeek(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay(); // 0 = Sun, 1 = Mon ...
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

export function countWorkoutsThisWeek(logs: WorkoutLog[], now: Date = new Date()): number {
  const weekStart = startOfIsoWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const uniqueDays = new Set<string>();
  for (const log of logs) {
    const d = parseLocalDateKey(log.date);
    if (d >= weekStart && d < weekEnd) {
      uniqueDays.add(log.date);
    }
  }
  return uniqueDays.size;
}

export function countWorkoutsInMonth(
  logs: WorkoutLog[],
  year: number,
  monthIndex: number
): number {
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}-`;
  const uniqueDays = new Set<string>();
  for (const log of logs) {
    if (log.date.startsWith(prefix)) {
      uniqueDays.add(log.date);
    }
  }
  return uniqueDays.size;
}

/** Counts consecutive weeks (ending this week or last week) with at least 1 logged session */
export function calculateActiveWeekStreak(logs: WorkoutLog[], now: Date = new Date()): number {
  if (logs.length === 0) return 0;

  const activeWeeks = new Set<string>();
  for (const log of logs) {
    const start = startOfIsoWeek(parseLocalDateKey(log.date));
    activeWeeks.add(toLocalDateKey(start));
  }

  let cursor = startOfIsoWeek(now);
  if (!activeWeeks.has(toLocalDateKey(cursor))) {
    // Allow streak to continue if user hasn't trained yet this week, checking last week
    cursor.setDate(cursor.getDate() - 7);
    if (!activeWeeks.has(toLocalDateKey(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (activeWeeks.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

export interface CalendarCell {
  dateKey: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
}

/** Builds a Monday-first 6-row (or 5-row) calendar grid for a given year and 0-indexed month */
export function buildMonthGrid(year: number, monthIndex: number): CalendarCell[] {
  const todayKey = toLocalDateKey(new Date());
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Monday = 0, Sunday = 6
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const cells: CalendarCell[] = [];

  // Leading days from previous month
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, monthIndex, -i);
    cells.push({
      dateKey: toLocalDateKey(d),
      dayNumber: d.getDate(),
      inCurrentMonth: false,
      isToday: toLocalDateKey(d) === todayKey,
    });
  }

  // Days in current month
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthIndex, day);
    const key = toLocalDateKey(d);
    cells.push({
      dateKey: key,
      dayNumber: day,
      inCurrentMonth: true,
      isToday: key === todayKey,
    });
  }

  // Trailing days to finish the final week row
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    const needed = 7 - remainder;
    for (let i = 1; i <= needed; i++) {
      const d = new Date(year, monthIndex + 1, i);
      cells.push({
        dateKey: toLocalDateKey(d),
        dayNumber: d.getDate(),
        inCurrentMonth: false,
        isToday: toLocalDateKey(d) === todayKey,
      });
    }
  }

  return cells;
}

import { TimeBlock } from '@/types';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { de } from 'date-fns/locale';

/** Calculate hours between two time strings ("HH:mm") */
export function calculateHours(start: string, end: string): number {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return Math.max(0, (endMinutes - startMinutes) / 60);
}

/** Calculate total hours for all time blocks minus break */
export function calculateTotalHours(blocks: TimeBlock[], breakMinutes: number = 0): number {
  const grossHours = blocks.reduce((sum, block) => {
    return sum + calculateHours(block.start, block.end);
  }, 0);
  const netHours = grossHours - breakMinutes / 60;
  return Math.round(Math.max(0, netHours) * 100) / 100;
}

/** Check if time blocks overlap */
export function hasOverlap(blocks: TimeBlock[]): boolean {
  const sorted = [...blocks].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].end > sorted[i + 1].start) {
      return true;
    }
  }
  return false;
}

/** Check if entry is within the 7-day deadline (§ 17 MiLoG) */
export function isWithin7Days(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = parseISO(dateStr);
  return differenceInCalendarDays(today, date) <= 7;
}

/** Get German weekday name */
export function getWeekday(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE', { locale: de });
}

/** Format hours for display (e.g. 7.75 -> "7:45 Std.") */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')} Std.`;
}

/** Format date for display */
export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: de });
}

/** Format date short */
export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'dd.MM.', { locale: de });
}

/** Format time blocks for display: "10:00-15:00, 16:00-19:00" */
export function formatTimeBlocks(blocks: TimeBlock[]): string {
  return blocks.map((b) => `${b.start}-${b.end}`).join(', ');
}

/** Get German month name */
export function getMonthName(month: number): string {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ];
  return months[month - 1] || '';
}

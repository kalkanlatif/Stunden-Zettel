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

/** Calculate total hours for all time blocks (sum of each block's duration) */
export function calculateTotalHours(blocks: TimeBlock[]): number {
  const totalHours = blocks.reduce((sum, block) => {
    return sum + calculateHours(block.start, block.end);
  }, 0);
  return Math.round(Math.max(0, totalHours) * 100) / 100;
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

/** Format minutes for display (e.g. 45 -> "45 Min.", 90 -> "1:30 Std.") */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} Min.`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} Std.` : `${h}:${m.toString().padStart(2, '0')} Std.`;
}

/** Format date for display */
export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: de });
}

/** Format date short */
export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'dd.MM.', { locale: de });
}

/** Format time blocks for display: "10:00–15:00, 16:00–19:00" */
export function formatTimeBlocks(blocks: TimeBlock[]): string {
  return blocks.map((b) => `${b.start}–${b.end}`).join(', ');
}

export interface PauseBlock {
  start: string; // end time of the preceding shift
  end: string;   // start time of the next shift
  minutes: number;
}

/** Calculate pauses (gaps) between consecutive sorted time blocks */
export function calculatePauses(blocks: TimeBlock[]): PauseBlock[] {
  const sorted = [...blocks]
    .filter((b) => b.start && b.end && b.end > b.start)
    .sort((a, b) => a.start.localeCompare(b.start));

  const pauses: PauseBlock[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const gapStart = sorted[i].end;
    const gapEnd = sorted[i + 1].start;
    if (gapEnd > gapStart) {
      const [sh, sm] = gapStart.split(':').map(Number);
      const [eh, em] = gapEnd.split(':').map(Number);
      const minutes = (eh * 60 + em) - (sh * 60 + sm);
      if (minutes > 0) pauses.push({ start: gapStart, end: gapEnd, minutes });
    }
  }
  return pauses;
}

/** Format time blocks with pause indicators between shifts */
export function formatTimeBlocksWithPauses(blocks: TimeBlock[]): string {
  const sorted = [...blocks]
    .filter((b) => b.start && b.end)
    .sort((a, b) => a.start.localeCompare(b.start));

  if (sorted.length === 0) return '';
  if (sorted.length === 1) return `${sorted[0].start}–${sorted[0].end}`;

  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    parts.push(`${sorted[i].start}–${sorted[i].end}`);
    if (i < sorted.length - 1) {
      const [sh, sm] = sorted[i].end.split(':').map(Number);
      const [eh, em] = sorted[i + 1].start.split(':').map(Number);
      const pauseMin = (eh * 60 + em) - (sh * 60 + sm);
      if (pauseMin > 0) {
        parts.push(`☕ ${formatMinutes(pauseMin)}`);
      }
    }
  }
  return parts.join(' · ');
}

/** Get German month name */
export function getMonthName(month: number): string {
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ];
  return months[month - 1] || '';
}

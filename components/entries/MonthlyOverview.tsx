'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { TimeEntry, Absence } from '@/types';
import { formatDate, getWeekday, formatHours, calculatePauses, formatMinutes, getMonthName } from '@/lib/utils/time';
import { ABSENCE_BADGE_COLORS } from '@/lib/constants';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Props {
  entries: TimeEntry[];
  absences: Absence[];
  loading: boolean;
  missingDays?: number;
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
  onEditDate: (date: string) => void;
  onRefreshEntries: () => void;
  onRefreshAbsences: () => void;
}

function TimeBlocksWithPauses({ entry }: { entry: TimeEntry }) {
  const sorted = [...entry.time_blocks].sort((a, b) => a.start.localeCompare(b.start));
  const pauses = calculatePauses(entry.time_blocks);

  if (sorted.length <= 1) {
    return (
      <p className="mt-0.5 text-[11px] text-neutral-500">
        {sorted[0] ? `${sorted[0].start}–${sorted[0].end}` : ''}
      </p>
    );
  }

  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
      {sorted.map((block, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-[11px] text-neutral-500">{block.start}–{block.end}</span>
          {i < sorted.length - 1 && pauses[i] && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
              ☕ {formatMinutes(pauses[i].minutes)}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function MonthlyOverview({
  entries, absences, loading, missingDays = 0,
  month, year, onMonthChange, onEditDate,
  onRefreshEntries, onRefreshAbsences,
}: Props) {
  const { toast } = useToast();
  const sorted = [...entries].sort((a, b) => a.work_date.localeCompare(b.work_date));
  const sortedAbsences = [...absences].sort((a, b) => a.absence_date.localeCompare(b.absence_date));
  const totalHours = sorted.reduce((sum, e) => sum + Number(e.total_hours), 0);

  // Maps for mini calendar
  const entryMap = new Map<string, number>();
  entries.forEach((e) => entryMap.set(e.work_date, Number(e.total_hours)));
  const absenceMap = new Map<string, string>();
  absences.forEach((a) => absenceMap.set(a.absence_date, a.absence_type));

  // Calendar grid
  const viewDate = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const goPrev = () => {
    if (month === 1) onMonthChange(12, year - 1);
    else onMonthChange(month - 1, year);
  };
  const goNext = () => {
    if (month === 12) onMonthChange(1, year + 1);
    else onMonthChange(month + 1, year);
  };

  // Delete handlers
  const handleDeleteEntry = async (entry: TimeEntry) => {
    if (!confirm(`Eintrag vom ${formatDate(entry.work_date)} wirklich löschen?`)) return;
    try {
      const res = await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        toast({ title: 'Fehler', description: json.error || 'Löschen fehlgeschlagen', variant: 'destructive' });
        return;
      }
      toast({ title: 'Gelöscht', description: 'Eintrag wurde entfernt.' });
      onRefreshEntries();
    } catch {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
    }
  };

  const handleDeleteAbsence = async (absence: Absence) => {
    if (!confirm(`Abwesenheit vom ${formatDate(absence.absence_date)} wirklich löschen?`)) return;
    try {
      const res = await fetch(`/api/absences/${absence.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: 'Gelöscht', description: 'Abwesenheit wurde entfernt.' });
      onRefreshAbsences();
    } catch {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
    }
  };

  // Merge for day list
  type DayItem =
    | { type: 'entry'; date: string; entry: TimeEntry }
    | { type: 'absence'; date: string; absence: Absence };

  const dayItems: DayItem[] = [
    ...sorted.map((e) => ({ type: 'entry' as const, date: e.work_date, entry: e })),
    ...sortedAbsences.map((a) => ({ type: 'absence' as const, date: a.absence_date, absence: a })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-3">
      {/* Mini calendar */}
      <div
        className="rounded-2xl border border-white/80 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={goPrev} className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-amber-900">{getMonthName(month)} {year}</span>
          <button type="button" onClick={goNext} className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="text-center text-[8px] font-bold uppercase tracking-wider text-neutral-400 py-1">{wd}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            const dateStr = format(d, 'yyyy-MM-dd');
            const inMonth = isSameMonth(d, viewDate);
            const isToday = dateStr === todayStr;
            const hours = entryMap.get(dateStr);
            const absType = absenceMap.get(dateStr);
            const dayNum = format(d, 'd');

            let cellClass = 'bg-neutral-50 text-neutral-300';
            if (inMonth) {
              if (hours && hours > 0) {
                if (hours >= 8) cellClass = 'bg-amber-400 text-white font-bold';
                else if (hours >= 5) cellClass = 'bg-amber-300 text-amber-900 font-semibold';
                else cellClass = 'bg-amber-200 text-amber-800';
              } else if (absType) {
                if (absType === 'Urlaub') cellClass = 'bg-blue-300 text-blue-900 font-semibold';
                else if (absType === 'Krank') cellClass = 'bg-red-300 text-red-900 font-semibold';
                else if (absType === 'Feiertag') cellClass = 'bg-green-300 text-green-900 font-semibold';
                else cellClass = 'bg-orange-200 text-orange-800';
              } else {
                cellClass = 'bg-neutral-100 text-neutral-500';
              }
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => inMonth && onEditDate(dateStr)}
                className={`relative flex h-8 items-center justify-center rounded-lg text-[10px] transition-all ${cellClass} ${
                  !inMonth ? 'opacity-30' : 'hover:ring-2 hover:ring-amber-400/50'
                }`}
              >
                {dayNum}
                {isToday && inMonth && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-amber-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-amber-400" /><span className="text-[9px] text-neutral-500">8+ Std.</span></div>
          <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-amber-200" /><span className="text-[9px] text-neutral-500">&lt;5 Std.</span></div>
          <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-blue-300" /><span className="text-[9px] text-neutral-500">Urlaub</span></div>
          <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-red-300" /><span className="text-[9px] text-neutral-500">Krank</span></div>
          <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-green-300" /><span className="text-[9px] text-neutral-500">Feiertag</span></div>
        </div>
      </div>

      {/* MiLoG warning */}
      {missingDays > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800">
            {missingDays} Tage ohne Eintrag (letzte 5–7 Tage). Bitte gem. § 17 MiLoG innerhalb von 7 Tagen nachtragen!
          </p>
        </div>
      )}

      {/* Day-by-day list */}
      <div
        className="rounded-2xl border border-white/80 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : dayItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">
            Noch keine Einträge in diesem Monat.
          </p>
        ) : (
          <div className="space-y-1.5">
            {dayItems.map((item) => {
              if (item.type === 'entry') {
                const entry = item.entry;
                return (
                  <div key={`e-${entry.id}`} className="flex items-center gap-2 rounded-xl bg-amber-50/50 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-amber-900">{formatDate(entry.work_date)}</span>
                        <span className="text-[11px] text-neutral-400">{getWeekday(entry.work_date)}</span>
                      </div>
                      <TimeBlocksWithPauses entry={entry} />
                    </div>
                    <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-bold text-amber-900 shadow-sm">
                      {formatHours(Number(entry.total_hours))}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditDate(entry.work_date)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-400 transition-colors hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              } else {
                const absence = item.absence;
                return (
                  <div key={`a-${absence.id}`} className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-700">{formatDate(absence.absence_date)}</span>
                        <span className="text-[11px] text-neutral-400">{getWeekday(absence.absence_date)}</span>
                      </div>
                      {absence.notes && <p className="mt-0.5 text-[11px] text-neutral-400">{absence.notes}</p>}
                    </div>
                    <Badge className={`shrink-0 text-[10px] ${ABSENCE_BADGE_COLORS[absence.absence_type]}`}>
                      {absence.absence_type}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => handleDeleteAbsence(absence)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-400 transition-colors hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              }
            })}

            {/* Total */}
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-400/20 to-amber-500/20 px-3 py-3 mt-1">
              <span className="text-sm font-semibold text-amber-800">
                {sorted.length} {sorted.length === 1 ? 'Arbeitstag' : 'Arbeitstage'}
                {sortedAbsences.length > 0 && ` · ${sortedAbsences.length} Abwesend`}
              </span>
              <span className="text-base font-bold text-amber-900">
                {formatHours(totalHours)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

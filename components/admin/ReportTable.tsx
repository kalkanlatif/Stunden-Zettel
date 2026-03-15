'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, FileDown, CalendarOff } from 'lucide-react';
import { EmployeeReport } from '@/hooks/useMonthlyReport';
import { Absence } from '@/types';
import { EMPLOYMENT_BADGE_COLORS, ABSENCE_BADGE_COLORS } from '@/lib/constants';
import { formatDate, getWeekday, formatTimeBlocks, formatHours, formatMinutes } from '@/lib/utils/time';

interface Props {
  report: EmployeeReport[];
  absences: Absence[];
  month: number;
  year: number;
}

const GLASS =
  'rounded-2xl border border-white/80 bg-white/60 shadow-sm backdrop-blur-xl';
const GLASS_STYLE = {
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

export function ReportTable({ report, absences, month, year }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const downloadPdf = (employeeId: string) => {
    const url = `/api/export/pdf?employee_id=${employeeId}&month=${month}&year=${year}`;
    window.open(url, '_blank');
  };

  // Group absences by employee
  const absencesByEmployee = useMemo(() => {
    const map = new Map<string, Absence[]>();
    absences.forEach((a) => {
      const list = map.get(a.employee_id) || [];
      list.push(a);
      map.set(a.employee_id, list);
    });
    return map;
  }, [absences]);

  if (report.length === 0) {
    return (
      <div className={`${GLASS} p-8`} style={GLASS_STYLE}>
        <p className="text-center text-sm text-neutral-400">
          Keine Einträge für den gewählten Zeitraum.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {report.map((r) => {
        const empAbsences = absencesByEmployee.get(r.employee.id) || [];
        const isOpen = expanded.has(r.employee.id);
        const avgHours = r.workDays > 0 ? r.totalHours / r.workDays : 0;

        // Merge entries + absences for detail view
        type DayRow =
          | { type: 'entry'; date: string; entry: (typeof r.entries)[0] }
          | { type: 'absence'; date: string; absence: Absence };

        const dayRows: DayRow[] = [
          ...r.entries.map((e) => ({ type: 'entry' as const, date: e.work_date, entry: e })),
          ...empAbsences.map((a) => ({ type: 'absence' as const, date: a.absence_date, absence: a })),
        ].sort((a, b) => a.date.localeCompare(b.date));

        return (
          <div key={r.employee.id} className={GLASS} style={GLASS_STYLE}>
            {/* Summary row */}
            <button
              type="button"
              onClick={() => toggleExpand(r.employee.id)}
              className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-amber-50/30 rounded-2xl"
            >
              {/* Expand icon */}
              <span className="text-neutral-300 shrink-0">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>

              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-400 text-xs font-bold text-amber-900">
                {r.employee.first_name[0]}{r.employee.last_name[0]}
              </div>

              {/* Name + badge */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-amber-900">
                  {r.employee.first_name} {r.employee.last_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={`text-[9px] ${EMPLOYMENT_BADGE_COLORS[r.employee.employment_type]}`}>
                    {r.employee.employment_type}
                  </Badge>
                  <span className="text-[10px] text-neutral-400">
                    {r.workDays} Tage · Ø {formatHours(avgHours)}
                  </span>
                </div>
              </div>

              {/* Total hours */}
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-amber-900">{formatHours(r.totalHours)}</p>
                {empAbsences.length > 0 && (
                  <span className="text-[9px] text-neutral-400">
                    {empAbsences.length} Abwesend
                  </span>
                )}
              </div>

              {/* PDF button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); downloadPdf(r.employee.id); }}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-3 py-2 text-white shadow-sm transition-all hover:shadow-md active:scale-95"
                title="PDF herunterladen"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold">PDF</span>
              </button>
            </button>

            {/* Detail view */}
            {isOpen && (
              <div className="border-t border-neutral-100 px-4 pb-4 pt-2">
                {/* Column headers */}
                <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                  <span className="w-20 text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Datum</span>
                  <span className="w-16 text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Tag</span>
                  <span className="flex-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Arbeitszeit</span>
                  <span className="w-16 text-right text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Pause</span>
                  <span className="w-16 text-right text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Stunden</span>
                </div>

                <div className="space-y-1">
                  {dayRows.map((row) => {
                    if (row.type === 'entry') {
                      const entry = row.entry;
                      return (
                        <div key={`e-${entry.id}`} className="flex items-center gap-2 rounded-xl bg-amber-50/50 px-2 py-2">
                          <span className="w-20 text-xs font-medium text-amber-900">{formatDate(entry.work_date)}</span>
                          <span className="w-16 text-[11px] text-neutral-400">{getWeekday(entry.work_date)}</span>
                          <span className="flex-1 text-[11px] text-neutral-600">{formatTimeBlocks(entry.time_blocks)}</span>
                          <span className="w-16 text-right text-[11px] text-neutral-400">
                            {entry.break_minutes > 0 ? formatMinutes(entry.break_minutes) : '-'}
                          </span>
                          <span className="w-16 text-right text-xs font-bold text-amber-900">
                            {formatHours(Number(entry.total_hours))}
                          </span>
                        </div>
                      );
                    } else {
                      const absence = row.absence;
                      return (
                        <div key={`a-${absence.id}`} className="flex items-center gap-2 rounded-xl bg-neutral-100/70 px-2 py-2">
                          <span className="w-20 text-xs font-medium text-neutral-500">{formatDate(absence.absence_date)}</span>
                          <span className="w-16 text-[11px] text-neutral-400">{getWeekday(absence.absence_date)}</span>
                          <div className="flex flex-1 items-center gap-1.5">
                            <CalendarOff className="h-3 w-3 text-neutral-400" />
                            <Badge className={`text-[9px] ${ABSENCE_BADGE_COLORS[absence.absence_type]}`}>
                              {absence.absence_type}
                            </Badge>
                            {absence.notes && (
                              <span className="text-[10px] text-neutral-400">{absence.notes}</span>
                            )}
                          </div>
                          <span className="w-16 text-right text-[11px] text-neutral-400">-</span>
                          <span className="w-16 text-right text-xs text-neutral-400">-</span>
                        </div>
                      );
                    }
                  })}
                </div>

                {/* Totals */}
                <div className="mt-2 flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-400/20 to-amber-500/20 px-3 py-2.5">
                  <span className="text-xs font-semibold text-amber-800">
                    {r.workDays} {r.workDays === 1 ? 'Arbeitstag' : 'Arbeitstage'}
                    {empAbsences.length > 0 && ` · ${empAbsences.length} Abwesend`}
                  </span>
                  <span className="text-sm font-bold text-amber-900">{formatHours(r.totalHours)}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CalendarDays,
  AlertTriangle,
  CalendarOff,
  Euro,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Employee, Absence } from '@/types';
import { EmployeeReport } from '@/hooks/useMonthlyReport';
import { formatHours, getMonthName } from '@/lib/utils/time';
import {
  EMPLOYMENT_BADGE_COLORS,
  ABSENCE_BADGE_COLORS,
  MILOG_DEADLINE_DAYS,
  MINIJOB_LIMIT_EUR,
  MINIMUM_WAGE_EUR,
  MINIJOB_MAX_HOURS,
} from '@/lib/constants';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  differenceInCalendarDays,
  isBefore,
} from 'date-fns';

interface Props {
  report: EmployeeReport[];
  absences: Absence[];
  employees: Employee[];
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
  loading: boolean;
}

const GLASS =
  'rounded-2xl border border-white/80 bg-white/60 p-4 shadow-sm backdrop-blur-xl';
const GLASS_STYLE = {
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};
const SECTION_TITLE = 'text-[10px] font-semibold uppercase tracking-wider text-neutral-400';
const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function UebersichtPanel({
  report,
  absences,
  employees,
  month,
  year,
  onMonthChange,
  loading,
}: Props) {
  const activeEmployees = useMemo(
    () => employees.filter((e) => e.active),
    [employees],
  );

  const goPrev = () => {
    if (month === 1) onMonthChange(12, year - 1);
    else onMonthChange(month - 1, year);
  };
  const goNext = () => {
    if (month === 12) onMonthChange(1, year + 1);
    else onMonthChange(month + 1, year);
  };

  // Derived data
  const totalHoursAll = report.reduce((s, r) => s + r.totalHours, 0);
  const totalDaysAll = report.reduce((s, r) => s + r.workDays, 0);
  const sortedByHours = useMemo(
    () => [...report].sort((a, b) => b.totalHours - a.totalHours),
    [report],
  );
  const maxHours = sortedByHours[0]?.totalHours || 1;

  // Weekly distribution
  const weeklyData = useMemo(() => {
    const days = [0, 0, 0, 0, 0, 0, 0]; // Mo-So hours
    const counts = [0, 0, 0, 0, 0, 0, 0];
    report.forEach((r) =>
      r.entries.forEach((e) => {
        const d = new Date(e.work_date + 'T00:00:00');
        let idx = getDay(d) - 1; // getDay: 0=Sun
        if (idx < 0) idx = 6; // Sunday -> index 6
        days[idx] += Number(e.total_hours);
        counts[idx]++;
      }),
    );
    const maxDay = Math.max(...days, 1);
    return WEEKDAY_LABELS.map((label, i) => ({
      label,
      hours: days[i],
      count: counts[i],
      pct: (days[i] / maxDay) * 100,
      isWeekend: i >= 5,
    }));
  }, [report]);

  // MiLoG missing days
  const milогWarnings = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(monthStart);
    const end = isBefore(monthEnd, today) ? monthEnd : today;
    if (isBefore(end, monthStart)) return [];

    const allDays = eachDayOfInterval({ start: monthStart, end });

    return activeEmployees
      .map((emp) => {
        const empReport = report.find((r) => r.employee.id === emp.id);
        const entryDates = new Set(empReport?.entries.map((e) => e.work_date) || []);
        const absenceDates = new Set(
          absences.filter((a) => a.employee_id === emp.id).map((a) => a.absence_date),
        );

        const missing = allDays.filter((d) => {
          const dow = getDay(d);
          if (dow === 0) return false; // Sunday skip
          const dateStr = format(d, 'yyyy-MM-dd');
          if (entryDates.has(dateStr) || absenceDates.has(dateStr)) return false;
          return differenceInCalendarDays(today, d) > MILOG_DEADLINE_DAYS;
        });

        return { employee: emp, missingDates: missing };
      })
      .filter((w) => w.missingDates.length > 0);
  }, [activeEmployees, report, absences, month, year]);

  // Absence summary
  const absenceSummary = useMemo(() => {
    const byType: Record<string, { count: number; employees: Set<string> }> = {};
    const byEmployee: Record<string, { name: string; types: Record<string, number> }> = {};

    absences.forEach((a) => {
      if (!byType[a.absence_type]) byType[a.absence_type] = { count: 0, employees: new Set() };
      byType[a.absence_type].count++;
      byType[a.absence_type].employees.add(a.employee_id);

      if (!byEmployee[a.employee_id]) {
        const emp = employees.find((e) => e.id === a.employee_id);
        byEmployee[a.employee_id] = {
          name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unbekannt',
          types: {},
        };
      }
      byEmployee[a.employee_id].types[a.absence_type] =
        (byEmployee[a.employee_id].types[a.absence_type] || 0) + 1;
    });

    return { byType, byEmployee };
  }, [absences, employees]);

  // Minijob tracking
  const minijobData = useMemo(() => {
    return activeEmployees
      .filter((e) => e.employment_type === 'Minijob')
      .map((emp) => {
        const empReport = report.find((r) => r.employee.id === emp.id);
        const hours = empReport?.totalHours || 0;
        const pct = (hours / MINIJOB_MAX_HOURS) * 100;
        const remaining = Math.max(0, MINIJOB_MAX_HOURS - hours);
        return { employee: emp, hours, pct, remaining, over: hours > MINIJOB_MAX_HOURS };
      });
  }, [activeEmployees, report]);

  // Employees without any entries or absences
  const employeesWithout = useMemo(() => {
    const withEntries = new Set(report.map((r) => r.employee.id));
    const withAbsences = new Set(absences.map((a) => a.employee_id));
    return activeEmployees.filter(
      (e) => !withEntries.has(e.id) && !withAbsences.has(e.id),
    );
  }, [activeEmployees, report, absences]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className={GLASS} style={GLASS_STYLE}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <span className="text-sm font-bold text-amber-900">
              {getMonthName(month)} {year}
            </span>
            <div className="mt-0.5 flex items-center justify-center gap-3">
              <span className="text-[10px] text-neutral-400">
                {report.length} Mitarbeiter
              </span>
              <span className="text-[10px] text-neutral-400">
                {totalDaysAll} Tage
              </span>
              <span className="text-[10px] font-semibold text-amber-700">
                {formatHours(totalHoursAll)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={goNext}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Section 1: Employee Hour Comparison */}
      <div className={GLASS} style={GLASS_STYLE}>
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-amber-500" />
          <span className={SECTION_TITLE}>Stunden pro Mitarbeiter</span>
        </div>

        {sortedByHours.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            Keine Einträge in diesem Monat.
          </p>
        ) : (
          <div className="space-y-2.5">
            {sortedByHours.map((r) => {
              const pct = (r.totalHours / maxHours) * 100;
              const isMinijob = r.employee.employment_type === 'Minijob';
              return (
                <div key={r.employee.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold ${
                          isMinijob
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {r.employee.first_name[0]}
                        {r.employee.last_name[0]}
                      </div>
                      <span className="truncate text-xs font-semibold text-amber-900">
                        {r.employee.first_name} {r.employee.last_name}
                      </span>
                      <Badge
                        className={`shrink-0 text-[8px] ${EMPLOYMENT_BADGE_COLORS[r.employee.employment_type]}`}
                      >
                        {r.employee.employment_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-neutral-400">
                        {r.workDays} Tage
                      </span>
                      <span className="text-xs font-bold text-amber-900">
                        {formatHours(r.totalHours)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMinijob ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Weekly Distribution */}
      <div className={GLASS} style={GLASS_STYLE}>
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-amber-500" />
          <span className={SECTION_TITLE}>Wochenverteilung</span>
        </div>

        <div className="flex items-end gap-1.5 h-28">
          {weeklyData.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-amber-800">
                {d.hours > 0 ? formatHours(d.hours).replace(' Std.', '') : ''}
              </span>
              <div className="relative w-full flex-1 rounded-t-lg bg-neutral-100 overflow-hidden flex items-end">
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    d.isWeekend ? 'bg-orange-400' : 'bg-amber-400'
                  }`}
                  style={{ height: `${d.pct}%` }}
                />
              </div>
              <span
                className={`text-[10px] font-bold ${
                  d.isWeekend ? 'text-orange-600' : 'text-neutral-500'
                }`}
              >
                {d.label}
              </span>
              <span className="text-[8px] text-neutral-400">
                {d.count > 0 ? `${d.count}x` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: MiLoG Warnings */}
      <div className={GLASS} style={GLASS_STYLE}>
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <span className={SECTION_TITLE}>MiLoG Dokumentation</span>
        </div>

        {milогWarnings.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <p className="text-xs font-medium text-green-700">
              Alle Einträge innerhalb der 7-Tage-Frist.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {milогWarnings.map((w) => {
              const severity = w.missingDates.length >= 3 ? 'red' : 'amber';
              return (
                <div
                  key={w.employee.id}
                  className={`rounded-xl border px-3 py-2.5 ${
                    severity === 'red'
                      ? 'border-red-200 bg-red-50'
                      : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-[9px] font-bold text-amber-700 shadow-sm">
                        {w.employee.first_name[0]}
                        {w.employee.last_name[0]}
                      </div>
                      <span className="text-xs font-semibold text-amber-900">
                        {w.employee.first_name} {w.employee.last_name}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        severity === 'red'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {w.missingDates.length} fehlend
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {w.missingDates.slice(0, 8).map((d) => (
                      <span
                        key={format(d, 'yyyy-MM-dd')}
                        className="rounded bg-white/80 px-1.5 py-0.5 text-[9px] text-neutral-500 shadow-sm"
                      >
                        {format(d, 'dd.MM.')}
                      </span>
                    ))}
                    {w.missingDates.length > 8 && (
                      <span className="text-[9px] text-neutral-400">
                        +{w.missingDates.length - 8} weitere
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 4: Absence Summary */}
      <div className={GLASS} style={GLASS_STYLE}>
        <div className="mb-3 flex items-center gap-2">
          <CalendarOff className="h-3.5 w-3.5 text-amber-500" />
          <span className={SECTION_TITLE}>Abwesenheiten</span>
        </div>

        {absences.length === 0 ? (
          <p className="py-4 text-center text-xs text-neutral-400">
            Keine Abwesenheiten in diesem Monat.
          </p>
        ) : (
          <>
            {/* Type summary pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.entries(absenceSummary.byType).map(([type, data]) => (
                <div
                  key={type}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    ABSENCE_BADGE_COLORS[type] || 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {type}: {data.count} {data.count === 1 ? 'Tag' : 'Tage'}
                </div>
              ))}
            </div>

            {/* Per-employee breakdown */}
            <div className="space-y-1.5">
              {Object.entries(absenceSummary.byEmployee).map(([empId, data]) => (
                <div
                  key={empId}
                  className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2"
                >
                  <span className="text-xs font-medium text-neutral-700">
                    {data.name}
                  </span>
                  <div className="flex gap-1">
                    {Object.entries(data.types).map(([type, count]) => (
                      <Badge
                        key={type}
                        className={`text-[8px] ${
                          ABSENCE_BADGE_COLORS[type] || 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {count}x {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Section 5: Minijob Tracker */}
      {minijobData.length > 0 && (
        <div className={GLASS} style={GLASS_STYLE}>
          <div className="mb-1 flex items-center gap-2">
            <Euro className="h-3.5 w-3.5 text-amber-500" />
            <span className={SECTION_TITLE}>Minijob Stundentracker</span>
          </div>
          <p className="mb-3 text-[9px] text-neutral-400">
            {MINIJOB_LIMIT_EUR} EUR Grenze bei {MINIMUM_WAGE_EUR.toFixed(2).replace('.', ',')} EUR/Std. = max.{' '}
            {formatHours(MINIJOB_MAX_HOURS)}
          </p>

          <div className="space-y-3">
            {minijobData.map((mj) => {
              const clampedPct = Math.min(mj.pct, 100);
              let barColor = 'bg-green-400';
              let textColor = 'text-green-700';
              if (mj.over) {
                barColor = 'bg-red-400';
                textColor = 'text-red-700';
              } else if (mj.pct > 85) {
                barColor = 'bg-orange-400';
                textColor = 'text-orange-700';
              } else if (mj.pct > 70) {
                barColor = 'bg-amber-400';
                textColor = 'text-amber-700';
              }

              return (
                <div key={mj.employee.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-[9px] font-bold text-emerald-700">
                        {mj.employee.first_name[0]}
                        {mj.employee.last_name[0]}
                      </div>
                      <span className="text-xs font-semibold text-amber-900">
                        {mj.employee.first_name} {mj.employee.last_name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${textColor}`}>
                        {formatHours(mj.hours)}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {' '}
                        / {formatHours(MINIJOB_MAX_HOURS)}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-3 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${clampedPct}%` }}
                    />
                  </div>
                  <div className="mt-0.5 flex justify-between">
                    <span className="text-[9px] text-neutral-400">
                      {Math.round(mj.pct)}% ausgeschöpft
                    </span>
                    {mj.over ? (
                      <span className="text-[9px] font-bold text-red-600">
                        Grenze überschritten!
                      </span>
                    ) : (
                      <span className="text-[9px] text-neutral-400">
                        Noch {formatHours(mj.remaining)} verfügbar
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 6: Employees Without Entries */}
      {employeesWithout.length > 0 && (
        <div className={GLASS} style={GLASS_STYLE}>
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-neutral-400" />
            <span className={SECTION_TITLE}>Ohne Einträge</span>
            <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[9px] font-bold text-neutral-500">
              {employeesWithout.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {employeesWithout.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-neutral-200 text-[9px] font-bold text-neutral-500">
                  {emp.first_name[0]}
                  {emp.last_name[0]}
                </div>
                <div>
                  <span className="text-[11px] font-medium text-neutral-600">
                    {emp.first_name} {emp.last_name}
                  </span>
                  <Badge
                    className={`ml-1.5 text-[7px] ${EMPLOYMENT_BADGE_COLORS[emp.employment_type]}`}
                  >
                    {emp.employment_type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

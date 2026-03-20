'use client';

import { useState } from 'react';
import {
  FileDown,
  Loader2,
  ChevronDown,
  CalendarDays,
  Clock,
  Coffee,
  CalendarOff,
  X,
  Briefcase,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmployeeYearReport, MonthSummary } from '@/hooks/useYearlyReport';
import {
  formatHours,
  formatMinutes,
  formatDate,
  formatTimeBlocks,
  getMonthName,
  getWeekday,
} from '@/lib/utils/time';
import { ABSENCE_BADGE_COLORS } from '@/lib/constants';

interface Props {
  reports: EmployeeYearReport[];
  year: number;
}

const GLASS =
  'rounded-2xl border border-white/80 bg-white/60 shadow-sm backdrop-blur-xl';
const GLASS_STYLE = {
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

async function downloadPdf(
  employeeId: string,
  firstName: string,
  month: number,
  year: number,
) {
  const url = `/api/export/pdf?employee_id=${employeeId}&month=${month}&year=${year}`;
  const response = await fetch(url);
  const blob = await response.blob();
  const monthName = getMonthName(month);
  const filename = `${firstName}_${monthName}_${year}.pdf`;

  if ('showSaveFilePicker' in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as unknown as Record<string, any>).showSaveFilePicker({
        suggestedName: filename,
        types: [
          { description: 'PDF-Dokument', accept: { 'application/pdf': ['.pdf'] } },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }

  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
}

export function YearlyReportGrid({ reports, year }: Props) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    reports[0]?.employee.id ?? null,
  );
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [downloadingMonth, setDownloadingMonth] = useState<number | null>(null);

  const selectedReport = reports.find(
    (r) => r.employee.id === selectedEmployeeId,
  );

  if (reports.length === 0) {
    return (
      <div className={`${GLASS} p-8`} style={GLASS_STYLE}>
        <p className="text-center text-sm text-neutral-400">
          Keine Mitarbeiter gefunden.
        </p>
      </div>
    );
  }

  const handleDownload = async (month: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedReport) return;
    setDownloadingMonth(month);
    try {
      await downloadPdf(
        selectedReport.employee.id,
        selectedReport.employee.first_name,
        month,
        year,
      );
    } finally {
      setDownloadingMonth(null);
    }
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-4">
      {/* Employee selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {reports.map((r) => {
          const isActive = r.employee.id === selectedEmployeeId;
          return (
            <button
              key={r.employee.id}
              type="button"
              onClick={() => {
                setSelectedEmployeeId(r.employee.id);
                setExpandedMonth(null);
              }}
              className={`flex shrink-0 items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-200/50'
                  : 'bg-white/60 text-amber-900 border border-white/80 hover:bg-amber-50'
              }`}
              style={isActive ? undefined : GLASS_STYLE}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-xl text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gradient-to-br from-amber-300 to-amber-400 text-amber-900'
                }`}
              >
                {r.employee.first_name[0]}
                {r.employee.last_name[0]}
              </div>
              <div className="text-left">
                <div>{r.employee.first_name} {r.employee.last_name}</div>
                {isActive && (
                  <div className="text-[9px] font-medium text-amber-100">
                    {r.yearTotalDays} Tage · {formatHours(r.yearTotalHours)}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Year summary bar */}
      {selectedReport && (
        <div
          className="rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-amber-100/80 px-4 py-3"
          style={GLASS_STYLE}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-semibold text-amber-800">
                  {selectedReport.yearTotalDays} Arbeitstage
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarOff className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-xs text-neutral-500">
                  {selectedReport.yearAbsenceCount} Abwesenheiten
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-sm font-bold text-amber-900">
                {formatHours(selectedReport.yearTotalHours)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 12 month cards grid */}
      {selectedReport && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {selectedReport.months.map((m) => {
            const hasData = m.workDays > 0 || m.absenceCount > 0;
            const isExpanded = expandedMonth === m.month;
            const isDownloading = downloadingMonth === m.month;
            const isCurrent = m.month === currentMonth && year === currentYear;
            const isFuture = year > currentYear || (year === currentYear && m.month > currentMonth);

            return (
              <div
                key={m.month}
                className={`${
                  isExpanded ? 'sm:col-span-2 lg:col-span-3' : ''
                }`}
              >
                <div
                  className={`rounded-2xl border shadow-sm backdrop-blur-xl transition-all ${
                    isCurrent
                      ? 'border-amber-300/80 bg-gradient-to-br from-amber-50/90 to-white/80 ring-2 ring-amber-200/50'
                      : hasData
                        ? 'border-white/80 bg-white/60'
                        : isFuture
                          ? 'border-neutral-200/50 bg-neutral-50/30 opacity-40'
                          : 'border-neutral-200/50 bg-neutral-50/40 opacity-50'
                  }`}
                  style={GLASS_STYLE}
                >
                  {/* Card header — clickable */}
                  <button
                    type="button"
                    onClick={() => hasData && setExpandedMonth(isExpanded ? null : m.month)}
                    className={`w-full p-4 text-left ${hasData ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {/* Top row: month name + badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-amber-900">
                          {getMonthName(m.month)}
                        </h3>
                        {isCurrent && (
                          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[8px] font-bold text-white">
                            AKTUELL
                          </span>
                        )}
                      </div>
                      {hasData && (
                        <ChevronDown
                          className={`h-4 w-4 text-neutral-300 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </div>

                    {hasData ? (
                      <div className="mt-3 space-y-2">
                        {/* Hours — prominent */}
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-amber-900">
                            {formatHours(m.totalHours)}
                          </span>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="h-3 w-3 text-amber-500" />
                            <span className="text-[11px] text-neutral-600">
                              {m.workDays} Arbeitstage
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-amber-500" />
                            <span className="text-[11px] text-neutral-600">
                              Ø {formatHours(m.avgHoursPerDay)}/Tag
                            </span>
                          </div>
                          {m.totalBreakMinutes > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Coffee className="h-3 w-3 text-neutral-400" />
                              <span className="text-[11px] text-neutral-500">
                                {formatMinutes(m.totalBreakMinutes)} Pause
                              </span>
                            </div>
                          )}
                          {m.absenceCount > 0 && (
                            <div className="flex items-center gap-1.5">
                              <CalendarOff className="h-3 w-3 text-neutral-400" />
                              <span className="text-[11px] text-neutral-500">
                                {m.absenceCount} Abwesenheit{m.absenceCount !== 1 ? 'en' : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Absence type pills */}
                        {Object.keys(m.absencesByType).length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {Object.entries(m.absencesByType).map(
                              ([type, count]) => (
                                <Badge
                                  key={type}
                                  className={`text-[8px] ${ABSENCE_BADGE_COLORS[type] || 'bg-neutral-100 text-neutral-600'}`}
                                >
                                  {count}× {type}
                                </Badge>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] text-neutral-400">
                        Keine Einträge
                      </p>
                    )}
                  </button>

                  {/* PDF download button — always visible for cards with data */}
                  {hasData && !isExpanded && (
                    <div className="border-t border-neutral-100/80 px-4 py-2.5">
                      <button
                        type="button"
                        onClick={(e) => handleDownload(m.month, e)}
                        disabled={isDownloading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-3 py-2 text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                      >
                        {isDownloading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileDown className="h-3.5 w-3.5" />
                        )}
                        <span className="text-[11px] font-bold">
                          PDF herunterladen
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Expanded detail view */}
                  {isExpanded && hasData && (
                    <MonthDetailView
                      summary={m}
                      year={year}
                      isDownloading={isDownloading}
                      onDownload={(e) => handleDownload(m.month, e)}
                      onClose={() => setExpandedMonth(null)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Month Detail View ─── */

function MonthDetailView({
  summary,
  year,
  isDownloading,
  onDownload,
  onClose,
}: {
  summary: MonthSummary;
  year: number;
  isDownloading: boolean;
  onDownload: (e: React.MouseEvent) => void;
  onClose: () => void;
}) {
  // Merge entries + absences into a single sorted list
  type DayRow =
    | { type: 'entry'; date: string; entry: (typeof summary.entries)[0] }
    | { type: 'absence'; date: string; absence: (typeof summary.absences)[0] };

  const dayRows: DayRow[] = [
    ...summary.entries.map((e) => ({
      type: 'entry' as const,
      date: e.work_date,
      entry: e,
    })),
    ...summary.absences.map((a) => ({
      type: 'absence' as const,
      date: a.absence_date,
      absence: a,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="border-t border-neutral-100/80">
      {/* Detail header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h4 className="text-xs font-bold text-amber-900">
          {getMonthName(summary.month)} {year} — Alle Einträge
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Day rows */}
      <div className="space-y-1.5 px-4 pb-3">
        {dayRows.map((row) => {
          if (row.type === 'entry') {
            const entry = row.entry;
            return (
              <div
                key={`e-${entry.id}`}
                className="rounded-xl bg-amber-50/50 px-3 py-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-900">
                      {formatDate(entry.work_date)}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {getWeekday(entry.work_date)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-900">
                    {formatHours(Number(entry.total_hours))}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500">
                    {formatTimeBlocks(entry.time_blocks)}
                  </span>
                  {entry.break_minutes > 0 && (
                    <span className="text-[9px] text-neutral-400">
                      Pause: {formatMinutes(entry.break_minutes)}
                    </span>
                  )}
                </div>
              </div>
            );
          } else {
            const absence = row.absence;
            return (
              <div
                key={`a-${absence.id}`}
                className="rounded-xl bg-neutral-100/70 px-3 py-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-neutral-500">
                      {formatDate(absence.absence_date)}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {getWeekday(absence.absence_date)}
                    </span>
                  </div>
                  <Badge
                    className={`text-[8px] ${ABSENCE_BADGE_COLORS[absence.absence_type] || 'bg-neutral-100 text-neutral-600'}`}
                  >
                    {absence.absence_type}
                  </Badge>
                </div>
                {absence.notes && (
                  <div className="mt-1 flex items-center gap-1">
                    <CalendarOff className="h-2.5 w-2.5 text-neutral-400" />
                    <span className="text-[9px] text-neutral-400">
                      {absence.notes}
                    </span>
                  </div>
                )}
              </div>
            );
          }
        })}
      </div>

      {/* Totals + PDF button */}
      <div className="border-t border-neutral-100/80 px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-400/20 to-amber-500/20 px-3 py-2.5">
          <span className="text-xs font-semibold text-amber-800">
            {summary.workDays} {summary.workDays === 1 ? 'Arbeitstag' : 'Arbeitstage'}
            {summary.absenceCount > 0 &&
              ` · ${summary.absenceCount} Abwesenheit${summary.absenceCount !== 1 ? 'en' : ''}`}
          </span>
          <span className="text-sm font-bold text-amber-900">
            {formatHours(summary.totalHours)}
          </span>
        </div>

        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-3 py-2.5 text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          <span className="text-xs font-bold">PDF herunterladen</span>
        </button>
      </div>
    </div>
  );
}

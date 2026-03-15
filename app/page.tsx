'use client';

import { useState } from 'react';
import { BottomTabBar, type TabId } from '@/components/layout/BottomTabBar';

// Shared
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ArrowLeft, UserPlus, Clock, AlertTriangle, Coffee, TrendingUp, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useEntries } from '@/hooks/useEntries';
import { useAbsences } from '@/hooks/useAbsences';
import { useMonthlyReport } from '@/hooks/useMonthlyReport';
import { formatHours, formatTimeBlocks, getMonthName } from '@/lib/utils/time';
import { EMPLOYMENT_BADGE_COLORS, BUSINESS_NAME, MAX_HOURS_PER_DAY, MILOG_DEADLINE_DAYS } from '@/lib/constants';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { getImportantRules, getTotalRuleCount } from '@/lib/legal-rules';
import { LegalRulesPanel } from '@/components/legal/LegalRulesPanel';

// Eintragen
import { TimeEntryForm } from '@/components/entries/TimeEntryForm';
import { MonthlyOverview } from '@/components/entries/MonthlyOverview';

// Mitarbeiter (now in Dashboard)
import { EmployeeTable } from '@/components/admin/EmployeeTable';

// Übersicht
import { UebersichtPanel } from '@/components/admin/UebersichtPanel';

// Berichte
import { ReportTable } from '@/components/admin/ReportTable';

type DashboardView = 'main' | 'eintragen' | 'mitarbeiter';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [dashboardView, setDashboardView] = useState<DashboardView>('main');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployeeId(id);
    setDashboardView('eintragen');
  };

  const handleBackToDashboard = () => {
    setSelectedEmployeeId(null);
    setDashboardView('main');
  };

  return (
    <div className="mx-auto max-w-2xl pb-20">
      {activeTab === 'dashboard' && dashboardView === 'main' && (
        <DashboardTab
          onSelectEmployee={handleSelectEmployee}
          onOpenMitarbeiter={() => setDashboardView('mitarbeiter')}
        />
      )}
      {activeTab === 'dashboard' && dashboardView === 'eintragen' && selectedEmployeeId && (
        <EintragenView employeeId={selectedEmployeeId} onBack={handleBackToDashboard} />
      )}
      {activeTab === 'dashboard' && dashboardView === 'mitarbeiter' && (
        <MitarbeiterView onBack={handleBackToDashboard} />
      )}
      {activeTab === 'uebersicht' && <UebersichtTab />}
      {activeTab === 'berichte' && <BerichteTab />}
      {activeTab === 'einstellungen' && <EinstellungenTab />}

      <BottomTabBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'dashboard') {
            setDashboardView('main');
            setSelectedEmployeeId(null);
          }
        }}
      />
    </div>
  );
}

/* ─── Dashboard ─── */
function DashboardTab({
  onSelectEmployee,
  onOpenMitarbeiter,
}: {
  onSelectEmployee: (id: string) => void;
  onOpenMitarbeiter: () => void;
}) {
  const [legalPanelOpen, setLegalPanelOpen] = useState(false);
  const { employees, loading: empLoading } = useEmployees(true);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const { entries } = useEntries({ month: currentMonth, year: currentYear });
  const { absences } = useAbsences({ month: currentMonth, year: currentYear });
  const today = format(now, 'yyyy-MM-dd');
  const todayLabel = format(now, 'EEEE, d. MMMM', { locale: de });

  const activeEmployees = employees.filter((e) => e.active);
  const todayEntries = entries.filter((e) => e.work_date === today);
  const todayAbsences = absences.filter((a) => a.absence_date === today);
  // Employees who worked today
  const todayWorkedIds = new Set(todayEntries.map((e) => e.employee_id));
  const todayAbsentIds = new Set(todayAbsences.map((a) => a.employee_id));

  // MiLoG compliance: check entries older than 7 days without records
  const lateEntries = entries.filter((e) => {
    const entryDate = new Date(e.work_date);
    const recorded = new Date(e.recorded_at);
    const diff = Math.floor((recorded.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff > MILOG_DEADLINE_DAYS;
  });

  // Entries with high hours (close to or exceeding limit)
  const highHourEntries = entries.filter((e) => Number(e.total_hours) >= MAX_HOURS_PER_DAY - 1);

  if (empLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Welcome header */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 px-5 py-4">
        <p className="text-xs font-medium text-amber-800/70 capitalize">{todayLabel}</p>
        <h1 className="text-lg font-bold text-amber-900">{BUSINESS_NAME}</h1>
        <p className="mt-1 text-xs text-amber-800/60">
          {todayEntries.length} von {activeEmployees.length} Mitarbeitern eingetragen
        </p>
      </div>

      {/* Quick Stats */}
      {(() => {
        // Employees who haven't logged today
        const missingToday = activeEmployees.filter(
          (e) => !todayWorkedIds.has(e.id) && !todayAbsentIds.has(e.id)
        );
        // Overtime entries this month (over 8 hours)
        const overtimeEntries = entries.filter((e) => Number(e.total_hours) > 8);
        const totalOvertimeHours = overtimeEntries.reduce(
          (sum, e) => sum + (Number(e.total_hours) - 8), 0
        );

        return (
          <div className="grid grid-cols-3 gap-2">
            <Card className="border border-amber-100 shadow-sm">
              <CardContent className="p-3 text-center">
                <Users className="mx-auto mb-1 h-4 w-4 text-green-500" />
                <p className="text-xl font-bold text-amber-900">
                  {todayWorkedIds.size}<span className="text-sm text-neutral-300">/{activeEmployees.length}</span>
                </p>
                <p className="text-[9px] uppercase text-neutral-400">Heute aktiv</p>
              </CardContent>
            </Card>
            <Card className="border border-amber-100 shadow-sm">
              <CardContent className="p-3 text-center">
                <AlertTriangle className={`mx-auto mb-1 h-4 w-4 ${missingToday.length > 0 ? 'text-orange-500' : 'text-green-500'}`} />
                <p className={`text-xl font-bold ${missingToday.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {missingToday.length}
                </p>
                <p className="text-[9px] uppercase text-neutral-400">Ohne Eintrag</p>
              </CardContent>
            </Card>
            <Card className="border border-amber-100 shadow-sm">
              <CardContent className="p-3 text-center">
                <TrendingUp className={`mx-auto mb-1 h-4 w-4 ${totalOvertimeHours > 0 ? 'text-red-500' : 'text-green-500'}`} />
                <p className={`text-xl font-bold ${totalOvertimeHours > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {totalOvertimeHours > 0 ? `+${totalOvertimeHours.toFixed(1).replace('.0', '')}` : '0'}
                </p>
                <p className="text-[9px] uppercase text-neutral-400">Überstunden</p>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Employee Cards — clickable to open Eintragen */}
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-500" />
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Stunden eintragen</h2>
          </div>
          <button
            onClick={onOpenMitarbeiter}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 hover:border-amber-400 active:scale-[0.97]"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Mitarbeiter verwalten
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {activeEmployees.map((emp) => {
            const hasEntryToday = todayWorkedIds.has(emp.id);
            const isAbsentToday = todayAbsentIds.has(emp.id);
            const empEntries = entries.filter((e) => e.employee_id === emp.id);
            const empMonthHours = empEntries.reduce((sum, e) => sum + Number(e.total_hours), 0);

            return (
              <button
                key={emp.id}
                onClick={() => onSelectEmployee(emp.id)}
                className={`relative flex flex-col gap-3 rounded-2xl p-4 text-left transition-all hover:shadow-lg active:scale-[0.97] backdrop-blur-xl border ${
                  hasEntryToday
                    ? 'bg-green-50/70 border-green-200/60 shadow-green-100/50 shadow-md'
                    : isAbsentToday
                    ? 'bg-blue-50/70 border-blue-200/60 shadow-blue-100/50 shadow-md'
                    : 'bg-white/60 border-white/80 shadow-md hover:border-amber-200'
                }`}
                style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
              >
                {/* Top row: Avatar + Status */}
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold shadow-inner ${
                    hasEntryToday
                      ? 'bg-green-400/80 text-green-900'
                      : isAbsentToday
                      ? 'bg-blue-400/80 text-blue-900'
                      : 'bg-gradient-to-br from-amber-300 to-amber-400 text-amber-900'
                  }`}>
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                  <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 ${
                    hasEntryToday
                      ? 'bg-green-100 text-green-700'
                      : isAbsentToday
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      hasEntryToday ? 'bg-green-500' : isAbsentToday ? 'bg-blue-500' : 'bg-neutral-300'
                    }`} />
                    <span className="text-[9px] font-semibold">
                      {hasEntryToday ? 'Aktiv' : isAbsentToday ? 'Abwesend' : 'Offen'}
                    </span>
                  </div>
                </div>

                {/* Name + Type */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-amber-900">{emp.first_name} {emp.last_name}</p>
                  <Badge className={`mt-1 text-[9px] ${EMPLOYMENT_BADGE_COLORS[emp.employment_type]}`}>
                    {emp.employment_type}
                  </Badge>
                </div>

                {/* Monthly hours bar */}
                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-neutral-400 font-medium">{getMonthName(currentMonth)}</span>
                    <span className="text-[10px] font-bold text-amber-800">{formatHours(empMonthHours)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        hasEntryToday ? 'bg-green-400' : isAbsentToday ? 'bg-blue-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.min((empMonthHours / 160) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts / Hinweise */}
      {(lateEntries.length > 0 || highHourEntries.length > 0 || todayAbsences.length > 0) && (
        <div className="space-y-2">
          {lateEntries.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div>
                <p className="text-xs font-semibold text-red-800">MiLoG-Frist überschritten</p>
                <p className="text-[11px] text-red-600">
                  {lateEntries.length} {lateEntries.length === 1 ? 'Eintrag wurde' : 'Einträge wurden'} nach der 7-Tage-Frist erfasst.
                </p>
              </div>
            </div>
          )}
          {highHourEntries.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
              <div>
                <p className="text-xs font-semibold text-orange-800">Hohe Arbeitszeit</p>
                <p className="text-[11px] text-orange-600">
                  {highHourEntries.length} {highHourEntries.length === 1 ? 'Tag' : 'Tage'} mit {MAX_HOURS_PER_DAY - 1}+ Stunden diesen Monat.
                </p>
              </div>
            </div>
          )}
          {todayAbsences.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <Coffee className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <div>
                <p className="text-xs font-semibold text-blue-800">Heute abwesend</p>
                <p className="text-[11px] text-blue-600">
                  {todayAbsences.map((a) => {
                    const emp = employees.find((e) => e.id === a.employee_id);
                    return emp ? `${emp.first_name} (${a.absence_type})` : a.absence_type;
                  }).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Today's Activity */}
      <Card className="border border-amber-100 shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Heutige Einträge</h2>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {todayEntries.length}
            </span>
          </div>
          {todayEntries.length === 0 ? (
            <p className="py-3 text-center text-xs text-neutral-400">
              Noch keine Einträge für heute.
            </p>
          ) : (
            <div className="space-y-1.5">
              {todayEntries.map((entry) => {
                const emp = employees.find((e) => e.id === entry.employee_id);
                return (
                  <div key={entry.id} className="flex items-center justify-between rounded-lg bg-amber-50/60 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-[10px] font-bold text-amber-900">
                        {emp ? `${emp.first_name[0]}${emp.last_name[0]}` : '??'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-900">
                          {emp ? `${emp.first_name} ${emp.last_name}` : 'Unbekannt'}
                        </p>
                        <p className="text-[10px] text-neutral-400">{formatTimeBlocks(entry.time_blocks)}</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-amber-900 shadow-sm">
                      {formatHours(Number(entry.total_hours))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Arbeitsrecht-Info (dynamisch) */}
      {(() => {
        const importantRules = getImportantRules();
        const totalRules = getTotalRuleCount();
        return (
          <>
            <Card className="border border-amber-100 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <button
                  onClick={() => setLegalPanelOpen(true)}
                  className="w-full text-left"
                >
                  <div className="bg-amber-50 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-700">Arbeitsrecht-Info</h2>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-amber-500">
                      <span>{totalRules} Regeln</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>
                </button>
                <div className="divide-y divide-amber-50">
                  {importantRules.slice(0, 4).map(({ category, rule }) => (
                    <button
                      key={rule.id}
                      onClick={() => setLegalPanelOpen(true)}
                      className="flex items-start gap-3 px-4 py-3 w-full text-left hover:bg-amber-50/50 transition-colors"
                    >
                      <span className="mt-0.5 text-sm shrink-0">{category.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-amber-900">{rule.title}</p>
                        <p className="text-[10px] text-neutral-400">{rule.law}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setLegalPanelOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 border-t border-amber-100 py-2.5 text-[11px] font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  Alle {totalRules} Regeln anzeigen
                  <ChevronRight className="h-3 w-3" />
                </button>
              </CardContent>
            </Card>

            <LegalRulesPanel open={legalPanelOpen} onOpenChange={setLegalPanelOpen} />
          </>
        );
      })()}
    </div>
  );
}

/* ─── Eintragen View ─── */
function EintragenView({ employeeId, onBack }: { employeeId: string; onBack: () => void }) {
  const { employees } = useEmployees();
  const employee = employees.find((e) => e.id === employeeId);

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [workDate, setWorkDate] = useState(format(now, 'yyyy-MM-dd'));

  const { entries, loading: entriesLoading, refresh } = useEntries({
    employeeId,
    month: viewMonth,
    year: viewYear,
  });

  const { absences, refresh: refreshAbsences } = useAbsences({
    employeeId,
    month: viewMonth,
    year: viewYear,
  });

  const isCurrentMonth = viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear();

  let missingDays = 0;
  if (isCurrentMonth) {
    const recordedDates = entries.map((e) => e.work_date);
    for (let i = 5; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (!recordedDates.includes(dateStr)) missingDays++;
    }
  }

  const handleEditDate = (date: string) => {
    setWorkDate(date);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!employee) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-400">Mitarbeiter nicht gefunden.</p>
        <button onClick={onBack} className="mt-3 text-sm text-amber-600 underline">Zurück</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-amber-600 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Zurück
      </button>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-sm font-bold text-amber-900">
          {employee.first_name[0]}{employee.last_name[0]}
        </div>
        <div>
          <h2 className="text-lg font-bold text-amber-900">
            {employee.first_name} {employee.last_name}
          </h2>
          <Badge className={`text-[11px] ${EMPLOYMENT_BADGE_COLORS[employee.employment_type]}`}>
            {employee.employment_type}
          </Badge>
        </div>
      </div>

      <TimeEntryForm
        employeeId={employeeId}
        entries={entries}
        absences={absences}
        workDate={workDate}
        onWorkDateChange={setWorkDate}
        onSaved={refresh}
        onAbsenceSaved={refreshAbsences}
      />

      <MonthlyOverview
        entries={entries}
        absences={absences}
        loading={entriesLoading}
        missingDays={missingDays}
        month={viewMonth}
        year={viewYear}
        onMonthChange={(m, y) => { setViewMonth(m); setViewYear(y); }}
        onEditDate={handleEditDate}
        onRefreshEntries={refresh}
        onRefreshAbsences={refreshAbsences}
      />
    </div>
  );
}

/* ─── Mitarbeiter View (sub-view of Dashboard) ─── */
function MitarbeiterView({ onBack }: { onBack: () => void }) {
  const { employees, loading, refresh } = useEmployees();

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-amber-900">Mitarbeiter</h1>
          <p className="text-[11px] text-neutral-400">{employees.filter(e => e.active).length} aktive Mitarbeiter</p>
        </div>
      </div>
      <EmployeeTable employees={employees} onRefresh={refresh} />
    </div>
  );
}

/* ─── Übersicht ─── */
function UebersichtTab() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { report, loading } = useMonthlyReport(month, year);
  const { employees } = useEmployees(true);
  const { absences, loading: absLoading } = useAbsences({ month, year });

  return (
    <UebersichtPanel
      report={report}
      absences={absences}
      employees={employees}
      month={month}
      year={year}
      onMonthChange={(m, y) => { setMonth(m); setYear(y); }}
      loading={loading || absLoading}
    />
  );
}

/* ─── Berichte ─── */
function BerichteTab() {
  const now = new Date();
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const { report, loading } = useMonthlyReport(reportMonth, reportYear);
  const { absences, loading: absLoading } = useAbsences({ month: reportMonth, year: reportYear });

  const totalHours = report.reduce((s, r) => s + r.totalHours, 0);
  const totalDays = report.reduce((s, r) => s + r.workDays, 0);

  const goPrev = () => {
    if (reportMonth === 1) { setReportMonth(12); setReportYear(reportYear - 1); }
    else setReportMonth(reportMonth - 1);
  };
  const goNext = () => {
    if (reportMonth === 12) { setReportMonth(1); setReportYear(reportYear + 1); }
    else setReportMonth(reportMonth + 1);
  };

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div
        className="rounded-2xl border border-white/80 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center justify-between">
          <button type="button" onClick={goPrev} className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <span className="text-sm font-bold text-amber-900">{getMonthName(reportMonth)} {reportYear}</span>
            {!loading && (
              <div className="mt-0.5 flex items-center justify-center gap-3">
                <span className="text-[10px] text-neutral-400">{report.length} Mitarbeiter</span>
                <span className="text-[10px] text-neutral-400">{totalDays} Tage</span>
                <span className="text-[10px] font-semibold text-amber-700">{formatHours(totalHours)}</span>
              </div>
            )}
          </div>
          <button type="button" onClick={goNext} className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading || absLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <ReportTable report={report} absences={absences} month={reportMonth} year={reportYear} />
      )}
    </div>
  );
}

/* ─── Einstellungen ─── */
function EinstellungenTab() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-amber-900">Einstellungen</h1>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-amber-900">Betrieb</h3>
            <p className="text-sm text-neutral-500 mt-1">{BUSINESS_NAME}</p>
          </div>
          <div className="border-t border-amber-100 pt-4">
            <h3 className="text-sm font-semibold text-amber-900">Gesetzliche Vorgaben</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Arbeitszeiterfassung gem. § 17 MiLoG · Aufbewahrungspflicht: mind. 2 Jahre
            </p>
          </div>
          <div className="border-t border-amber-100 pt-4">
            <h3 className="text-sm font-semibold text-amber-900">Version</h3>
            <p className="text-xs text-neutral-400 mt-1">Kalkan Stundenzettel v1.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

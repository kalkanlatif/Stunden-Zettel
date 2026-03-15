'use client';

import { useState } from 'react';
import { BottomTabBar, type TabId } from '@/components/layout/BottomTabBar';

// Shared
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalendarDays, Users, ChevronLeft, ChevronRight, ArrowLeft, UserPlus, Clock, AlertTriangle, Coffee, TrendingUp, BookOpen, ChevronRight as ChevronRightSmall } from 'lucide-react';
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
import { AbsenceForm } from '@/components/entries/AbsenceForm';
import { MonthlyOverview } from '@/components/entries/MonthlyOverview';

// Mitarbeiter (now in Dashboard)
import { EmployeeTable } from '@/components/admin/EmployeeTable';

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
  const totalMonthHours = entries.reduce((sum, e) => sum + Number(e.total_hours), 0);

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
                      <ChevronRightSmall className="h-3 w-3" />
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
                  <ChevronRightSmall className="h-3 w-3" />
                </button>
              </CardContent>
            </Card>

            <LegalRulesPanel open={legalPanelOpen} onOpenChange={setLegalPanelOpen} />
          </>
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
        <div className="grid grid-cols-2 gap-2">
          {activeEmployees.map((emp) => {
            const hasEntryToday = todayWorkedIds.has(emp.id);
            const isAbsentToday = todayAbsentIds.has(emp.id);
            return (
              <button
                key={emp.id}
                onClick={() => onSelectEmployee(emp.id)}
                className={`relative flex items-center gap-2.5 rounded-xl bg-white px-3 py-3 text-left shadow-sm border transition-all hover:shadow-md active:scale-[0.98] ${
                  hasEntryToday ? 'border-green-200' : isAbsentToday ? 'border-blue-200' : 'border-amber-100 hover:border-amber-300'
                }`}
              >
                {/* Status dot */}
                <div className={`absolute top-2 right-2 h-2 w-2 rounded-full ${
                  hasEntryToday ? 'bg-green-400' : isAbsentToday ? 'bg-blue-400' : 'bg-neutral-200'
                }`} />
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-xs font-bold text-amber-900">
                  {emp.first_name[0]}{emp.last_name[0]}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-amber-900">{emp.first_name} {emp.last_name}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge className={`text-[9px] ${EMPLOYMENT_BADGE_COLORS[emp.employment_type]}`}>
                      {emp.employment_type}
                    </Badge>
                    {hasEntryToday && (
                      <span className="text-[9px] font-medium text-green-600">Eingetragen</span>
                    )}
                    {isAbsentToday && (
                      <span className="text-[9px] font-medium text-blue-600">Abwesend</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
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

  const goToPrevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

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

      <TimeEntryForm employeeId={employeeId} onSaved={refresh} />
      <AbsenceForm employeeId={employeeId} absences={absences} onSaved={refreshAbsences} />

      <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
        <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-8 w-8 text-amber-600 hover:bg-amber-100 hover:text-amber-800">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-amber-900">
          {getMonthName(viewMonth)} {viewYear}
        </span>
        <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8 text-amber-600 hover:bg-amber-100 hover:text-amber-800">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <MonthlyOverview entries={entries} loading={entriesLoading} missingDays={missingDays} />
    </div>
  );
}

/* ─── Mitarbeiter View (sub-view of Dashboard) ─── */
function MitarbeiterView({ onBack }: { onBack: () => void }) {
  const { employees, loading, refresh } = useEmployees(true);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-amber-600 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Zurück
      </button>
      <h1 className="text-xl font-bold text-amber-900">Mitarbeiter verwalten</h1>
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
  const activeEmployees = employees.filter((e) => e.active);
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  const totalHoursAll = report.reduce((sum, r) => sum + r.totalHours, 0);
  const totalDaysAll = report.reduce((sum, r) => sum + r.workDays, 0);

  // Employees with no entries this month
  const employeesWithEntries = new Set(report.map((r) => r.employee.id));
  const employeesWithout = activeEmployees.filter((e) => !employeesWithEntries.has(e.id));

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-amber-900">Übersicht</h1>

      {/* Month/Year filter */}
      <div className="flex gap-3">
        <div>
          <Label className="text-xs text-neutral-500">Monat</Label>
          <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
            <SelectTrigger className="mt-1 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {getMonthName(i + 1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-neutral-500">Jahr</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="mt-1 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-amber-900">{report.length}</p>
                <p className="text-[10px] uppercase text-neutral-400">Mitarbeiter</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-amber-900">{totalDaysAll}</p>
                <p className="text-[10px] uppercase text-neutral-400">Arbeitstage</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-amber-900">{formatHours(totalHoursAll)}</p>
                <p className="text-[10px] uppercase text-neutral-400">Stunden</p>
              </CardContent>
            </Card>
          </div>

          {/* Per-employee breakdown */}
          {report.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-400">
              Keine Einträge für {getMonthName(month)} {year}.
            </p>
          ) : (
            <div className="space-y-2">
              {report.map((r) => {
                const avgHours = r.workDays > 0 ? r.totalHours / r.workDays : 0;
                return (
                  <Card key={r.employee.id} className="border border-amber-100 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-xs font-bold text-amber-900">
                            {r.employee.first_name[0]}{r.employee.last_name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-amber-900">
                              {r.employee.first_name} {r.employee.last_name}
                            </p>
                            <Badge className={`text-[10px] ${EMPLOYMENT_BADGE_COLORS[r.employee.employment_type]}`}>
                              {r.employee.employment_type}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-amber-900">{formatHours(r.totalHours)}</p>
                          <p className="text-[10px] text-neutral-400">Std.</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-4 border-t border-amber-50 pt-2">
                        <div>
                          <span className="text-[10px] uppercase text-neutral-400">Tage</span>
                          <p className="text-sm font-semibold text-amber-900">{r.workDays}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-neutral-400">Ø pro Tag</span>
                          <p className="text-sm font-semibold text-amber-900">{formatHours(avgHours)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Employees without entries */}
          {employeesWithout.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-neutral-400 px-1">Ohne Einträge</p>
              <div className="flex flex-wrap gap-2">
                {employeesWithout.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-200 text-[10px] font-bold text-neutral-500">
                      {emp.first_name[0]}{emp.last_name[0]}
                    </div>
                    <span className="text-xs text-neutral-500">{emp.first_name} {emp.last_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Berichte ─── */
function BerichteTab() {
  const now = new Date();
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const { report, loading } = useMonthlyReport(reportMonth, reportYear);
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-amber-900">Berichte</h1>

      <div className="flex gap-4">
        <div>
          <Label className="text-xs text-neutral-500">Monat</Label>
          <Select value={String(reportMonth)} onValueChange={(v) => setReportMonth(parseInt(v))}>
            <SelectTrigger className="mt-1 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {getMonthName(i + 1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-neutral-500">Jahr</Label>
          <Select value={String(reportYear)} onValueChange={(v) => setReportYear(parseInt(v))}>
            <SelectTrigger className="mt-1 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <ReportTable report={report} month={reportMonth} year={reportYear} />
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

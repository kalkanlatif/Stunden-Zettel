'use client';

import { useState } from 'react';
import { BottomTabBar, type TabId } from '@/components/layout/BottomTabBar';

// Dashboard
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Users, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useEntries } from '@/hooks/useEntries';
import { useAbsences } from '@/hooks/useAbsences';
import { useMonthlyReport } from '@/hooks/useMonthlyReport';
import { formatHours, formatTimeBlocks, getMonthName } from '@/lib/utils/time';
import { EMPLOYMENT_BADGE_COLORS, BUSINESS_NAME } from '@/lib/constants';

// Eintragen
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TimeEntryForm } from '@/components/entries/TimeEntryForm';
import { AbsenceForm } from '@/components/entries/AbsenceForm';
import { MonthlyOverview } from '@/components/entries/MonthlyOverview';

// Mitarbeiter
import { EmployeeTable } from '@/components/admin/EmployeeTable';

// Berichte
import { ReportTable } from '@/components/admin/ReportTable';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployeeId(id);
  };

  const handleBackToDashboard = () => {
    setSelectedEmployeeId(null);
  };

  return (
    <div className="mx-auto max-w-2xl pb-20">
      {activeTab === 'dashboard' && !selectedEmployeeId && (
        <DashboardTab onSelectEmployee={handleSelectEmployee} />
      )}
      {activeTab === 'dashboard' && selectedEmployeeId && (
        <EintragenView employeeId={selectedEmployeeId} onBack={handleBackToDashboard} />
      )}
      {activeTab === 'mitarbeiter' && <MitarbeiterTab />}
      {activeTab === 'berichte' && <BerichteTab />}
      {activeTab === 'einstellungen' && <EinstellungenTab />}

      <BottomTabBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'dashboard') setSelectedEmployeeId(null);
        }}
      />
    </div>
  );
}

/* ─── Dashboard ─── */
function DashboardTab({ onSelectEmployee }: { onSelectEmployee: (id: string) => void }) {
  const { employees, loading: empLoading } = useEmployees(true);
  const now = new Date();
  const { entries } = useEntries({ month: now.getMonth() + 1, year: now.getFullYear() });

  const activeEmployees = employees.filter((e) => e.active);
  const totalEntries = entries.length;
  const todayStr = now.toISOString().split('T')[0];
  const todayEntries = entries.filter((e) => e.work_date === todayStr);

  if (empLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-amber-900">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-900">{activeEmployees.length}</p>
            <p className="text-[11px] uppercase text-neutral-400">Mitarbeiter</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-900">{totalEntries}</p>
            <p className="text-[11px] uppercase text-neutral-400">Einträge (diesen Monat)</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Heute</h2>
          </div>
          {todayEntries.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-400">
              Noch keine Einträge für heute.
            </p>
          ) : (
            <div className="space-y-2">
              {todayEntries.map((entry) => {
                const emp = employees.find((e) => e.id === entry.employee_id);
                return (
                  <div key={entry.id} className="flex items-center justify-between rounded-xl bg-amber-50/50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-xs font-bold text-amber-900">
                        {emp ? `${emp.first_name[0]}${emp.last_name[0]}` : '??'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-900">
                          {emp ? `${emp.first_name} ${emp.last_name}` : 'Unbekannt'}
                        </p>
                        <p className="text-xs text-neutral-400">{formatTimeBlocks(entry.time_blocks)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-amber-900">
                      {formatHours(Number(entry.total_hours))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Cards — clickable to open Eintragen */}
      <div>
        <div className="mb-3 flex items-center gap-2 px-1">
          <Users className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Stunden eintragen</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {activeEmployees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => onSelectEmployee(emp.id)}
              className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-3 text-left shadow-sm border border-amber-100 transition-all hover:border-amber-300 hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-xs font-bold text-amber-900">
                {emp.first_name[0]}{emp.last_name[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-amber-900">{emp.first_name} {emp.last_name}</p>
                <Badge className={`text-[10px] ${EMPLOYMENT_BADGE_COLORS[emp.employment_type]}`}>
                  {emp.employment_type}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Eintragen View (shown when employee selected from dashboard) ─── */
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
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  let missingDays = 0;
  if (isCurrentMonth) {
    const recordedDates = entries.map((e) => e.work_date);
    for (let i = 5; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (!recordedDates.includes(dateStr)) {
        missingDays++;
      }
    }
  }

  if (!employee) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-400">Mitarbeiter nicht gefunden.</p>
        <button onClick={onBack} className="mt-3 text-sm text-amber-600 underline">
          Zurück
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back button + Employee info */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-amber-600 transition-colors"
      >
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

      {/* Time entry form */}
      <TimeEntryForm employeeId={employeeId} onSaved={refresh} />

      {/* Absence form */}
      <AbsenceForm employeeId={employeeId} absences={absences} onSaved={refreshAbsences} />

      {/* Month navigation */}
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

      {/* Monthly overview */}
      <MonthlyOverview entries={entries} loading={entriesLoading} missingDays={missingDays} />
    </div>
  );
}

/* ─── Mitarbeiter ─── */
function MitarbeiterTab() {
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
      <h1 className="text-xl font-bold text-amber-900">Mitarbeiter</h1>
      <EmployeeTable employees={employees} onRefresh={refresh} />
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

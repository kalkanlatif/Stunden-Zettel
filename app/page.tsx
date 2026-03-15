'use client';

import { useState } from 'react';
import { BottomTabBar, type TabId } from '@/components/layout/BottomTabBar';

// Dashboard
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useEntries } from '@/hooks/useEntries';
import { useAbsences } from '@/hooks/useAbsences';
import { useMonthlyReport } from '@/hooks/useMonthlyReport';
import { formatHours, formatTimeBlocks, getMonthName } from '@/lib/utils/time';
import { EMPLOYMENT_BADGE_COLORS } from '@/lib/constants';

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

  return (
    <div className="mx-auto max-w-2xl pb-20">
      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'eintragen' && <EintragenTab />}
      {activeTab === 'mitarbeiter' && <MitarbeiterTab />}
      {activeTab === 'berichte' && <BerichteTab />}

      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

/* ─── Dashboard ─── */
function DashboardTab() {
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
      <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-neutral-900">{activeEmployees.length}</p>
            <p className="text-[11px] uppercase text-neutral-400">Mitarbeiter</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-neutral-900">{totalEntries}</p>
            <p className="text-[11px] uppercase text-neutral-400">Einträge (diesen Monat)</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#1DB954]" />
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
                  <div key={entry.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1DB954] text-xs font-bold text-white">
                        {emp ? `${emp.first_name[0]}${emp.last_name[0]}` : '??'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {emp ? `${emp.first_name} ${emp.last_name}` : 'Unbekannt'}
                        </p>
                        <p className="text-xs text-neutral-400">{formatTimeBlocks(entry.time_blocks)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900">
                      {formatHours(Number(entry.total_hours))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Employees */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#1DB954]" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Aktive Mitarbeiter</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {activeEmployees.map((emp) => (
              <div key={emp.id} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1DB954] text-xs font-bold text-white">
                  {emp.first_name[0]}{emp.last_name[0]}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900">{emp.first_name} {emp.last_name}</p>
                  <Badge className={`text-[10px] ${EMPLOYMENT_BADGE_COLORS[emp.employment_type]}`}>
                    {emp.employment_type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Eintragen ─── */
function EintragenTab() {
  const { employees } = useEmployees();
  const activeEmployees = employees.filter((e) => e.active);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const { entries, loading: entriesLoading, refresh } = useEntries({
    employeeId: selectedEmployeeId || undefined,
    month: viewMonth,
    year: viewYear,
  });

  const { absences, refresh: refreshAbsences } = useAbsences({
    employeeId: selectedEmployeeId || undefined,
    month: viewMonth,
    year: viewYear,
  });

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
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

  // Missing days calculation
  let missingDays = 0;
  if (isCurrentMonth && selectedEmployeeId) {
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

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-neutral-900">Eintragen</h1>

      {/* Employee dropdown */}
      <div>
        <Label className="text-xs text-neutral-500">Mitarbeiter auswählen</Label>
        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Mitarbeiter wählen..." />
          </SelectTrigger>
          <SelectContent>
            {activeEmployees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedEmployee && (
        <>
          {/* Employee info */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1DB954] text-sm font-bold text-white">
              {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">
                {selectedEmployee.first_name} {selectedEmployee.last_name}
              </h2>
              <Badge className={`text-[11px] ${EMPLOYMENT_BADGE_COLORS[selectedEmployee.employment_type]}`}>
                {selectedEmployee.employment_type}
              </Badge>
            </div>
          </div>

          {/* Time entry form */}
          <TimeEntryForm employeeId={selectedEmployeeId} onSaved={refresh} />

          {/* Absence form */}
          <AbsenceForm employeeId={selectedEmployeeId} absences={absences} onSaved={refreshAbsences} />

          {/* Month navigation */}
          <div className="flex items-center justify-between rounded-xl bg-neutral-900 px-4 py-2.5">
            <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-8 w-8 text-neutral-400 hover:bg-neutral-800 hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-white">
              {getMonthName(viewMonth)} {viewYear}
            </span>
            <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8 text-neutral-400 hover:bg-neutral-800 hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Monthly overview */}
          <MonthlyOverview entries={entries} loading={entriesLoading} missingDays={missingDays} />
        </>
      )}

      {!selectedEmployeeId && (
        <div className="py-12 text-center">
          <p className="text-sm text-neutral-400">Wähle einen Mitarbeiter, um Stunden einzutragen.</p>
        </div>
      )}
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
      <h1 className="text-xl font-bold text-neutral-900">Mitarbeiter</h1>
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
      <h1 className="text-xl font-bold text-neutral-900">Berichte</h1>

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

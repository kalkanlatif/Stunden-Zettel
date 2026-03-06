'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BarChart3, LogOut, LayoutDashboard, CalendarDays, ClipboardList, CalendarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPinDialog } from '@/components/admin/AdminPinDialog';
import { EmployeeTable } from '@/components/admin/EmployeeTable';
import { ReportTable } from '@/components/admin/ReportTable';
import { EntryManager } from '@/components/admin/EntryManager';
import { AbsenceManager } from '@/components/admin/AbsenceManager';
import { useAdminStore } from '@/store/admin.store';
import { useEmployees } from '@/hooks/useEmployees';
import { useEntries } from '@/hooks/useEntries';
import { useMonthlyReport } from '@/hooks/useMonthlyReport';
import { getMonthName, formatHours, formatTimeBlocks } from '@/lib/utils/time';
import { EMPLOYMENT_BADGE_COLORS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, checkSession, logout } = useAdminStore();
  const { employees, loading: empLoading, refresh: refreshEmployees } = useEmployees(true);
  const now = new Date();
  const { entries } = useEntries({ month: now.getMonth() + 1, year: now.getFullYear() });

  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const { report, loading: reportLoading } = useMonthlyReport(reportMonth, reportYear);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (!isAuthenticated) {
    return <AdminPinDialog open={true} />;
  }

  const activeEmployees = employees.filter((e) => e.active);
  const totalEntries = entries.length;
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  // Today's entries
  const todayStr = now.toISOString().split('T')[0];
  const todayEntries = entries.filter((e) => e.work_date === todayStr);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Admin</h1>
        <Button variant="ghost" size="sm" onClick={() => { logout(); router.push('/'); }} className="text-neutral-400 hover:text-neutral-600">
          <LogOut className="mr-1 h-4 w-4" />
          Abmelden
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs sm:text-sm">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Mitarbeiter</span>
          </TabsTrigger>
          <TabsTrigger value="entries" className="gap-1.5 text-xs sm:text-sm">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Einträge</span>
          </TabsTrigger>
          <TabsTrigger value="absences" className="gap-1.5 text-xs sm:text-sm">
            <CalendarOff className="h-4 w-4" />
            <span className="hidden sm:inline">Abwesenheit</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Berichte</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-5">
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
                      <div key={entry.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-xs font-bold text-neutral-900">
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

          {/* Active Employees Quick View */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Aktive Mitarbeiter</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activeEmployees.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-xs font-bold text-neutral-900">
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
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees">
          {empLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <EmployeeTable employees={employees} onRefresh={refreshEmployees} />
          )}
        </TabsContent>

        {/* Entries Tab */}
        <TabsContent value="entries">
          <EntryManager employees={employees} />
        </TabsContent>

        {/* Absences Tab */}
        <TabsContent value="absences">
          <AbsenceManager employees={employees} />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
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

          {reportLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <ReportTable report={report} month={reportMonth} year={reportYear} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

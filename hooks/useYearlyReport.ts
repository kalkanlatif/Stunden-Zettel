'use client';

import { useState, useEffect, useCallback } from 'react';
import { Employee, TimeEntry, Absence } from '@/types';

export interface MonthSummary {
  month: number; // 1-12
  totalHours: number;
  workDays: number;
  totalBreakMinutes: number;
  avgHoursPerDay: number;
  absenceCount: number;
  absencesByType: Record<string, number>;
  entries: TimeEntry[];
  absences: Absence[];
}

export interface EmployeeYearReport {
  employee: Employee;
  months: MonthSummary[];
  yearTotalHours: number;
  yearTotalDays: number;
  yearAbsenceCount: number;
}

export function useYearlyReport(year: number) {
  const [reports, setReports] = useState<EmployeeYearReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, entRes, absRes] = await Promise.all([
        fetch('/api/employees?all=true'),
        fetch(`/api/entries?year=${year}`),
        fetch(`/api/absences?year=${year}`),
      ]);

      const empJson = await empRes.json();
      const entJson = await entRes.json();
      const absJson = await absRes.json();

      if (!empRes.ok || !entRes.ok || !absRes.ok) throw new Error('Fehler beim Laden');

      const employees: Employee[] = empJson.data;
      const entries: TimeEntry[] = entJson.data;
      const absences: Absence[] = absJson.data;

      const result: EmployeeYearReport[] = employees.map((emp) => {
        const empEntries = entries.filter((e) => e.employee_id === emp.id);
        const empAbsences = absences.filter((a) => a.employee_id === emp.id);

        const months: MonthSummary[] = Array.from({ length: 12 }, (_, i) => {
          const m = i + 1;
          const monthEntries = empEntries
            .filter((e) => parseInt(e.work_date.split('-')[1], 10) === m)
            .sort((a, b) => a.work_date.localeCompare(b.work_date));
          const monthAbsences = empAbsences
            .filter((a) => parseInt(a.absence_date.split('-')[1], 10) === m)
            .sort((a, b) => a.absence_date.localeCompare(b.absence_date));

          const absencesByType: Record<string, number> = {};
          monthAbsences.forEach((a) => {
            absencesByType[a.absence_type] = (absencesByType[a.absence_type] || 0) + 1;
          });

          const totalHours = monthEntries.reduce((sum, e) => sum + Number(e.total_hours), 0);
          const totalBreakMinutes = monthEntries.reduce((sum, e) => sum + (e.break_minutes || 0), 0);

          return {
            month: m,
            totalHours,
            workDays: monthEntries.length,
            totalBreakMinutes,
            avgHoursPerDay: monthEntries.length > 0 ? totalHours / monthEntries.length : 0,
            absenceCount: monthAbsences.length,
            absencesByType,
            entries: monthEntries,
            absences: monthAbsences,
          };
        });

        return {
          employee: emp,
          months,
          yearTotalHours: months.reduce((s, m) => s + m.totalHours, 0),
          yearTotalDays: months.reduce((s, m) => s + m.workDays, 0),
          yearAbsenceCount: months.reduce((s, m) => s + m.absenceCount, 0),
        };
      });

      setReports(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  return { reports, loading, error, refresh: load };
}

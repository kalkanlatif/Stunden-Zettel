'use client';

import { useState, useEffect, useCallback } from 'react';
import { Employee, TimeEntry } from '@/types';

export interface EmployeeReport {
  employee: Employee;
  entries: TimeEntry[];
  totalHours: number;
  workDays: number;
}

export function useMonthlyReport(month: number, year: number) {
  const [report, setReport] = useState<EmployeeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, entRes] = await Promise.all([
        fetch('/api/employees?all=true'),
        fetch(`/api/entries?month=${month}&year=${year}`),
      ]);

      const empJson = await empRes.json();
      const entJson = await entRes.json();

      if (!empRes.ok || !entRes.ok) throw new Error('Fehler beim Laden');

      const employees: Employee[] = empJson.data;
      const entries: TimeEntry[] = entJson.data;

      const result: EmployeeReport[] = employees
        .map((emp) => {
          const empEntries = entries
            .filter((e) => e.employee_id === emp.id)
            .sort((a, b) => a.work_date.localeCompare(b.work_date));
          return {
            employee: emp,
            entries: empEntries,
            totalHours: empEntries.reduce((sum, e) => sum + Number(e.total_hours), 0),
            workDays: empEntries.length,
          };
        })
        .filter((r) => r.workDays > 0);

      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  return { report, loading, error, refresh: load };
}

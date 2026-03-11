'use client';

import { useState, useEffect, useCallback } from 'react';
import { Absence } from '@/types';

interface UseAbsencesOptions {
  employeeId?: string;
  month?: number;
  year?: number;
  date?: string; // specific date: YYYY-MM-DD
}

export function useAbsences({ employeeId, month, year, date }: UseAbsencesOptions) {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (employeeId) params.set('employee_id', employeeId);
      if (date) {
        params.set('date', date);
      } else {
        if (month) params.set('month', String(month));
        if (year) params.set('year', String(year));
      }

      const res = await fetch(`/api/absences?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAbsences(json.data);
    } catch {
      setAbsences([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, month, year, date]);

  useEffect(() => {
    load();
  }, [load]);

  return { absences, loading, refresh: load };
}

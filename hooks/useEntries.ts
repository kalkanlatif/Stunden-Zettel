'use client';

import { useState, useEffect, useCallback } from 'react';
import { TimeEntry } from '@/types';

interface UseEntriesOptions {
  employeeId?: string;
  month?: number;
  year?: number;
  date?: string;
}

export function useEntries({ employeeId, month, year, date }: UseEntriesOptions) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (employeeId) params.set('employee_id', employeeId);
      if (month) params.set('month', String(month));
      if (year) params.set('year', String(year));
      if (date) params.set('date', date);

      const res = await fetch(`/api/entries?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Fehler beim Laden');
      setEntries(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, [employeeId, month, year, date]);

  useEffect(() => {
    load();
  }, [load]);

  return { entries, loading, error, refresh: load };
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Employee } from '@/types';

export function useEmployees(all: boolean = false) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = all ? '/api/employees?all=true' : '/api/employees';
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Fehler beim Laden');
      setEmployees(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }, [all]);

  useEffect(() => {
    load();
  }, [load]);

  return { employees, loading, error, refresh: load };
}

export function useSingleEmployee(id: string) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/employees/${id}`);
        const json = await res.json();
        if (res.ok) setEmployee(json.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return { employee, loading };
}

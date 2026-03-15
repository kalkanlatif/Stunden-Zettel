'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AppSettings {
  businessName: string;
  minimumWage: number;
  minijobLimit: number;
}

const STORAGE_KEY = 'kalkan-settings';

const DEFAULTS: AppSettings = {
  businessName: process.env.NEXT_PUBLIC_BETRIEB_NAME || 'Kalkan Restaurant',
  minimumWage: 12.82,
  minijobLimit: 538,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        setSettings({ ...DEFAULTS, ...parsed });
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { settings, loaded, update, reset };
}

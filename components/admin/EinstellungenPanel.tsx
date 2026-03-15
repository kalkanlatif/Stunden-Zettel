'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Clock,
  Euro,
  Shield,
  Info,
  Save,
  RotateCcw,
  CheckCircle2,
  Database,
  Users,
  FileText,
  CalendarOff,
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/hooks/use-toast';
import {
  MAX_HOURS_PER_DAY,
  MAX_TIME_BLOCKS,
  MILOG_DEADLINE_DAYS,
  APP_NAME,
} from '@/lib/constants';
import { formatHours } from '@/lib/utils/time';

const GLASS =
  'rounded-2xl border border-white/80 bg-white/60 p-4 shadow-sm backdrop-blur-xl';
const GLASS_STYLE = {
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};
const SECTION_TITLE =
  'text-[10px] font-semibold uppercase tracking-wider text-neutral-400';
const INPUT_CLASS =
  'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300 text-amber-900 font-medium';

interface Props {
  totalEntries: number;
  totalAbsences: number;
}

export function EinstellungenPanel({ totalEntries, totalAbsences }: Props) {
  const { settings, loaded, update, reset } = useSettings();
  const { employees } = useEmployees(true);
  const { toast } = useToast();

  const [businessName, setBusinessName] = useState('');
  const [minimumWage, setMinimumWage] = useState('');
  const [minijobLimit, setMinijobLimit] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Sync form fields when settings load
  useEffect(() => {
    if (loaded) {
      setBusinessName(settings.businessName);
      setMinimumWage(settings.minimumWage.toFixed(2).replace('.', ','));
      setMinijobLimit(String(settings.minijobLimit));
    }
  }, [loaded, settings]);

  // Track changes
  useEffect(() => {
    if (!loaded) return;
    const wageNum = parseFloat(minimumWage.replace(',', '.'));
    const limitNum = parseInt(minijobLimit);
    const changed =
      businessName !== settings.businessName ||
      (!isNaN(wageNum) && wageNum !== settings.minimumWage) ||
      (!isNaN(limitNum) && limitNum !== settings.minijobLimit);
    setHasChanges(changed);
  }, [businessName, minimumWage, minijobLimit, settings, loaded]);

  const handleSave = () => {
    const wageNum = parseFloat(minimumWage.replace(',', '.'));
    const limitNum = parseInt(minijobLimit);

    if (!businessName.trim()) {
      toast({ title: 'Fehler', description: 'Betriebsname darf nicht leer sein.', variant: 'destructive' });
      return;
    }
    if (isNaN(wageNum) || wageNum <= 0) {
      toast({ title: 'Fehler', description: 'Ungültiger Mindestlohn.', variant: 'destructive' });
      return;
    }
    if (isNaN(limitNum) || limitNum <= 0) {
      toast({ title: 'Fehler', description: 'Ungültige Minijob-Grenze.', variant: 'destructive' });
      return;
    }

    update({
      businessName: businessName.trim(),
      minimumWage: wageNum,
      minijobLimit: limitNum,
    });

    toast({ title: 'Gespeichert', description: 'Einstellungen wurden aktualisiert.' });
    setHasChanges(false);
  };

  const handleReset = () => {
    reset();
    toast({ title: 'Zurückgesetzt', description: 'Alle Einstellungen auf Standardwerte zurückgesetzt.' });
  };

  const activeEmployees = employees.filter((e) => e.active).length;
  const inactiveEmployees = employees.length - activeEmployees;
  const minijobMaxHours = parseFloat(minijobLimit.replace(',', '.')) / parseFloat(minimumWage.replace(',', '.'));

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      {/* Section: Betrieb */}
      <div className={GLASS} style={GLASS_STYLE}>
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-amber-500" />
          <span className={SECTION_TITLE}>Betrieb</span>
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Betriebsname
          </label>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className={INPUT_CLASS}
            maxLength={100}
          />
          <p className="mt-1 text-[9px] text-neutral-400">
            Wird im Header und in PDF-Dokumenten angezeigt.
          </p>
        </div>
      </div>

      {/* Section: Minijob */}
      <div className={GLASS} style={GLASS_STYLE}>
        <div className="mb-3 flex items-center gap-2">
          <Euro className="h-3.5 w-3.5 text-amber-500" />
          <span className={SECTION_TITLE}>Minijob-Einstellungen</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Mindestlohn (EUR/Std.)
            </label>
            <input
              value={minimumWage}
              onChange={(e) => setMinimumWage(e.target.value)}
              className={INPUT_CLASS}
              placeholder="12,82"
              inputMode="decimal"
            />
            <p className="mt-1 text-[9px] text-neutral-400">
              Aktueller gesetzlicher Mindestlohn gem. MiLoG. Ab 2025: 12,82 EUR.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Minijob-Grenze (EUR/Monat)
            </label>
            <input
              value={minijobLimit}
              onChange={(e) => setMinijobLimit(e.target.value)}
              className={INPUT_CLASS}
              placeholder="538"
              inputMode="numeric"
            />
          </div>

          {/* Calculated max hours */}
          <div className="rounded-xl bg-amber-50 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-amber-700">Max. Stunden/Monat</span>
              <span className="text-sm font-bold text-amber-900">
                {!isNaN(minijobMaxHours) && isFinite(minijobMaxHours)
                  ? formatHours(Math.floor(minijobMaxHours * 100) / 100)
                  : '—'}
              </span>
            </div>
            <p className="mt-0.5 text-[9px] text-amber-600">
              Automatisch berechnet: {minijobLimit} EUR ÷ {minimumWage} EUR/Std.
            </p>
          </div>
        </div>
      </div>

      {/* Section: Arbeitszeit-Regeln (read-only) */}
      <div className={GLASS} style={GLASS_STYLE}>
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <span className={SECTION_TITLE}>Arbeitszeit-Regeln</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5">
            <div>
              <span className="text-xs font-medium text-neutral-700">Max. Stunden pro Tag</span>
              <p className="text-[9px] text-neutral-400">ArbZG § 3</p>
            </div>
            <span className="text-sm font-bold text-amber-900">{MAX_HOURS_PER_DAY} Std.</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5">
            <div>
              <span className="text-xs font-medium text-neutral-700">Max. Schichten pro Tag</span>
              <p className="text-[9px] text-neutral-400">Systemeinstellung</p>
            </div>
            <span className="text-sm font-bold text-amber-900">{MAX_TIME_BLOCKS}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5">
            <div>
              <span className="text-xs font-medium text-neutral-700">Dokumentationsfrist</span>
              <p className="text-[9px] text-neutral-400">§ 17 MiLoG</p>
            </div>
            <span className="text-sm font-bold text-amber-900">{MILOG_DEADLINE_DAYS} Tage</span>
          </div>
        </div>
        <div className="mt-2 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
          <p className="text-[9px] text-blue-700">
            Diese Werte sind gesetzlich festgelegt und können nicht geändert werden.
          </p>
        </div>
      </div>

      {/* Section: Daten & Speicher */}
      <div className={GLASS} style={GLASS_STYLE}>
        <div className="mb-3 flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-amber-500" />
          <span className={SECTION_TITLE}>Daten & Speicher</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <Users className="mx-auto mb-1 h-4 w-4 text-amber-500" />
            <p className="text-lg font-bold text-amber-900">{activeEmployees}</p>
            <p className="text-[8px] uppercase text-neutral-400">Aktiv</p>
            {inactiveEmployees > 0 && (
              <p className="text-[8px] text-neutral-400">+{inactiveEmployees} inaktiv</p>
            )}
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <FileText className="mx-auto mb-1 h-4 w-4 text-amber-500" />
            <p className="text-lg font-bold text-amber-900">{totalEntries}</p>
            <p className="text-[8px] uppercase text-neutral-400">Einträge</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3 text-center">
            <CalendarOff className="mx-auto mb-1 h-4 w-4 text-amber-500" />
            <p className="text-lg font-bold text-amber-900">{totalAbsences}</p>
            <p className="text-[8px] uppercase text-neutral-400">Abwesenheiten</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          <span className="text-[10px] font-medium text-green-700">Supabase verbunden</span>
        </div>
      </div>

      {/* Section: Über die App */}
      <div className={GLASS} style={GLASS_STYLE}>
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-amber-500" />
          <span className={SECTION_TITLE}>Über die App</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">App</span>
            <span className="text-xs font-semibold text-amber-900">{APP_NAME}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Version</span>
            <span className="text-xs font-semibold text-amber-900">1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Rechtsgrundlage</span>
            <span className="text-xs font-semibold text-amber-900">§ 17 MiLoG</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Aufbewahrungspflicht</span>
            <span className="text-xs font-semibold text-amber-900">Mind. 2 Jahre</span>
          </div>
          <div className="border-t border-neutral-100 my-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Entwickler</span>
              <span className="text-xs font-semibold text-amber-900">Latif Kalkan</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Code-Assistent</span>
            <span className="text-xs font-semibold text-amber-900">Claude Code Opus 4.6</span>
          </div>
        </div>
      </div>

      {/* Save / Reset buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          Speichern
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white/60 px-5 py-3.5 text-sm font-semibold text-neutral-500 transition-all hover:bg-neutral-50 active:scale-[0.98]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}

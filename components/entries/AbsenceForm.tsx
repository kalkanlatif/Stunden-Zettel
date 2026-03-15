'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Absence, AbsenceType, TimeEntry } from '@/types';
import { ABSENCE_TYPES, ABSENCE_BADGE_COLORS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

interface Props {
  employeeId: string;
  date: string;
  existingEntry?: TimeEntry;
  absences: Absence[];
  onSaved: () => void;
}

export function AbsenceForm({ employeeId, date, existingEntry, absences, onSaved }: Props) {
  const [absenceType, setAbsenceType] = useState<AbsenceType>('Urlaub');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    // Mutual exclusion check
    if (existingEntry) {
      toast({
        title: 'Konflikt',
        description: `Für den ${date} ist bereits Arbeitszeit eingetragen. Bitte zuerst den Eintrag unten entfernen.`,
        variant: 'destructive',
      });
      return;
    }

    const existingAbsence = absences.find((a) => a.absence_date === date);
    if (existingAbsence) {
      toast({
        title: 'Konflikt',
        description: `Für den ${date} ist bereits eine Abwesenheit (${existingAbsence.absence_type}) eingetragen.`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          absence_date: date,
          absence_type: absenceType,
          notes: notes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast({ title: 'Fehler', description: json.error || 'Speichern fehlgeschlagen', variant: 'destructive' });
        return;
      }

      toast({ title: 'Gespeichert', description: 'Abwesenheit wurde eingetragen.' });
      setNotes('');
      onSaved();
    } catch {
      toast({ title: 'Fehler', description: 'Verbindung fehlgeschlagen', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Type chips */}
      <div>
        <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Art der Abwesenheit</span>
        <div className="flex flex-wrap gap-1.5">
          {ABSENCE_TYPES.map((type) => {
            const isActive = absenceType === type;
            const colors = ABSENCE_BADGE_COLORS[type] || '';
            return (
              <button
                key={type}
                type="button"
                onClick={() => setAbsenceType(type as AbsenceType)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'ring-2 ring-amber-400 ring-offset-1 ' + colors
                    : colors + ' opacity-50 hover:opacity-80'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Bemerkung (optional)"
        maxLength={500}
        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm placeholder:text-neutral-300 outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300"
      />

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-400 to-red-500 py-3 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {saving ? 'Wird gespeichert...' : 'Abwesenheit eintragen'}
      </button>
    </div>
  );
}

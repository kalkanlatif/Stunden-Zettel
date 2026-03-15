'use client';

import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Save, AlertTriangle, Coffee, CalendarOff, Edit } from 'lucide-react';
import { TimeBlock, Absence, TimeEntry } from '@/types';
import { TimeBlockInput } from './TimeBlockInput';
import { DatePicker } from './DatePicker';
import { AbsenceForm } from './AbsenceForm';
import { calculateTotalHours, hasOverlap, formatHours, calculatePauses, formatMinutes } from '@/lib/utils/time';
import { MAX_TIME_BLOCKS, MAX_HOURS_PER_DAY } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

interface Props {
  employeeId: string;
  entries: TimeEntry[];
  absences: Absence[];
  workDate: string;
  onWorkDateChange: (date: string) => void;
  onSaved: () => void;
  onAbsenceSaved: () => void;
}

export function TimeEntryForm({ employeeId, entries, absences, workDate, onWorkDateChange, onSaved, onAbsenceSaved }: Props) {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([
    { start: '', end: '' },
    { start: '', end: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Find existing entry for selected date
  const existingEntry = useMemo(
    () => entries.find((e) => e.work_date === workDate),
    [entries, workDate]
  );
  const existingAbsence = useMemo(
    () => absences.find((a) => a.absence_date === workDate),
    [absences, workDate]
  );

  const isEditing = !!existingEntry;

  // Load existing entry data when date changes
  useEffect(() => {
    if (existingEntry) {
      setTimeBlocks(existingEntry.time_blocks.length > 0 ? [...existingEntry.time_blocks] : [{ start: '', end: '' }]);
      setNotes(existingEntry.notes || '');
    } else {
      setTimeBlocks([{ start: '', end: '' }, { start: '', end: '' }]);
      setNotes('');
    }
  }, [existingEntry]);

  const validBlocks = timeBlocks.filter((b) => b.start && b.end && b.end > b.start);
  const pauses = calculatePauses(validBlocks);
  const totalBreakMinutes = pauses.reduce((sum, p) => sum + p.minutes, 0);
  const totalHours = calculateTotalHours(validBlocks);

  const handleBlockChange = (index: number, block: TimeBlock) => {
    const updated = [...timeBlocks];
    updated[index] = block;
    setTimeBlocks(updated);
  };

  const handleBlockRemove = (index: number) => {
    setTimeBlocks(timeBlocks.filter((_, i) => i !== index));
  };

  const addBlock = () => {
    if (timeBlocks.length < MAX_TIME_BLOCKS) {
      setTimeBlocks([...timeBlocks, { start: '', end: '' }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mutual exclusion check
    if (existingAbsence) {
      toast({
        title: 'Konflikt',
        description: `Für den ${workDate} ist bereits eine Abwesenheit (${existingAbsence.absence_type}) eingetragen. Bitte zuerst die Abwesenheit unten entfernen.`,
        variant: 'destructive',
      });
      return;
    }

    const validBlocks = timeBlocks.filter((b) => b.start && b.end);

    if (validBlocks.length === 0) {
      toast({ title: 'Fehler', description: 'Bitte Arbeitszeit eingeben (Von / Bis)', variant: 'destructive' });
      return;
    }

    if (hasOverlap(validBlocks)) {
      toast({ title: 'Fehler', description: 'Zeitblöcke dürfen sich nicht überschneiden', variant: 'destructive' });
      return;
    }

    if (totalHours > MAX_HOURS_PER_DAY) {
      toast({ title: 'Fehler', description: `Maximale tägliche Arbeitszeit: ${MAX_HOURS_PER_DAY} Stunden`, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const url = isEditing ? `/api/entries/${existingEntry.id}` : '/api/entries';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          work_date: workDate,
          time_blocks: validBlocks,
          break_minutes: totalBreakMinutes,
          notes: notes || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast({ title: 'Fehler', description: json.error || 'Speichern fehlgeschlagen', variant: 'destructive' });
        return;
      }

      toast({
        title: isEditing ? 'Aktualisiert' : 'Gespeichert',
        description: isEditing ? 'Arbeitszeit wurde aktualisiert.' : 'Arbeitszeit wurde erfolgreich eingetragen.',
      });

      if (!isEditing) {
        setTimeBlocks([{ start: '', end: '' }, { start: '', end: '' }]);
        setNotes('');
      }
      onSaved();
    } catch {
      toast({ title: 'Fehler', description: 'Verbindung zum Server fehlgeschlagen', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date */}
      <DatePicker value={workDate} onChange={onWorkDateChange} />

      {/* Edit mode indicator */}
      {isEditing && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5">
          <Edit className="h-4 w-4 text-amber-600" />
          <p className="text-xs font-semibold text-amber-800">
            Eintrag vorhanden — Änderungen überschreiben den bestehenden Eintrag.
          </p>
        </div>
      )}

      {/* Time blocks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <Label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Arbeitszeit</Label>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            {timeBlocks.length} {timeBlocks.length === 1 ? 'Schicht' : 'Schichten'}
          </span>
        </div>

        {timeBlocks.map((block, i) => (
          <div key={i}>
            <TimeBlockInput
              index={i}
              block={block}
              onChange={handleBlockChange}
              onRemove={handleBlockRemove}
              canRemove={timeBlocks.length > 1}
            />
            {/* Pause indicator between shifts */}
            {i < timeBlocks.length - 1 && (() => {
              const currentEnd = block.end;
              const nextStart = timeBlocks[i + 1]?.start;
              if (currentEnd && nextStart && nextStart > currentEnd) {
                const [sh, sm] = currentEnd.split(':').map(Number);
                const [eh, em] = nextStart.split(':').map(Number);
                const pauseMin = (eh * 60 + em) - (sh * 60 + sm);
                if (pauseMin > 0) {
                  return (
                    <div className="flex items-center gap-2 px-4 py-1.5">
                      <div className="h-px flex-1 bg-amber-200" />
                      <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1">
                        <Coffee className="h-3 w-3 text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-600">
                          Pause: {formatMinutes(pauseMin)}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-amber-200" />
                    </div>
                  );
                }
              }
              return (
                <div className="flex items-center gap-2 px-4 py-1.5">
                  <div className="h-px flex-1 bg-neutral-100" />
                  <span className="text-[9px] text-neutral-300">Pause</span>
                  <div className="h-px flex-1 bg-neutral-100" />
                </div>
              );
            })()}
          </div>
        ))}

        {timeBlocks.length < MAX_TIME_BLOCKS && (
          <button
            type="button"
            onClick={addBlock}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-200 py-3 text-xs font-semibold text-neutral-400 transition-all hover:border-amber-300 hover:text-amber-600 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            Weitere Schicht hinzufügen
          </button>
        )}
      </div>

      {/* Summary: Pause + Total */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl border border-white/80 bg-white/60 p-3.5 backdrop-blur-xl"
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Coffee className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Pause</span>
          </div>
          {totalBreakMinutes > 0 ? (
            <p className="text-lg font-bold text-amber-900">{formatMinutes(totalBreakMinutes)}</p>
          ) : (
            <p className="text-sm text-neutral-300">—</p>
          )}
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 p-3.5 shadow-sm">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-800/60">Gesamt</span>
          <p className="text-lg font-bold text-white">{formatHours(totalHours)}</p>
        </div>
      </div>

      {totalHours > MAX_HOURS_PER_DAY && (
        <Alert variant="destructive" className="rounded-2xl py-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">
            Max. {MAX_HOURS_PER_DAY} Stunden pro Tag (ArbZG §3)
          </AlertDescription>
        </Alert>
      )}

      {/* Notes */}
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={500}
        placeholder="Bemerkung (optional)"
        rows={2}
        className="resize-none rounded-2xl border-neutral-200 bg-white/60 text-sm placeholder:text-neutral-300 backdrop-blur-xl"
      />

      {/* Submit — Arbeitszeit */}
      <button
        type="submit"
        disabled={saving}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 ${
          isEditing
            ? 'bg-gradient-to-r from-blue-400 to-blue-500'
            : 'bg-gradient-to-r from-amber-400 to-amber-500'
        }`}
      >
        {isEditing ? <Edit className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saving ? 'Wird gespeichert...' : isEditing ? 'Änderungen speichern' : 'Arbeitszeit speichern'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-neutral-200" />
        <div className="flex items-center gap-1.5">
          <CalendarOff className="h-3 w-3 text-red-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">oder Abwesenheit</span>
        </div>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      {/* Absence — uses same workDate */}
      <div
        className="rounded-2xl border border-white/80 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <AbsenceForm
          employeeId={employeeId}
          date={workDate}
          existingEntry={existingEntry}
          absences={absences}
          onSaved={onAbsenceSaved}
        />
      </div>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Save, AlertTriangle, CalendarDays, Coffee } from 'lucide-react';
import { TimeBlock } from '@/types';
import { TimeBlockInput } from './TimeBlockInput';
import { calculateTotalHours, hasOverlap, formatHours, calculatePauses, formatMinutes } from '@/lib/utils/time';
import { MAX_TIME_BLOCKS, MAX_HOURS_PER_DAY } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Props {
  employeeId: string;
  onSaved: () => void;
}

export function TimeEntryForm({ employeeId, onSaved }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [workDate, setWorkDate] = useState(today);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([{ start: '', end: '' }]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const validBlocks = timeBlocks.filter((b) => b.start && b.end && b.end > b.start);
  const pauses = calculatePauses(validBlocks);
  const totalBreakMinutes = pauses.reduce((sum, p) => sum + p.minutes, 0);
  const totalHours = calculateTotalHours(validBlocks, totalBreakMinutes);

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
      const res = await fetch('/api/entries', {
        method: 'POST',
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

      toast({ title: 'Gespeichert', description: 'Arbeitszeit wurde erfolgreich eingetragen.' });

      setTimeBlocks([{ start: '', end: '' }]);
      setNotes('');
      onSaved();
    } catch {
      toast({ title: 'Fehler', description: 'Verbindung zum Server fehlgeschlagen', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date */}
          <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-amber-500" />
            <div className="flex-1">
              <span className="block text-[10px] font-medium uppercase text-neutral-400">Arbeitstag</span>
              <Input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="h-8 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Time blocks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <Label className="text-[10px] font-medium uppercase text-neutral-400">Arbeitszeit</Label>
              {timeBlocks.length > 1 && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                  {timeBlocks.length} Schichten
                </span>
              )}
            </div>
            {timeBlocks.map((block, i) => (
              <TimeBlockInput
                key={i}
                index={i}
                block={block}
                onChange={handleBlockChange}
                onRemove={handleBlockRemove}
                canRemove={timeBlocks.length > 1}
              />
            ))}
            {timeBlocks.length < MAX_TIME_BLOCKS && (
              <button
                type="button"
                onClick={addBlock}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-200 py-2 text-[11px] font-medium text-neutral-400 transition-colors hover:border-amber-300 hover:text-amber-600"
              >
                <Plus className="h-3 w-3" />
                Weitere Schicht
              </button>
            )}
          </div>

          {/* Pause (auto-calculated) + Total */}
          <div className="flex gap-3">
            <div className="flex flex-1 items-start gap-2.5 rounded-xl bg-neutral-50 px-3 py-2.5">
              <Coffee className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300" />
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] font-medium uppercase text-neutral-400">Pause (auto)</span>
                {pauses.length === 0 ? (
                  <span className="text-xs text-neutral-400">Keine Pause</span>
                ) : (
                  <div className="mt-0.5 space-y-0.5">
                    {pauses.map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="text-neutral-500">{p.start}–{p.end}</span>
                        <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          {formatMinutes(p.minutes)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-1 items-center justify-between rounded-xl bg-amber-400/15 px-4 py-2.5">
              <span className="text-[10px] font-medium uppercase text-amber-700">Gesamt</span>
              <span className="text-lg font-bold text-amber-900">
                {formatHours(totalHours)}
              </span>
            </div>
          </div>

          {totalHours > MAX_HOURS_PER_DAY && (
            <Alert variant="destructive" className="py-2">
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
            className="resize-none rounded-xl border-neutral-200 bg-neutral-50 text-sm placeholder:text-neutral-300"
          />

          {/* Submit */}
          <Button type="submit" disabled={saving} className="w-full rounded-xl bg-amber-500 py-5 text-sm font-semibold text-white hover:bg-amber-600">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

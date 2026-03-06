'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Save, AlertTriangle } from 'lucide-react';
import { TimeBlock } from '@/types';
import { TimeBlockInput } from './TimeBlockInput';
import { calculateTotalHours, hasOverlap, formatHours } from '@/lib/utils/time';
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
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const totalHours = calculateTotalHours(
    timeBlocks.filter((b) => b.start && b.end && b.end > b.start),
    breakMinutes
  );

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
          break_minutes: breakMinutes,
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
      setBreakMinutes(0);
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
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">Arbeitszeit eintragen</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="work-date" className="text-xs text-neutral-500">Arbeitstag</Label>
            <Input
              id="work-date"
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="mt-1 w-full sm:w-48"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-neutral-500">Arbeitszeit (Von – Bis)</Label>
              {timeBlocks.length > 1 && (
                <span className="text-[10px] text-neutral-400">
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
              <Button type="button" variant="outline" size="sm" onClick={addBlock} className="text-xs">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Weitere Schicht hinzufügen
              </Button>
            )}
            <p className="text-[10px] text-neutral-400">
              Falls du an einem Tag mehrere Schichten gearbeitet hast, kannst du weitere hinzufügen.
            </p>
          </div>

          <div>
            <Label htmlFor="break" className="text-xs text-neutral-500">Pause (Minuten)</Label>
            <Input
              id="break"
              type="number"
              min={0}
              max={120}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="mt-1 w-full sm:w-32"
            />
          </div>

          {/* Total hours */}
          <div className="flex items-center justify-between rounded-xl bg-amber-400/10 px-4 py-3">
            <span className="text-sm text-neutral-600">Gesamt</span>
            <span className="text-xl font-bold text-neutral-900">
              {formatHours(totalHours)}
            </span>
          </div>

          {totalHours > MAX_HOURS_PER_DAY && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Max. {MAX_HOURS_PER_DAY} Stunden pro Tag (ArbZG §3)
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="notes" className="text-xs text-neutral-500">Bemerkung (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="z.B. Veranstaltung, Krankheitsvertretung..."
              rows={2}
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full bg-neutral-900 text-white hover:bg-neutral-800">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

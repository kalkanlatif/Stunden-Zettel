'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      toast({ title: 'Fehler', description: 'Mindestens ein vollständiger Zeitblock erforderlich', variant: 'destructive' });
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

      // Reset form
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Arbeitszeit eintragen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <Label htmlFor="work-date">Arbeitstag</Label>
            <Input
              id="work-date"
              type="date"
              value={workDate}
              max={today}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-full sm:w-48"
            />
          </div>

          {/* Time blocks */}
          <div className="space-y-2">
            <Label>Zeitblöcke</Label>
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
              <Button type="button" variant="outline" size="sm" onClick={addBlock}>
                <Plus className="mr-1 h-4 w-4" />
                Weiteren Zeitblock hinzufügen
              </Button>
            )}
          </div>

          {/* Break */}
          <div>
            <Label htmlFor="break">Pause (Minuten)</Label>
            <Input
              id="break"
              type="number"
              min={0}
              max={120}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full sm:w-32"
            />
          </div>

          {/* Total hours display */}
          <div className="rounded-lg bg-[#1e3a5f]/5 p-4">
            <p className="text-sm text-gray-600">Gesamtstunden</p>
            <p className="text-2xl font-bold text-[#1e3a5f]">
              {formatHours(totalHours)}
            </p>
          </div>

          {totalHours > MAX_HOURS_PER_DAY && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Maximale tägliche Arbeitszeit von {MAX_HOURS_PER_DAY} Stunden überschritten (ArbZG §3)
              </AlertDescription>
            </Alert>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Bemerkung (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="z.B. Veranstaltung, Krankheitsvertretung..."
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button type="submit" disabled={saving} className="w-full bg-[#1e3a5f] hover:bg-[#2a4f7f]">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

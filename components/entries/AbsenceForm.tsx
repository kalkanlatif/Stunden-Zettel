'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarOff, Plus, Trash2 } from 'lucide-react';
import { Absence, AbsenceType } from '@/types';
import { ABSENCE_TYPES, ABSENCE_BADGE_COLORS } from '@/lib/constants';
import { formatDate, getWeekday } from '@/lib/utils/time';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Props {
  employeeId: string;
  absences: Absence[];
  onSaved: () => void;
}

export function AbsenceForm({ employeeId, absences, onSaved }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [absenceDate, setAbsenceDate] = useState(today);
  const [absenceType, setAbsenceType] = useState<AbsenceType>('Urlaub');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const sorted = [...absences].sort((a, b) => a.absence_date.localeCompare(b.absence_date));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      const res = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          absence_date: absenceDate,
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

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/absences/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: 'Gelöscht', description: 'Abwesenheit wurde entfernt.' });
      onSaved();
    } catch {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen', variant: 'destructive' });
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarOff className="h-4 w-4 text-red-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Abwesenheit</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 flex-1 min-w-[140px]">
              <Input
                type="date"
                value={absenceDate}
                onChange={(e) => setAbsenceDate(e.target.value)}
                className="h-8 border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
              />
            </div>
            <Select value={absenceType} onValueChange={(v) => setAbsenceType(v as AbsenceType)}>
              <SelectTrigger className="h-[42px] w-auto min-w-[150px] rounded-xl bg-neutral-50 border-0 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ABSENCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bemerkung (optional)"
              maxLength={500}
              className="rounded-xl border-neutral-200 bg-neutral-50 text-sm placeholder:text-neutral-300"
            />
            <Button type="submit" disabled={saving} size="sm" className="shrink-0 rounded-xl bg-neutral-900 px-4 text-white hover:bg-neutral-800">
              <Plus className="mr-1 h-3.5 w-3.5" />
              {saving ? '...' : 'Eintragen'}
            </Button>
          </div>
        </form>

        {/* List */}
        {sorted.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {sorted.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900">{formatDate(a.absence_date)}</span>
                      <span className="text-[11px] text-neutral-400">{getWeekday(a.absence_date)}</span>
                    </div>
                    {a.notes && <p className="text-xs text-neutral-400 mt-0.5">{a.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <Badge className={`text-[10px] ${ABSENCE_BADGE_COLORS[a.absence_type]}`}>
                    {a.absence_type}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-300 hover:text-red-500" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

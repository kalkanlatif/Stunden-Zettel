'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Plus } from 'lucide-react';
import { Employee, TimeBlock, TimeEntry } from '@/types';
import { useEntries } from '@/hooks/useEntries';
import { getMonthName, formatDate, formatTimeBlocks, formatHours, calculateHours, calculateTotalHours, hasOverlap } from '@/lib/utils/time';
import { MAX_HOURS_PER_DAY, MAX_TIME_BLOCKS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Props {
  employees: Employee[];
}

export function EntryManager({ employees }: Props) {
  const now = new Date();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  const { entries, loading, refresh } = useEntries({
    employeeId: selectedEmployee === 'all' ? undefined : selectedEmployee,
    month,
    year,
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editBlocks, setEditBlocks] = useState<TimeBlock[]>([{ start: '', end: '' }]);
  const [editBreak, setEditBreak] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const activeEmployees = employees.filter((e) => e.active);

  const openEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditBlocks(entry.time_blocks.length > 0 ? [...entry.time_blocks] : [{ start: '', end: '' }]);
    setEditBreak(entry.break_minutes);
    setEditNotes(entry.notes || '');
    setEditDate(entry.work_date);
    setEditEmployeeId(entry.employee_id);
    setEditDialogOpen(true);
  };

  const openNew = () => {
    setEditingEntry(null);
    setEditBlocks([{ start: '', end: '' }]);
    setEditBreak(0);
    setEditNotes('');
    setEditDate(format(new Date(), 'yyyy-MM-dd'));
    setEditEmployeeId(activeEmployees[0]?.id || '');
    setEditDialogOpen(true);
  };

  const handleBlockChange = (index: number, field: 'start' | 'end', value: string) => {
    const updated = [...editBlocks];
    updated[index] = { ...updated[index], [field]: value };
    setEditBlocks(updated);
  };

  const addBlock = () => {
    if (editBlocks.length < MAX_TIME_BLOCKS) {
      setEditBlocks([...editBlocks, { start: '', end: '' }]);
    }
  };

  const removeBlock = (index: number) => {
    setEditBlocks(editBlocks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const validBlocks = editBlocks.filter((b) => b.start && b.end && b.end > b.start);

    if (validBlocks.length === 0) {
      toast({ title: 'Fehler', description: 'Mindestens ein vollständiger Zeitblock erforderlich', variant: 'destructive' });
      return;
    }

    if (hasOverlap(validBlocks)) {
      toast({ title: 'Fehler', description: 'Zeitblöcke dürfen sich nicht überschneiden', variant: 'destructive' });
      return;
    }

    const totalHours = calculateTotalHours(validBlocks);
    if (totalHours > MAX_HOURS_PER_DAY) {
      toast({ title: 'Fehler', description: `Max. ${MAX_HOURS_PER_DAY} Stunden pro Tag`, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (editingEntry) {
        // Update existing
        const res = await fetch(`/api/entries/${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: editingEntry.employee_id,
            work_date: editingEntry.work_date,
            time_blocks: validBlocks,
            break_minutes: editBreak,
            notes: editNotes || undefined,
          }),
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || 'Aktualisierung fehlgeschlagen');
        }
        toast({ title: 'Aktualisiert', description: 'Eintrag wurde aktualisiert.' });
      } else {
        // Create new
        const res = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: editEmployeeId,
            work_date: editDate,
            time_blocks: validBlocks,
            break_minutes: editBreak,
            notes: editNotes || undefined,
          }),
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || 'Speichern fehlgeschlagen');
        }
        toast({ title: 'Gespeichert', description: 'Neuer Eintrag wurde angelegt.' });
      }
      setEditDialogOpen(false);
      refresh();
    } catch (err) {
      toast({ title: 'Fehler', description: err instanceof Error ? err.message : 'Fehler', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: TimeEntry) => {
    if (!confirm('Eintrag wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Löschen fehlgeschlagen');
      }
      toast({ title: 'Gelöscht', description: 'Eintrag wurde gelöscht.' });
      refresh();
    } catch (err) {
      toast({ title: 'Fehler', description: err instanceof Error ? err.message : 'Fehler', variant: 'destructive' });
    }
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? `${emp.first_name} ${emp.last_name}` : 'Unbekannt';
  };

  const getEmployeeInitials = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? `${emp.first_name[0]}${emp.last_name[0]}` : '??';
  };

  const totalHours = entries.reduce((sum, e) => sum + Number(e.total_hours), 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs text-neutral-500">Mitarbeiter</Label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="mt-1 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              {activeEmployees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-neutral-500">Monat</Label>
          <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
            <SelectTrigger className="mt-1 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {getMonthName(i + 1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-neutral-500">Jahr</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="mt-1 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew} className="bg-amber-500 text-white hover:bg-amber-600">
          <Plus className="mr-1 h-4 w-4" />
          Eintrag
        </Button>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between rounded-xl bg-amber-400/10 px-4 py-3">
        <span className="text-sm text-neutral-600">{entries.length} Einträge</span>
        <span className="text-sm font-bold text-amber-900">{formatHours(totalHours)} Std.</span>
      </div>

      {/* Entries */}
      {loading ? (
        <p className="py-8 text-center text-sm text-neutral-400">Laden...</p>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">Keine Einträge für diesen Zeitraum.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-100">
                <TableHead className="text-[11px] uppercase text-neutral-400">Mitarbeiter</TableHead>
                <TableHead className="text-[11px] uppercase text-neutral-400">Datum</TableHead>
                <TableHead className="text-[11px] uppercase text-neutral-400">Zeit</TableHead>
                <TableHead className="text-right text-[11px] uppercase text-neutral-400">Std.</TableHead>
                <TableHead className="text-right text-[11px] uppercase text-neutral-400">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} className="border-neutral-100">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-[10px] font-bold text-amber-900">
                        {getEmployeeInitials(entry.employee_id)}
                      </div>
                      <span className="text-sm font-medium">{getEmployeeName(entry.employee_id)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(entry.work_date)}</TableCell>
                  <TableCell className="text-sm text-neutral-600">{formatTimeBlocks(entry.time_blocks)}</TableCell>
                  <TableCell className="text-right text-sm font-semibold">{formatHours(Number(entry.total_hours))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(entry)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(entry)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}</DialogTitle>
            <DialogDescription>
              {editingEntry
                ? `${getEmployeeName(editingEntry.employee_id)} — ${formatDate(editingEntry.work_date)}`
                : 'Eintrag für einen Mitarbeiter anlegen'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editingEntry && (
              <>
                <div>
                  <Label className="text-xs text-neutral-500">Mitarbeiter</Label>
                  <Select value={editEmployeeId} onValueChange={setEditEmployeeId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeEmployees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500">Arbeitstag</Label>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-neutral-500">Zeitblöcke</Label>
              {editBlocks.map((block, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={block.start}
                    onChange={(e) => handleBlockChange(i, 'start', e.target.value)}
                    className="h-9 text-sm"
                  />
                  <span className="text-neutral-400">–</span>
                  <Input
                    type="time"
                    value={block.end}
                    onChange={(e) => handleBlockChange(i, 'end', e.target.value)}
                    className="h-9 text-sm"
                  />
                  {block.start && block.end && block.end > block.start && (
                    <span className="min-w-[3rem] text-center text-xs font-medium text-neutral-500">
                      {formatHours(calculateHours(block.start, block.end))}
                    </span>
                  )}
                  {editBlocks.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeBlock(i)} className="h-8 w-8 p-0 text-neutral-400 hover:text-red-500">
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {editBlocks.length < MAX_TIME_BLOCKS && (
                <Button variant="outline" size="sm" onClick={addBlock} className="text-xs">
                  <Plus className="mr-1 h-3 w-3" /> Block
                </Button>
              )}
            </div>

            <div>
              <Label className="text-xs text-neutral-500">Pause (Minuten)</Label>
              <Input
                type="number"
                min={0}
                max={120}
                value={editBreak}
                onChange={(e) => setEditBreak(Math.max(0, parseInt(e.target.value) || 0))}
                className="mt-1 w-24"
              />
            </div>

            <div>
              <Label className="text-xs text-neutral-500">Bemerkung</Label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional"
                maxLength={500}
                className="mt-1"
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-500 text-white hover:bg-amber-600">
              {saving ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

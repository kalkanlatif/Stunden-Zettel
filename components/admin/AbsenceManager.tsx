'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { Employee, AbsenceType } from '@/types';
import { useAbsences } from '@/hooks/useAbsences';
import { getMonthName, formatDate, getWeekday } from '@/lib/utils/time';
import { ABSENCE_TYPES, ABSENCE_BADGE_COLORS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Props {
  employees: Employee[];
}

export function AbsenceManager({ employees }: Props) {
  const now = new Date();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  const { absences, loading, refresh } = useAbsences({
    employeeId: selectedEmployee === 'all' ? undefined : selectedEmployee,
    month,
    year,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newType, setNewType] = useState<AbsenceType>('Urlaub');
  const [newNotes, setNewNotes] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const activeEmployees = employees.filter((e) => e.active);

  const openNew = () => {
    setNewDate(format(new Date(), 'yyyy-MM-dd'));
    setNewType('Urlaub');
    setNewNotes('');
    setNewEmployeeId(activeEmployees[0]?.id || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!newEmployeeId) {
      toast({ title: 'Fehler', description: 'Bitte Mitarbeiter auswählen', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: newEmployeeId,
          absence_date: newDate,
          absence_type: newType,
          notes: newNotes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Speichern fehlgeschlagen');
      }

      toast({ title: 'Gespeichert', description: 'Abwesenheit wurde eingetragen.' });
      setDialogOpen(false);
      refresh();
    } catch (err) {
      toast({ title: 'Fehler', description: err instanceof Error ? err.message : 'Fehler', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Abwesenheit wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/absences/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Löschen fehlgeschlagen');
      toast({ title: 'Gelöscht', description: 'Abwesenheit wurde entfernt.' });
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
          Abwesenheit
        </Button>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
        <span className="text-sm text-neutral-600">{absences.length} Abwesenheiten</span>
      </div>

      {/* Table */}
      {loading ? (
        <p className="py-8 text-center text-sm text-neutral-400">Laden...</p>
      ) : absences.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">Keine Abwesenheiten für diesen Zeitraum.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-100">
                <TableHead className="text-[11px] uppercase text-neutral-400">Mitarbeiter</TableHead>
                <TableHead className="text-[11px] uppercase text-neutral-400">Datum</TableHead>
                <TableHead className="text-[11px] uppercase text-neutral-400">Art</TableHead>
                <TableHead className="text-[11px] uppercase text-neutral-400">Bemerkung</TableHead>
                <TableHead className="text-right text-[11px] uppercase text-neutral-400">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {absences.map((absence) => (
                <TableRow key={absence.id} className="border-neutral-100">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-[10px] font-bold text-amber-900">
                        {getEmployeeInitials(absence.employee_id)}
                      </div>
                      <span className="text-sm font-medium">{getEmployeeName(absence.employee_id)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(absence.absence_date)}</div>
                    <div className="text-[11px] text-neutral-400">{getWeekday(absence.absence_date)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${ABSENCE_BADGE_COLORS[absence.absence_type]}`}>
                      {absence.absence_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-500">{absence.notes || '–'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(absence.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Abwesenheit</DialogTitle>
            <DialogDescription>Abwesenheit für einen Mitarbeiter eintragen</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-neutral-500">Mitarbeiter</Label>
              <Select value={newEmployeeId} onValueChange={setNewEmployeeId}>
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
              <Label className="text-xs text-neutral-500">Datum</Label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-neutral-500">Art</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as AbsenceType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ABSENCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-neutral-500">Bemerkung</Label>
              <Input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
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

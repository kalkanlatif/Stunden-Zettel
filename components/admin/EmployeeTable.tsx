'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import { Employee, EmploymentType } from '@/types';
import { EMPLOYMENT_BADGE_COLORS, EMPLOYMENT_TYPES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

interface Props {
  employees: Employee[];
  onRefresh: () => void;
}

export function EmployeeTable({ employees, onRefresh }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Minijob');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Only show active employees
  const activeEmployees = employees.filter((e) => e.active);

  const openNew = () => {
    setEditing(null);
    setFirstName('');
    setLastName('');
    setEmploymentType('Minijob');
    setDialogOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setFirstName(emp.first_name);
    setLastName(emp.last_name);
    setEmploymentType(emp.employment_type);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (firstName.length < 2 || lastName.length < 2) {
      toast({ title: 'Fehler', description: 'Vor- und Nachname müssen mindestens 2 Zeichen haben', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const url = editing ? `/api/employees/${editing.id}` : '/api/employees';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          employment_type: employmentType,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }

      toast({ title: 'Gespeichert', description: editing ? 'Mitarbeiter aktualisiert' : 'Neuer Mitarbeiter angelegt' });
      setDialogOpen(false);
      onRefresh();
    } catch (err) {
      toast({ title: 'Fehler', description: err instanceof Error ? err.message : 'Speichern fehlgeschlagen', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (emp: Employee) => {
    if (!confirm(`„${emp.first_name} ${emp.last_name}" wirklich entfernen?`)) return;

    try {
      const res = await fetch(`/api/employees/${emp.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: 'Entfernt', description: `${emp.first_name} ${emp.last_name} wurde entfernt.` });
      onRefresh();
    } catch {
      toast({ title: 'Fehler', description: 'Entfernung fehlgeschlagen', variant: 'destructive' });
    }
  };

  return (
    <>
      {/* Add button */}
      <button
        onClick={openNew}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 py-4 text-sm font-semibold text-amber-600 transition-all hover:border-amber-400 hover:bg-amber-50 active:scale-[0.98]"
      >
        <UserPlus className="h-4 w-4" />
        Neuen Mitarbeiter anlegen
      </button>

      {/* Employee list */}
      <div className="space-y-2.5">
        {activeEmployees.length === 0 && (
          <p className="py-8 text-center text-sm text-neutral-400">
            Noch keine Mitarbeiter angelegt.
          </p>
        )}
        {activeEmployees.map((emp) => (
          <div
            key={emp.id}
            className="flex items-center gap-3 rounded-2xl bg-white/60 border border-white/80 p-3.5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md"
            style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
          >
            {/* Avatar */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-400 text-sm font-bold text-amber-900 shadow-inner">
              {emp.first_name[0]}{emp.last_name[0]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-bold text-amber-900">
                {emp.first_name} {emp.last_name}
              </p>
              <Badge className={`mt-0.5 text-[9px] ${EMPLOYMENT_BADGE_COLORS[emp.employment_type]}`}>
                {emp.employment_type}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => openEdit(emp)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDeactivate(emp)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors hover:bg-red-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-amber-900">
              {editing ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter anlegen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold text-neutral-500">Vorname</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="z.B. Max"
                className="mt-1 rounded-xl border-neutral-200 focus-visible:ring-amber-400"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-neutral-500">Nachname</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="z.B. Müller"
                className="mt-1 rounded-xl border-neutral-200 focus-visible:ring-amber-400"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-neutral-500">Beschäftigungsart</Label>
              <Select value={employmentType} onValueChange={(v) => setEmploymentType(v as EmploymentType)}>
                <SelectTrigger className="mt-1 rounded-xl border-neutral-200 focus:ring-amber-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-3 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, UserMinus, UserPlus } from 'lucide-react';
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
  const [empPassword, setEmpPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const openNew = () => {
    setEditing(null);
    setFirstName('');
    setLastName('');
    setEmploymentType('Minijob');
    setEmpPassword('');
    setDialogOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setFirstName(emp.first_name);
    setLastName(emp.last_name);
    setEmploymentType(emp.employment_type);
    setEmpPassword(emp.password || '');
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
          ...(empPassword ? { password: empPassword } : {}),
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
    if (!confirm(`Möchtest du "${emp.first_name} ${emp.last_name}" wirklich deaktivieren?`)) return;

    try {
      const res = await fetch(`/api/employees/${emp.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: 'Deaktiviert', description: `${emp.first_name} ${emp.last_name} wurde deaktiviert.` });
      onRefresh();
    } catch {
      toast({ title: 'Fehler', description: 'Deaktivierung fehlgeschlagen', variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew} className="bg-neutral-900 text-white hover:bg-neutral-800">
          <UserPlus className="mr-2 h-4 w-4" />
          Neuen Mitarbeiter anlegen
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Passwort</TableHead>
              <TableHead>Beschäftigung</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.id} className={!emp.active ? 'opacity-50' : ''}>
                <TableCell className="font-medium">
                  {emp.first_name} {emp.last_name}
                </TableCell>
                <TableCell className="text-sm text-neutral-500">{emp.password}</TableCell>
                <TableCell>
                  <Badge className={EMPLOYMENT_BADGE_COLORS[emp.employment_type]}>
                    {emp.employment_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={emp.active ? 'default' : 'secondary'}>
                    {emp.active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(emp)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {emp.active && (
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeactivate(emp)}>
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter anlegen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vorname</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Vorname" />
            </div>
            <div>
              <Label>Nachname</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nachname" />
            </div>
            <div>
              <Label>Beschäftigungsart</Label>
              <Select value={employmentType} onValueChange={(v) => setEmploymentType(v as EmploymentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Passwort</Label>
              <Input
                value={empPassword}
                onChange={(e) => setEmpPassword(e.target.value)}
                placeholder={editing ? 'Leer lassen = unverändert' : 'Leer = Vorname kleingeschrieben'}
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-neutral-900 text-white hover:bg-neutral-800">
              {saving ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

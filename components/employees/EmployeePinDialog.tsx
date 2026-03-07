'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Employee } from '@/types';

interface Props {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
}

export function EmployeePinDialog({ employee, open, onClose }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/employees/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employee.id, password }),
      });

      if (res.ok) {
        setPassword('');
        setError('');
        onClose();
        router.push(`/enter/${employee.id}`);
      } else {
        setError('Falsches Passwort');
        setPassword('');
      }
    } catch {
      setError('Verbindung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setPassword(''); setError(''); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hallo, {employee.first_name}!</DialogTitle>
          <DialogDescription>
            Bitte gib dein Passwort ein, um fortzufahren.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="emp-password">Passwort</Label>
            <Input
              id="emp-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Dein Passwort eingeben"
              autoFocus
              autoComplete="off"
            />
            {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-neutral-900 text-white hover:bg-neutral-800">
            {loading ? 'Wird geprüft...' : 'Weiter'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

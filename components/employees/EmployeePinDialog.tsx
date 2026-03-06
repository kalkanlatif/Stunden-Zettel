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
  const router = useRouter();

  if (!employee) return null;

  // Password = first name in lowercase
  const expectedPassword = employee.first_name.toLowerCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toLowerCase().trim() === expectedPassword) {
      setPassword('');
      setError('');
      onClose();
      router.push(`/enter/${employee.id}`);
    } else {
      setError('Falsches Passwort');
      setPassword('');
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
          <Button type="submit" className="w-full bg-neutral-900 text-white hover:bg-neutral-800">
            Weiter
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

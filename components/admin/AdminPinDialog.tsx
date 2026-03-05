'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';
import { useAdminStore } from '@/store/admin.store';
import { DEFAULT_ADMIN_PIN } from '@/lib/constants';

interface Props {
  open: boolean;
}

export function AdminPinDialog({ open }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { authenticate } = useAdminStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple PIN check (in production, compare against hashed value from DB)
    if (pin === DEFAULT_ADMIN_PIN) {
      authenticate();
      setPin('');
      setError('');
    } else {
      setError('Falsche PIN');
      setPin('');
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Admin-Zugang
          </DialogTitle>
          <DialogDescription>
            Bitte gib die Admin-PIN ein, um fortzufahren.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="4-stellige PIN"
              autoFocus
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
          <Button type="submit" className="w-full bg-[#1e3a5f] hover:bg-[#2a4f7f]">
            Anmelden
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

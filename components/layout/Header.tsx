'use client';

import Link from 'next/link';
import { Clock, ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-neutral-900 text-white">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400">
            <Clock className="h-4 w-4 text-neutral-900" />
          </div>
          <span className="text-sm font-semibold tracking-wide uppercase">Stundenzettel</span>
        </Link>
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin
        </Link>
      </div>
    </header>
  );
}

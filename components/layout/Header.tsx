'use client';

import Link from 'next/link';
import { Clock, Lock } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export function Header() {
  return (
    <header className="border-b bg-[#1e3a5f] text-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-amber-400" />
          <span className="text-lg font-bold">{APP_NAME}</span>
        </Link>
        <Link
          href="/admin"
          className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Lock className="h-4 w-4" />
          <span className="hidden sm:inline">Admin</span>
        </Link>
      </div>
    </header>
  );
}

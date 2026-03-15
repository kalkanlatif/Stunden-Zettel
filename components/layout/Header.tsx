import { Clock } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-neutral-900 text-white">
      <div className="container mx-auto flex h-12 items-center justify-center px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400">
            <Clock className="h-3.5 w-3.5 text-neutral-900" />
          </div>
          <span className="text-xs font-semibold tracking-widest uppercase">Stundenzettel</span>
        </div>
      </div>
    </header>
  );
}

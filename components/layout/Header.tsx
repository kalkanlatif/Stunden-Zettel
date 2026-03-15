import { Clock } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-amber-400">
      <div className="container mx-auto flex h-12 items-center justify-center px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500">
            <Clock className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase text-amber-900">Stundenzettel</span>
        </div>
      </div>
    </header>
  );
}

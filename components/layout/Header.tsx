'use client';

export function Header() {
  return (
    <header className="sticky top-0 z-50">
      <div
        className="border-b border-white/30 bg-white/60"
        style={{ backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)' }}
      >
        <div className="mx-auto flex h-11 max-w-2xl items-center justify-between px-4">
          {/* Logo + Brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm">
              <span className="text-[11px] font-black text-white leading-none">K</span>
            </div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-amber-900/80">
              Stundenzettel
            </span>
          </div>

          {/* Status dot */}
          <div className="flex items-center gap-1.5 rounded-full bg-green-50/80 px-2 py-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-semibold text-green-700">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}

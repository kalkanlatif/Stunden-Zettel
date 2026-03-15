'use client';

import { LayoutDashboard, Users, BarChart3, Settings } from 'lucide-react';

export type TabId = 'dashboard' | 'mitarbeiter' | 'berichte' | 'einstellungen';

const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'mitarbeiter', label: 'Mitarbeiter', icon: Users },
  { id: 'berichte', label: 'Berichte', icon: BarChart3 },
  { id: 'einstellungen', label: 'Einstellungen', icon: Settings },
];

interface BottomTabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-1 transition-colors ${
                isActive
                  ? 'text-amber-500'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

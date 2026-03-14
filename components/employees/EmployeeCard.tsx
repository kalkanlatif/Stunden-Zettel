'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Employee, Absence, AbsenceType } from '@/types';
import { EMPLOYMENT_BADGE_COLORS } from '@/lib/constants';
import { Plane, Thermometer, Star, CalendarOff, Info } from 'lucide-react';

interface Props {
  employee: Employee;
  onClick: (employee: Employee) => void;
  absence?: Absence | null;
}

const ABSENCE_CONFIG: Record<AbsenceType, { icon: React.ElementType; label: string; bg: string; text: string }> = {
  Urlaub:              { icon: Plane,       label: 'Urlaub',        bg: 'bg-blue-100',    text: 'text-blue-700' },
  Krank:               { icon: Thermometer, label: 'Krank',         bg: 'bg-red-100',     text: 'text-red-600' },
  Feiertag:            { icon: Star,        label: 'Feiertag',      bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Unbezahlter Urlaub':{ icon: CalendarOff, label: 'Unbez. Urlaub', bg: 'bg-orange-100',  text: 'text-orange-700' },
  Sonstiges:           { icon: Info,        label: 'Abwesend',      bg: 'bg-neutral-100', text: 'text-neutral-600' },
};

const EMPLOYMENT_COLORS: Record<string, { bg: string; text: string }> = {
  Vollzeit: { bg: 'bg-[#1DB954]/15', text: 'text-[#15803d]' },
  Teilzeit: { bg: 'bg-[#1DB954]/10', text: 'text-[#15803d]' },
  Minijob:  { bg: 'bg-neutral-100',  text: 'text-neutral-500' },
  Aushilfe: { bg: 'bg-neutral-100',  text: 'text-neutral-500' },
};

const AVATAR_PALETTE = [
  '#1DB954', '#16a34a', '#15803d', '#166534',
  '#1aa34a', '#22c55e', '#14532d',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

const ABSENCE_CONFIG: Record<AbsenceType, { icon: React.ElementType; label: string; classes: string }> = {
  Urlaub: { icon: Plane, label: 'Urlaub', classes: 'bg-blue-100 text-blue-700' },
  Krank: { icon: Thermometer, label: 'Krank', classes: 'bg-red-100 text-red-700' },
  Feiertag: { icon: Star, label: 'Feiertag', classes: 'bg-green-100 text-green-700' },
  'Unbezahlter Urlaub': { icon: CalendarOff, label: 'Unbez. Urlaub', classes: 'bg-orange-100 text-orange-700' },
  Sonstiges: { icon: Info, label: 'Abwesend', classes: 'bg-neutral-100 text-neutral-600' },
};

export function EmployeeCard({ employee, onClick, absence }: Props) {
  const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
  const fullName = `${employee.first_name} ${employee.last_name}`;
  const avatarColor = getAvatarColor(fullName);
  const absenceConfig = absence ? ABSENCE_CONFIG[absence.absence_type] : null;

  return (
    <Card
      onClick={() => onClick(employee)}
      className="group relative cursor-pointer border-0 bg-white shadow-sm transition-all hover:shadow-lg active:scale-[0.97]"
    >
      {/* Absence badge */}
      {absenceConfig && (
        <div className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${absenceConfig.classes}`}>
          <absenceConfig.icon className="h-3 w-3" />
          {absenceConfig.label}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 p-6 pb-5">
        <div className={`relative flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold shadow-sm ${avatarColor} ${absence ? 'opacity-60' : ''}`}>
          {initials}
        </div>

        {/* Name */}
        <div className="text-center">
          <p className={`text-sm font-bold leading-tight ${isAbsent ? 'text-neutral-400' : 'text-neutral-900'}`}>
            {employee.first_name}
          </p>
          <p className={`text-xs leading-snug ${isAbsent ? 'text-neutral-300' : 'text-neutral-500'}`}>
            {employee.last_name}
          </p>
        </div>

        {/* Employment badge */}
        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${employmentColor.bg} ${employmentColor.text}`}>
          {employee.employment_type}
        </span>

        {/* Status row */}
        {absenceConfig ? (
          <div className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${absenceConfig.bg} ${absenceConfig.text}`}>
            <absenceConfig.icon className="h-3 w-3" />
            {absenceConfig.label}
          </div>
        ) : todayEntry ? (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#1DB954]">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Eingetragen</span>
            {entryStartTime && (
              <span className="flex items-center gap-0.5 text-neutral-400 font-normal">
                <Clock className="h-3 w-3" />
                {entryStartTime}
              </span>
            )}
          </div>
        ) : (
          <div className="h-5" />
        )}

      </div>
    </Card>
  );
}

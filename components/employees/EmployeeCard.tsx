'use client';

import { Card } from '@/components/ui/card';
import { Employee, Absence, AbsenceType, TimeEntry } from '@/types';
import { Plane, Thermometer, Star, CalendarOff, Info, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  employee: Employee;
  onClick: (employee: Employee) => void;
  absence?: Absence | null;
  todayEntry?: TimeEntry | null;
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

export function EmployeeCard({ employee, onClick, absence, todayEntry }: Props) {
  const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
  const fullName = `${employee.first_name} ${employee.last_name}`;
  const avatarBg = getAvatarColor(fullName);
  const absenceConfig = absence ? ABSENCE_CONFIG[absence.absence_type] : null;
  const employmentColor = EMPLOYMENT_COLORS[employee.employment_type] ?? EMPLOYMENT_COLORS.Aushilfe;
  const entryStartTime = todayEntry?.time_blocks?.[0]?.start ?? null;
  const isAbsent = !!absence;

  return (
    <Card
      onClick={() => onClick(employee)}
      className="cursor-pointer bg-white border border-neutral-100 shadow-sm rounded-2xl overflow-hidden"
    >
      <div className="p-4 flex flex-col items-center gap-2.5">

        {/* Avatar */}
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
          style={{ backgroundColor: isAbsent ? '#d1d5db' : avatarBg }}
        >
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

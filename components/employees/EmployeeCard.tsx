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

const AVATAR_COLORS = [
  'bg-amber-400 text-neutral-900',
  'bg-neutral-900 text-amber-400',
  'bg-amber-500 text-white',
  'bg-neutral-800 text-amber-300',
  'bg-amber-300 text-neutral-900',
  'bg-neutral-700 text-amber-400',
  'bg-amber-600 text-white',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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
        <div className="text-center">
          <p className="text-lg font-semibold text-neutral-900">
            {employee.first_name}
          </p>
          <p className="text-sm text-neutral-500">
            {employee.last_name}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={`text-[11px] font-medium ${EMPLOYMENT_BADGE_COLORS[employee.employment_type]}`}
        >
          {employee.employment_type}
        </Badge>
      </div>
    </Card>
  );
}

'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/types';
import { EMPLOYMENT_BADGE_COLORS } from '@/lib/constants';

interface Props {
  employee: Employee;
  onClick: (employee: Employee) => void;
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

export function EmployeeCard({ employee, onClick }: Props) {
  const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
  const fullName = `${employee.first_name} ${employee.last_name}`;
  const avatarColor = getAvatarColor(fullName);

  return (
    <Card
      onClick={() => onClick(employee)}
      className="group cursor-pointer border-0 bg-white shadow-sm transition-all hover:shadow-lg active:scale-[0.97]"
    >
      <div className="flex flex-col items-center gap-3 p-6 pb-5">
        <div className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold shadow-sm ${avatarColor}`}>
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

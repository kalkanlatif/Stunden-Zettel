'use client';

import { useRouter } from 'next/navigation';
import { EmployeeCard } from './EmployeeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Employee, Absence, TimeEntry } from '@/types';
import { UserX } from 'lucide-react';

interface Props {
  employees: Employee[];
  loading: boolean;
  todayAbsences?: Absence[];
  todayEntries?: TimeEntry[];
}

export function EmployeeList({ employees, loading, todayAbsences = [], todayEntries = [] }: Props) {
  const router = useRouter();

  const absenceByEmployee = new Map(todayAbsences.map((a) => [a.employee_id, a]));
  const entryByEmployee = new Map(todayEntries.map((e) => [e.employee_id, e]));

  const handleCardClick = (employee: Employee) => {
    router.push(`/enter/${employee.id}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[168px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <UserX className="mb-3 h-10 w-10" />
        <p className="font-medium">Keine Mitarbeiter vorhanden</p>
        <p className="text-sm">Bitte im Admin-Bereich anlegen.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {employees.map((emp) => (
        <EmployeeCard
          key={emp.id}
          employee={emp}
          onClick={handleCardClick}
          absence={absenceByEmployee.get(emp.id) ?? null}
          todayEntry={entryByEmployee.get(emp.id) ?? null}
        />
      ))}
    </div>
  );
}

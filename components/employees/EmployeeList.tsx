'use client';

import { EmployeeCard } from './EmployeeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Employee } from '@/types';
import { UserX } from 'lucide-react';

interface Props {
  employees: Employee[];
  loading: boolean;
}

export function EmployeeList({ employees, loading }: Props) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <UserX className="mb-4 h-12 w-12" />
        <p className="text-lg font-medium">Keine Mitarbeiter vorhanden</p>
        <p className="text-sm">Bitte im Admin-Bereich Mitarbeiter anlegen.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {employees.map((emp) => (
        <EmployeeCard key={emp.id} employee={emp} />
      ))}
    </div>
  );
}

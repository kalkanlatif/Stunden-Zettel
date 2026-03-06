'use client';

import { useState } from 'react';
import { EmployeeCard } from './EmployeeCard';
import { EmployeePinDialog } from './EmployeePinDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Employee } from '@/types';
import { UserX } from 'lucide-react';

interface Props {
  employees: Employee[];
  loading: boolean;
}

export function EmployeeList({ employees, loading }: Props) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCardClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[76px] rounded-xl" />
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
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {employees.map((emp) => (
          <EmployeeCard key={emp.id} employee={emp} onClick={handleCardClick} />
        ))}
      </div>

      <EmployeePinDialog
        employee={selectedEmployee}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}

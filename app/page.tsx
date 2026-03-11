'use client';

import { useEmployees } from '@/hooks/useEmployees';
import { useAbsences } from '@/hooks/useAbsences';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { format } from 'date-fns';

export default function HomePage() {
  const { employees, loading } = useEmployees();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { absences: todayAbsences } = useAbsences({ date: today });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-bold text-neutral-900">
          Wer bist du?
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Wähle deinen Namen, um deine Stunden einzutragen.
        </p>
      </div>
      <EmployeeList employees={employees} loading={loading} todayAbsences={todayAbsences} />
    </div>
  );
}

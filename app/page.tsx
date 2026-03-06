'use client';

import { useEmployees } from '@/hooks/useEmployees';
import { EmployeeList } from '@/components/employees/EmployeeList';

export default function HomePage() {
  const { employees, loading } = useEmployees();

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
      <EmployeeList employees={employees} loading={loading} />
    </div>
  );
}

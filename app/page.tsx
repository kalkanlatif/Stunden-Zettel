'use client';

import { useEmployees } from '@/hooks/useEmployees';
import { EmployeeList } from '@/components/employees/EmployeeList';

export default function HomePage() {
  const { employees, loading } = useEmployees();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          Mitarbeiter auswählen
        </h1>
        <p className="text-gray-500">
          Wähle deinen Namen, um deine Arbeitszeiten einzutragen.
        </p>
      </div>
      <EmployeeList employees={employees} loading={loading} />
    </div>
  );
}

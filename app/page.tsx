'use client';

import { useEmployees } from '@/hooks/useEmployees';
import { useAbsences } from '@/hooks/useAbsences';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { BUSINESS_NAME } from '@/lib/constants';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { UtensilsCrossed } from 'lucide-react';

function getTodayLabel() {
  return format(new Date(), "EEEE, d. MMMM yyyy", { locale: de });
}

export default function HomePage() {
  const { employees, loading } = useEmployees();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { absences: todayAbsences } = useAbsences({ date: today });

  return (
    <div className="mx-auto max-w-2xl">

      {/* Header */}
      <div className="mb-8">

        {/* Restaurant logo + name */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-[#1DB954]">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold text-neutral-900 tracking-tight">
            {BUSINESS_NAME}
          </span>
        </div>

        {/* Date */}
        <div className="text-center mb-5">
          <p className="text-xs font-semibold text-[#1DB954] uppercase tracking-widest">
            {getTodayLabel()}
          </p>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900">
            Wer bist du?
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Wähle deinen Namen, um deine Stunden einzutragen.
          </p>
        </div>

      </div>
      <EmployeeList employees={employees} loading={loading} todayAbsences={todayAbsences} />
    </div>
  );
}

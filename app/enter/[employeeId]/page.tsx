'use client';

import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSingleEmployee } from '@/hooks/useEmployees';
import { useEntries } from '@/hooks/useEntries';
import { TimeEntryForm } from '@/components/entries/TimeEntryForm';
import { MonthlyOverview } from '@/components/entries/MonthlyOverview';
import { EMPLOYMENT_BADGE_COLORS } from '@/lib/constants';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EnterTimePage() {
  const params = useParams();
  const employeeId = params.employeeId as string;
  const { employee, loading: empLoading } = useSingleEmployee(employeeId);

  const now = new Date();
  const { entries, loading: entriesLoading, refresh } = useEntries({
    employeeId,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  // Count missing days (5-7 days ago without entry)
  const recordedDates = entries.map((e) => e.work_date);
  let missingDays = 0;
  for (let i = 5; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (!recordedDates.includes(dateStr)) {
      missingDays++;
    }
  }

  if (empLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-gray-500">Mitarbeiter nicht gefunden.</p>
        <Link href="/" className="mt-4 inline-block text-[#1e3a5f] underline">
          Zurück zur Startseite
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          Guten Tag, {employee.first_name}!
        </h1>
        <Badge className={EMPLOYMENT_BADGE_COLORS[employee.employment_type]}>
          {employee.employment_type}
        </Badge>
      </div>

      {/* Form */}
      <TimeEntryForm employeeId={employeeId} onSaved={refresh} />

      {/* Monthly overview */}
      <MonthlyOverview
        entries={entries}
        loading={entriesLoading}
        missingDays={missingDays}
      />
    </div>
  );
}

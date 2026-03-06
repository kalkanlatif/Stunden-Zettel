'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSingleEmployee } from '@/hooks/useEmployees';
import { useEntries } from '@/hooks/useEntries';
import { TimeEntryForm } from '@/components/entries/TimeEntryForm';
import { MonthlyOverview } from '@/components/entries/MonthlyOverview';
import { EMPLOYMENT_BADGE_COLORS } from '@/lib/constants';
import { getMonthName } from '@/lib/utils/time';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

export default function EnterTimePage() {
  const params = useParams();
  const employeeId = params.employeeId as string;
  const { employee, loading: empLoading } = useSingleEmployee(employeeId);

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const { entries, loading: entriesLoading, refresh } = useEntries({
    employeeId,
    month: viewMonth,
    year: viewYear,
  });

  const isCurrentMonth = viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear();

  const goToPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Count missing days (5-7 days ago without entry) — only for current month
  let missingDays = 0;
  if (isCurrentMonth) {
    const recordedDates = entries.map((e) => e.work_date);
    for (let i = 5; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (!recordedDates.includes(dateStr)) {
        missingDays++;
      }
    }
  }

  if (empLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-400">Mitarbeiter nicht gefunden.</p>
        <Link href="/" className="mt-3 inline-block text-sm text-amber-600 underline">
          Zurück zur Startseite
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div>
        <Link href="/" className="mb-3 inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-600">
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurück
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-sm font-bold text-neutral-900">
            {employee.first_name[0]}{employee.last_name[0]}
          </div>
          <div>
            <h1 className="text-lg font-bold text-neutral-900">
              {employee.first_name} {employee.last_name}
            </h1>
            <Badge className={`text-[11px] ${EMPLOYMENT_BADGE_COLORS[employee.employment_type]}`}>
              {employee.employment_type}
            </Badge>
          </div>
        </div>
      </div>

      {/* Form */}
      <TimeEntryForm employeeId={employeeId} onSaved={refresh} />

      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-xl bg-neutral-900 px-4 py-2.5">
        <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-8 w-8 text-neutral-400 hover:bg-neutral-800 hover:text-white">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-white">
          {getMonthName(viewMonth)} {viewYear}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="h-8 w-8 text-neutral-400 hover:bg-neutral-800 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Monthly overview */}
      <MonthlyOverview
        entries={entries}
        loading={entriesLoading}
        missingDays={missingDays}
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPinDialog } from '@/components/admin/AdminPinDialog';
import { ReportTable } from '@/components/admin/ReportTable';
import { useAdminStore } from '@/store/admin.store';
import { useMonthlyReport } from '@/hooks/useMonthlyReport';
import { getMonthName } from '@/lib/utils/time';

export default function ReportsPage() {
  const { isAuthenticated, checkSession } = useAdminStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { report, loading } = useMonthlyReport(month, year);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (!isAuthenticated) {
    return <AdminPinDialog open={true} />;
  }

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Monatsauswertung</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div>
          <Label>Monat</Label>
          <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {getMonthName(i + 1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Jahr</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <ReportTable report={report} month={month} year={year} />
      )}
    </div>
  );
}

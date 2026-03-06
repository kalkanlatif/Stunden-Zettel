'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { TimeEntry } from '@/types';
import { formatDate, getWeekday, formatTimeBlocks, formatHours } from '@/lib/utils/time';

interface Props {
  entries: TimeEntry[];
  loading: boolean;
  missingDays?: number;
}

export function MonthlyOverview({ entries, loading, missingDays = 0 }: Props) {
  const sorted = [...entries].sort((a, b) => a.work_date.localeCompare(b.work_date));
  const totalHours = sorted.reduce((sum, e) => sum + Number(e.total_hours), 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">Monatsübersicht</h2>

        {missingDays > 0 && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              {missingDays} Tage ohne Eintrag (letzte 5-7 Tage).
              Bitte gem. § 17 MiLoG innerhalb von 7 Tagen nachtragen!
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-400">
            Noch keine Einträge in diesem Monat.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-100">
                  <TableHead className="text-[11px] uppercase text-neutral-400">Datum</TableHead>
                  <TableHead className="hidden sm:table-cell text-[11px] uppercase text-neutral-400">Tag</TableHead>
                  <TableHead className="text-[11px] uppercase text-neutral-400">Zeit</TableHead>
                  <TableHead className="text-right text-[11px] uppercase text-neutral-400">Std.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((entry) => (
                  <TableRow key={entry.id} className="border-neutral-100">
                    <TableCell className="text-sm font-medium">{formatDate(entry.work_date)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-neutral-500">{getWeekday(entry.work_date)}</TableCell>
                    <TableCell className="text-sm text-neutral-600">{formatTimeBlocks(entry.time_blocks)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{formatHours(Number(entry.total_hours))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-amber-400/10">
                  <TableCell colSpan={3} className="font-bold text-sm">Gesamt</TableCell>
                  <TableCell className="text-right font-bold text-sm">{formatHours(totalHours)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

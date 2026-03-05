'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monatsübersicht</CardTitle>
      </CardHeader>
      <CardContent>
        {missingDays > 0 && (
          <Alert className="mb-4 border-amber-300 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Es gibt {missingDays} Tage in den letzten 5-7 Tagen ohne Eintrag.
              Bitte gem. § 17 MiLoG innerhalb von 7 Tagen nachtragen!
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            Noch keine Einträge in diesem Monat.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead className="hidden sm:table-cell">Wochentag</TableHead>
                  <TableHead>Arbeitszeit</TableHead>
                  <TableHead className="text-right">Stunden</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{formatDate(entry.work_date)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{getWeekday(entry.work_date)}</TableCell>
                    <TableCell className="text-sm">{formatTimeBlocks(entry.time_blocks)}</TableCell>
                    <TableCell className="text-right font-medium">{formatHours(Number(entry.total_hours))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-bold">Gesamt</TableCell>
                  <TableCell className="text-right font-bold">{formatHours(totalHours)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

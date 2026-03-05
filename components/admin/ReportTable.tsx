'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { EmployeeReport } from '@/hooks/useMonthlyReport';
import { EMPLOYMENT_BADGE_COLORS } from '@/lib/constants';
import { formatDate, getWeekday, formatTimeBlocks, formatHours } from '@/lib/utils/time';

interface Props {
  report: EmployeeReport[];
  month: number;
  year: number;
}

export function ReportTable({ report, month, year }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpanded(next);
  };

  const downloadPdf = (employeeId: string) => {
    const url = `/api/export/pdf?employee_id=${employeeId}&month=${month}&year=${year}`;
    window.open(url, '_blank');
  };

  if (report.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500">
        Keine Einträge für den gewählten Zeitraum.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {report.map((r) => (
        <div key={r.employee.id} className="rounded-lg border">
          {/* Summary row */}
          <div
            className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
            onClick={() => toggleExpand(r.employee.id)}
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-400">
                {expanded.has(r.employee.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
              <div>
                <p className="font-medium">
                  {r.employee.first_name} {r.employee.last_name}
                </p>
                <Badge className={`text-xs ${EMPLOYMENT_BADGE_COLORS[r.employee.employment_type]}`}>
                  {r.employee.employment_type}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">{r.workDays} Arbeitstage</p>
                <p className="font-bold text-[#1e3a5f]">{formatHours(r.totalHours)}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadPdf(r.employee.id);
                }}
              >
                <Download className="mr-1 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>

          {/* Detail table */}
          {expanded.has(r.employee.id) && (
            <div className="border-t px-4 pb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Wochentag</TableHead>
                    <TableHead>Arbeitszeit</TableHead>
                    <TableHead>Pause</TableHead>
                    <TableHead className="text-right">Stunden</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {r.entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.work_date)}</TableCell>
                      <TableCell>{getWeekday(entry.work_date)}</TableCell>
                      <TableCell>{formatTimeBlocks(entry.time_blocks)}</TableCell>
                      <TableCell>{entry.break_minutes > 0 ? `${entry.break_minutes} Min.` : '-'}</TableCell>
                      <TableCell className="text-right font-medium">{formatHours(Number(entry.total_hours))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

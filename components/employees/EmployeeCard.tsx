'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { Employee } from '@/types';
import { EMPLOYMENT_BADGE_COLORS } from '@/lib/constants';

interface Props {
  employee: Employee;
}

export function EmployeeCard({ employee }: Props) {
  return (
    <Link href={`/enter/${employee.id}`}>
      <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e3a5f]/10">
            <User className="h-6 w-6 text-[#1e3a5f]" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold">
              {employee.first_name} {employee.last_name}
            </p>
            <Badge
              variant="secondary"
              className={EMPLOYMENT_BADGE_COLORS[employee.employment_type]}
            >
              {employee.employment_type}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

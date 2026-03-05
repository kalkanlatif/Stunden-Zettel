'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPinDialog } from '@/components/admin/AdminPinDialog';
import { EmployeeTable } from '@/components/admin/EmployeeTable';
import { useAdminStore } from '@/store/admin.store';
import { useEmployees } from '@/hooks/useEmployees';

export default function ManageEmployeesPage() {
  const { isAuthenticated, checkSession } = useAdminStore();
  const { employees, loading, refresh } = useEmployees(true);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (!isAuthenticated) {
    return <AdminPinDialog open={true} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Mitarbeiter verwalten</h1>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <EmployeeTable employees={employees} onRefresh={refresh} />
      )}
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BarChart3, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPinDialog } from '@/components/admin/AdminPinDialog';
import { useAdminStore } from '@/store/admin.store';
import { useEmployees } from '@/hooks/useEmployees';
import { useEntries } from '@/hooks/useEntries';

export default function AdminDashboard() {
  const { isAuthenticated, checkSession, logout } = useAdminStore();
  const { employees } = useEmployees();
  const now = new Date();
  const { entries } = useEntries({ month: now.getMonth() + 1, year: now.getFullYear() });

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (!isAuthenticated) {
    return <AdminPinDialog open={true} />;
  }

  const activeEmployees = employees.filter((e) => e.active).length;
  const totalEntries = entries.length;
  const totalHours = entries.reduce((sum, e) => sum + Number(e.total_hours), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Admin-Dashboard</h1>
        <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500">
          <LogOut className="mr-1 h-4 w-4" />
          Abmelden
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Aktive Mitarbeiter</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1e3a5f]">{activeEmployees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Einträge diesen Monat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1e3a5f]">{totalEntries}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Gesamtstunden diesen Monat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1e3a5f]">{totalHours.toFixed(1)} Std.</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick access */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/employees">
          <Card className="cursor-pointer transition-all hover:shadow-lg">
            <CardContent className="flex items-center gap-4 p-6">
              <Users className="h-8 w-8 text-[#1e3a5f]" />
              <div>
                <p className="font-semibold">Mitarbeiter verwalten</p>
                <p className="text-sm text-gray-500">Anlegen, bearbeiten, deaktivieren</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/reports">
          <Card className="cursor-pointer transition-all hover:shadow-lg">
            <CardContent className="flex items-center gap-4 p-6">
              <BarChart3 className="h-8 w-8 text-[#1e3a5f]" />
              <div>
                <p className="font-semibold">Monatsauswertung</p>
                <p className="text-sm text-gray-500">Übersicht & PDF-Export</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { employee_id, password } = await request.json();

    if (!employee_id || !password) {
      return NextResponse.json(
        { error: 'employee_id und password sind erforderlich' },
        { status: 400 }
      );
    }

    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select('id, password')
      .eq('id', employee_id)
      .eq('active', true)
      .single();

    if (error || !employee) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      );
    }

    if (password.toLowerCase().trim() !== employee.password.toLowerCase()) {
      return NextResponse.json(
        { error: 'Falsches Passwort' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

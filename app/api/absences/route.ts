import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ABSENCE_TYPES } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let query = supabaseAdmin
      .from('absences')
      .select('*')
      .order('absence_date', { ascending: false });

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (month && year) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
      const endYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
      query = query.gte('absence_date', startDate).lt('absence_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Fehler beim Laden der Abwesenheiten' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_id, absence_date, absence_type, notes } = body;

    if (!employee_id || !absence_date || !absence_type) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
    }

    if (!ABSENCE_TYPES.includes(absence_type)) {
      return NextResponse.json({ error: 'Ungültiger Abwesenheitstyp' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('absences')
      .insert({
        employee_id,
        absence_date,
        absence_type,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Fehler beim Speichern der Abwesenheit' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

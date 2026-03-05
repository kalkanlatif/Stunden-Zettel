import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { entrySchema } from '@/lib/validations/entry.schema';
import { calculateTotalHours, hasOverlap } from '@/lib/utils/time';
import { MAX_HOURS_PER_DAY } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let query = supabaseAdmin
      .from('time_entries')
      .select('*')
      .order('work_date', { ascending: false });

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    if (month && year) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
      const endYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
      query = query.gte('work_date', startDate).lt('work_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Fehler beim Laden der Einträge' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = entrySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: result.error.issues },
        { status: 400 }
      );
    }

    const entry = result.data;

    // Check future date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const workDate = new Date(entry.work_date);
    if (workDate > today) {
      return NextResponse.json(
        { error: 'Arbeitstag darf nicht in der Zukunft liegen' },
        { status: 400 }
      );
    }

    // Check overlapping blocks
    if (hasOverlap(entry.time_blocks)) {
      return NextResponse.json(
        { error: 'Zeitblöcke dürfen sich nicht überschneiden' },
        { status: 400 }
      );
    }

    // Calculate total hours server-side
    const totalHours = calculateTotalHours(entry.time_blocks, entry.break_minutes);

    if (totalHours > MAX_HOURS_PER_DAY) {
      return NextResponse.json(
        { error: `Maximale tägliche Arbeitszeit: ${MAX_HOURS_PER_DAY} Stunden (ArbZG §3)` },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('time_entries')
      .insert({
        employee_id: entry.employee_id,
        work_date: entry.work_date,
        time_blocks: entry.time_blocks,
        total_hours: totalHours,
        break_minutes: entry.break_minutes,
        notes: entry.notes || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Für diesen Tag existiert bereits ein Eintrag' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Fehler beim Speichern des Eintrags' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

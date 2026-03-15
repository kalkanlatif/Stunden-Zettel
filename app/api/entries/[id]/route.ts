import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { entrySchema } from '@/lib/validations/entry.schema';
import { calculateTotalHours, hasOverlap, isWithin7Days } from '@/lib/utils/time';
import { MAX_HOURS_PER_DAY } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('time_entries')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Eintrag nicht gefunden' },
        { status: 404 }
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (hasOverlap(entry.time_blocks)) {
      return NextResponse.json(
        { error: 'Zeitblöcke dürfen sich nicht überschneiden' },
        { status: 400 }
      );
    }

    const totalHours = calculateTotalHours(entry.time_blocks);

    if (totalHours > MAX_HOURS_PER_DAY) {
      return NextResponse.json(
        { error: `Maximale tägliche Arbeitszeit: ${MAX_HOURS_PER_DAY} Stunden (ArbZG §3)` },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('time_entries')
      .update({
        time_blocks: entry.time_blocks,
        total_hours: totalHours,
        break_minutes: entry.break_minutes,
        notes: entry.notes || null,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren' },
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

// DELETE only allowed within 7 days (§ 17 MiLoG)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: entry, error: findError } = await supabaseAdmin
      .from('time_entries')
      .select('work_date')
      .eq('id', params.id)
      .single();

    if (findError || !entry) {
      return NextResponse.json(
        { error: 'Eintrag nicht gefunden' },
        { status: 404 }
      );
    }

    if (!isWithin7Days(entry.work_date)) {
      return NextResponse.json(
        { error: 'Einträge können nach 7 Tagen nicht mehr gelöscht werden (§ 17 MiLoG Aufbewahrungspflicht)' },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from('time_entries')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json(
        { error: 'Fehler beim Löschen' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch {
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

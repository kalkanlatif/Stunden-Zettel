import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('absences')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch {
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

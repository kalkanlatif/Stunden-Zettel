import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { employeeSchema } from '@/lib/validations/employee.schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    let query = supabaseAdmin
      .from('employees')
      .select('*')
      .order('last_name', { ascending: true });

    if (!all) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Fehler beim Laden der Mitarbeiter' },
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
    const result = employeeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: result.error.issues },
        { status: 400 }
      );
    }

    const parsed = result.data as Record<string, unknown>;
    const insertData = {
      ...parsed,
      password: (parsed.password as string) || result.data.first_name.toLowerCase(),
    };

    const { data, error } = await supabaseAdmin
      .from('employees')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Fehler beim Anlegen des Mitarbeiters' },
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

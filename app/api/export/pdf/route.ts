import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import ReactPDF from '@react-pdf/renderer';
import { StundenzettelPDF } from '@/components/pdf/StundenzettelPDF';
import { Employee, TimeEntry, Absence } from '@/types';
import { BUSINESS_NAME } from '@/lib/constants';
import { getMonthName } from '@/lib/utils/time';
import React from 'react';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!employeeId || !month || !year) {
      return NextResponse.json(
        { error: 'employee_id, month und year sind erforderlich' },
        { status: 400 }
      );
    }

    // Load employee
    const { data: employee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (empError || !employee) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      );
    }

    // Load entries
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
    const endYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    const { data: entries, error: entriesError } = await supabaseAdmin
      .from('time_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('work_date', startDate)
      .lt('work_date', endDate)
      .order('work_date', { ascending: true });

    if (entriesError) {
      return NextResponse.json(
        { error: 'Fehler beim Laden der Einträge' },
        { status: 500 }
      );
    }

    // Load absences
    const { data: absences } = await supabaseAdmin
      .from('absences')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('absence_date', startDate)
      .lt('absence_date', endDate)
      .order('absence_date', { ascending: true });

    const period = `${getMonthName(parseInt(month))} ${year}`;

    // Generate PDF
    const pdfElement = React.createElement(StundenzettelPDF, {
      employee: employee as Employee,
      entries: (entries || []) as TimeEntry[],
      absences: (absences || []) as Absence[],
      period,
      businessName: BUSINESS_NAME,
    });
    // @ts-expect-error - react-pdf types mismatch with React 18
    const pdfStream = await ReactPDF.renderToStream(pdfElement);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const monthName = getMonthName(parseInt(month));
    const filename = `${employee.first_name}_${monthName}_${year}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('PDF generation failed:', err);
    return NextResponse.json(
      { error: 'Fehler bei der PDF-Generierung' },
      { status: 500 }
    );
  }
}

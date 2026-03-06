import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Employee, TimeEntry, Absence } from '@/types';
import { getWeekday, formatTimeBlocks, formatHours, formatDate } from '@/lib/utils/time';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: '#666',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 180,
    fontFamily: 'Helvetica-Bold',
  },
  infoValue: {
    flex: 1,
  },
  table: {
    marginTop: 16,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    color: '#fff',
    padding: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    padding: 5,
    fontSize: 9,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    padding: 5,
    fontSize: 9,
    backgroundColor: '#f9f9f9',
  },
  tableFooter: {
    flexDirection: 'row',
    padding: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e3a5f',
    marginTop: 2,
  },
  colDay: { width: 30 },
  colDate: { width: 70 },
  colWeekday: { width: 70 },
  colTime: { flex: 1 },
  colBreak: { width: 50, textAlign: 'right' as const },
  colHours: { width: 60, textAlign: 'right' as const },
  absenceHeader: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  absenceTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#991b1b',
    color: '#fff',
    padding: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  colAbsDate: { width: 80 },
  colAbsWeekday: { width: 80 },
  colAbsType: { width: 120 },
  colAbsNotes: { flex: 1 },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBlock: {
    width: '40%',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 4,
    fontSize: 8,
    textAlign: 'center' as const,
    marginTop: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 7,
    color: '#999',
    textAlign: 'center' as const,
  },
});

interface Props {
  employee: Employee;
  entries: TimeEntry[];
  absences: Absence[];
  period: string;
  businessName: string;
}

export function StundenzettelPDF({ employee, entries, absences, period, businessName }: Props) {
  const totalHours = entries.reduce((sum, e) => sum + Number(e.total_hours), 0);
  const totalBreakMinutes = entries.reduce((sum, e) => sum + e.break_minutes, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dokumentation der täglichen Arbeitszeit</Text>
          <Text style={styles.subtitle}>nach § 17 MiLoG (Mindestlohngesetz)</Text>
        </View>

        {/* Employee info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name, Vorname Arbeitnehmer:</Text>
          <Text style={styles.infoValue}>{employee.last_name}, {employee.first_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Beschäftigungsart:</Text>
          <Text style={styles.infoValue}>{employee.employment_type}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Zeitraum (Monat/Jahr):</Text>
          <Text style={styles.infoValue}>{period}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Betrieb/Arbeitgeber:</Text>
          <Text style={styles.infoValue}>{businessName}</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colDay}>Tag</Text>
            <Text style={styles.colDate}>Datum</Text>
            <Text style={styles.colWeekday}>Wochentag</Text>
            <Text style={styles.colTime}>Arbeitszeit von-bis</Text>
            <Text style={styles.colBreak}>Pause</Text>
            <Text style={styles.colHours}>Stunden</Text>
          </View>

          {/* Table rows */}
          {entries.map((entry, i) => {
            const day = new Date(entry.work_date).getDate();
            return (
              <View key={entry.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.colDay}>{day}.</Text>
                <Text style={styles.colDate}>{formatDate(entry.work_date)}</Text>
                <Text style={styles.colWeekday}>{getWeekday(entry.work_date)}</Text>
                <Text style={styles.colTime}>{formatTimeBlocks(entry.time_blocks)}</Text>
                <Text style={styles.colBreak}>{entry.break_minutes > 0 ? `${entry.break_minutes} Min.` : '-'}</Text>
                <Text style={styles.colHours}>{formatHours(Number(entry.total_hours))}</Text>
              </View>
            );
          })}

          {/* Total row */}
          <View style={styles.tableFooter}>
            <Text style={styles.colDay}></Text>
            <Text style={styles.colDate}></Text>
            <Text style={styles.colWeekday}>Gesamt:</Text>
            <Text style={styles.colTime}>{entries.length} Arbeitstage</Text>
            <Text style={styles.colBreak}>{totalBreakMinutes > 0 ? `${totalBreakMinutes} Min.` : '-'}</Text>
            <Text style={styles.colHours}>{formatHours(totalHours)}</Text>
          </View>
        </View>

        {/* Absences */}
        {absences.length > 0 && (
          <View>
            <Text style={styles.absenceHeader}>Abwesenheiten ({absences.length})</Text>
            <View style={styles.absenceTableHeader}>
              <Text style={styles.colAbsDate}>Datum</Text>
              <Text style={styles.colAbsWeekday}>Wochentag</Text>
              <Text style={styles.colAbsType}>Art</Text>
              <Text style={styles.colAbsNotes}>Bemerkung</Text>
            </View>
            {absences.map((absence, i) => (
              <View key={absence.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.colAbsDate}>{formatDate(absence.absence_date)}</Text>
                <Text style={styles.colAbsWeekday}>{getWeekday(absence.absence_date)}</Text>
                <Text style={styles.colAbsType}>{absence.absence_type}</Text>
                <Text style={styles.colAbsNotes}>{absence.notes || '-'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}>Unterschrift Arbeitnehmer</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLine}>Unterschrift Arbeitgeber</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Aufbewahrungspflicht gemäß § 17 MiLoG: mindestens 2 Jahre | Generiert am {new Date().toLocaleDateString('de-DE')}</Text>
        </View>
      </Page>
    </Document>
  );
}

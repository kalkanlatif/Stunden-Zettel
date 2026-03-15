export interface LegalRule {
  id: string;
  title: string;
  law: string;
  description: string;
  important?: boolean;
  tip?: string;
}

export interface RuleCategory {
  id: string;
  title: string;
  emoji: string;
  color: string;
  rules: LegalRule[];
}

export const LEGAL_CATEGORIES: RuleCategory[] = [
  {
    id: 'arbeitszeit',
    title: 'Arbeitszeit',
    emoji: '⏰',
    color: 'amber',
    rules: [
      {
        id: 'az-1',
        title: 'Tägliche Höchstarbeitszeit',
        law: 'ArbZG § 3',
        description: 'Die reguläre tägliche Arbeitszeit beträgt maximal 8 Stunden. Sie darf auf bis zu 10 Stunden verlängert werden, wenn innerhalb von 6 Monaten der Durchschnitt von 8 Stunden eingehalten wird.',
        important: true,
      },
      {
        id: 'az-2',
        title: 'Wöchentliche Höchstarbeitszeit',
        law: 'ArbZG § 3',
        description: 'Maximal 48 Stunden pro Woche (6 Werktage × 8 Stunden). Wird über einen Zeitraum von 6 Monaten bzw. 24 Wochen gemittelt.',
      },
      {
        id: 'az-3',
        title: 'Ausgleichszeitraum',
        law: 'ArbZG § 3',
        description: 'Mehrarbeit an einzelnen Tagen muss innerhalb von 6 Monaten (26 Wochen) ausgeglichen werden. Beispiel: 10 Stunden am Montag → kürzere Tage an anderen Tagen.',
        tip: 'Behalten Sie den Monatsdurchschnitt pro Mitarbeiter im Blick.',
      },
      {
        id: 'az-4',
        title: 'Gastronomie-Ausnahme',
        law: 'ArbZG § 14',
        description: 'In der Gastronomie kann die Ruhezeit um 1 Stunde verkürzt werden, wenn dies innerhalb von 4 Wochen ausgeglichen wird.',
      },
    ],
  },
  {
    id: 'pausen',
    title: 'Pausen',
    emoji: '☕',
    color: 'orange',
    rules: [
      {
        id: 'pa-1',
        title: '30 Minuten Pause ab 6 Stunden',
        law: 'ArbZG § 4',
        description: 'Bei mehr als 6 Stunden Arbeitszeit ist eine Pause von mindestens 30 Minuten Pflicht. Ab 9 Stunden sind es mindestens 45 Minuten.',
        important: true,
      },
      {
        id: 'pa-2',
        title: 'Aufteilung der Pausen',
        law: 'ArbZG § 4',
        description: 'Pausen können in Abschnitte von jeweils mindestens 15 Minuten aufgeteilt werden. Kürzere Abschnitte zählen nicht als Pause.',
      },
      {
        id: 'pa-3',
        title: 'Keine Arbeit ohne Pause über 6 Stunden',
        law: 'ArbZG § 4',
        description: 'Kein Arbeitnehmer darf länger als 6 Stunden ohne Pause beschäftigt werden. Pausen dürfen nicht am Anfang oder Ende der Arbeitszeit liegen.',
        tip: 'Die App berechnet Pausen automatisch zwischen den Schichten.',
      },
      {
        id: 'pa-4',
        title: 'Pausenübersicht nach Stunden',
        law: 'ArbZG § 4',
        description: 'Bis 6 Std.: keine Pflichtpause. 6–9 Std.: mind. 30 Min. Über 9 Std.: mind. 45 Min.',
      },
    ],
  },
  {
    id: 'ruhezeit',
    title: 'Ruhezeit',
    emoji: '🛏️',
    color: 'blue',
    rules: [
      {
        id: 'rz-1',
        title: '11 Stunden Ruhezeit zwischen Schichten',
        law: 'ArbZG § 5',
        description: 'Nach dem Ende der täglichen Arbeitszeit müssen mindestens 11 Stunden ununterbrochene Ruhezeit eingehalten werden, bevor die nächste Schicht beginnt.',
        important: true,
      },
      {
        id: 'rz-2',
        title: 'Gastronomie: 10 Stunden möglich',
        law: 'ArbZG § 5 (2)',
        description: 'In der Gastronomie kann die Ruhezeit auf 10 Stunden verkürzt werden, wenn die Verkürzung innerhalb eines Kalendermonats durch Verlängerung einer anderen Ruhezeit auf 12 Stunden ausgeglichen wird.',
        tip: 'Beispiel: Schichtende 23:00 → nächste Schicht frühestens 9:00 (mit Ausnahme).',
      },
    ],
  },
  {
    id: 'dokumentation',
    title: 'Dokumentation',
    emoji: '📋',
    color: 'green',
    rules: [
      {
        id: 'dok-1',
        title: 'Aufzeichnungspflicht',
        law: '§ 17 MiLoG',
        description: 'Beginn, Ende und Dauer der täglichen Arbeitszeit müssen aufgezeichnet werden. Dies gilt für alle Mitarbeiter in der Gastronomie.',
        important: true,
      },
      {
        id: 'dok-2',
        title: '7-Tage-Frist',
        law: '§ 17 (1) MiLoG',
        description: 'Die Aufzeichnung muss spätestens bis zum Ende des 7. Kalendertags nach dem Arbeitstag erfolgen. Beispiel: Arbeit am Montag → Eintragung bis zum nächsten Montag.',
        important: true,
        tip: 'Die App warnt Sie, wenn Einträge zu spät erfasst werden.',
      },
      {
        id: 'dok-3',
        title: 'Aufbewahrungspflicht: 2 Jahre',
        law: '§ 17 (2) MiLoG',
        description: 'Alle Arbeitszeitaufzeichnungen müssen mindestens 2 Jahre lang aufbewahrt werden. Digitale Speicherung ist zulässig.',
      },
      {
        id: 'dok-4',
        title: 'Was muss dokumentiert werden?',
        law: '§ 17 MiLoG',
        description: 'Pflichtangaben: Name des Mitarbeiters, Arbeitstag, Beginn und Ende der Arbeitszeit, Dauer der täglichen Arbeitszeit, Pausenzeiten.',
      },
    ],
  },
  {
    id: 'minijob',
    title: 'Minijob',
    emoji: '💶',
    color: 'emerald',
    rules: [
      {
        id: 'mj-1',
        title: 'Verdienstgrenze: 538 € / Monat',
        law: '§ 8 SGB IV',
        description: 'Minijobber dürfen maximal 538 € pro Monat verdienen (6.456 € pro Jahr). Bei Überschreitung wird das Arbeitsverhältnis sozialversicherungspflichtig.',
        important: true,
        tip: 'Achten Sie darauf, die monatliche Verdienstgrenze nicht zu überschreiten.',
      },
      {
        id: 'mj-2',
        title: 'Maximale Arbeitsstunden',
        law: '§ 8 SGB IV + MiLoG',
        description: 'Beim Mindestlohn von 12,41 €/Std. kann ein Minijobber max. ca. 43 Stunden pro Monat arbeiten (538 € ÷ 12,41 €).',
      },
      {
        id: 'mj-3',
        title: 'Volle Dokumentationspflicht',
        law: '§ 17 MiLoG',
        description: 'Für Minijobber gelten die gleichen Dokumentationspflichten wie für alle anderen Mitarbeiter. Arbeitszeiten müssen vollständig erfasst werden.',
      },
      {
        id: 'mj-4',
        title: 'Gleichbehandlung',
        law: 'TzBfG § 4',
        description: 'Minijobber haben grundsätzlich die gleichen Rechte wie Vollzeitbeschäftigte (anteilig): Urlaub, Entgeltfortzahlung im Krankheitsfall, Feiertage.',
      },
    ],
  },
  {
    id: 'urlaub',
    title: 'Urlaub',
    emoji: '🏖️',
    color: 'sky',
    rules: [
      {
        id: 'ur-1',
        title: 'Mindesturlaub: 4 Wochen',
        law: 'BUrlG § 3',
        description: 'Jeder Arbeitnehmer hat Anspruch auf mindestens 4 Wochen (20 Arbeitstage bei 5-Tage-Woche) bezahlten Urlaub pro Jahr. Das gilt auch für Minijobber und Teilzeitkräfte.',
        important: true,
      },
      {
        id: 'ur-2',
        title: 'Berechnung bei Teilzeit',
        law: 'BUrlG § 5',
        description: 'Urlaubstage werden anteilig berechnet. Formel: (Urlaubstage Vollzeit ÷ Arbeitstage Vollzeit pro Woche) × Arbeitstage Teilzeit pro Woche. Beispiel: 3 Tage/Woche = 12 Urlaubstage.',
      },
      {
        id: 'ur-3',
        title: 'Berechnung bei Minijob',
        law: 'BUrlG § 5',
        description: 'Auch Minijobber haben Urlaubsanspruch! Beispiel: Minijobber mit 2 Tagen/Woche bekommt (20 ÷ 5 × 2) = 8 Urlaubstage pro Jahr.',
        tip: 'Vergessen Sie nicht, auch für Minijobber Urlaub einzuplanen.',
      },
      {
        id: 'ur-4',
        title: 'Auszahlung bei Kündigung',
        law: 'BUrlG § 7 (4)',
        description: 'Nicht genommener Urlaub muss bei Beendigung des Arbeitsverhältnisses ausgezahlt werden.',
      },
    ],
  },
  {
    id: 'krankheit',
    title: 'Krankheit',
    emoji: '🏥',
    color: 'red',
    rules: [
      {
        id: 'kr-1',
        title: 'Sofortige Krankmeldung',
        law: 'EntgFG § 5',
        description: 'Der Mitarbeiter muss den Arbeitgeber unverzüglich über die Arbeitsunfähigkeit und deren voraussichtliche Dauer informieren — noch vor Arbeitsbeginn.',
        important: true,
      },
      {
        id: 'kr-2',
        title: 'Ärztliches Attest nach 3 Tagen',
        law: 'EntgFG § 5 (1)',
        description: 'Dauert die Arbeitsunfähigkeit länger als 3 Kalendertage, muss spätestens am folgenden Tag eine ärztliche Bescheinigung vorgelegt werden. Wochenenden zählen mit!',
        tip: 'Sie können auch ab dem 1. Tag ein Attest verlangen.',
      },
      {
        id: 'kr-3',
        title: 'Entgeltfortzahlung: 6 Wochen',
        law: 'EntgFG § 3',
        description: 'Bei Krankheit muss der Arbeitgeber das Gehalt bis zu 6 Wochen lang weiterzahlen. Danach übernimmt die Krankenkasse (Krankengeld). Gilt für alle Beschäftigungsarten.',
      },
      {
        id: 'kr-4',
        title: 'Gilt auch für Minijobber',
        law: 'EntgFG § 1',
        description: 'Auch Minijobber und Aushilfen haben Anspruch auf Entgeltfortzahlung im Krankheitsfall — nach 4 Wochen ununterbrochener Beschäftigung.',
      },
    ],
  },
  {
    id: 'sonntag',
    title: 'Sonn- & Feiertage',
    emoji: '📅',
    color: 'violet',
    rules: [
      {
        id: 'sf-1',
        title: 'Gastronomie: Sonntagsarbeit erlaubt',
        law: 'ArbZG § 10',
        description: 'In der Gastronomie ist Arbeit an Sonn- und Feiertagen ausdrücklich erlaubt. Die allgemeine Sonntagsruhe gilt hier nicht.',
        important: true,
      },
      {
        id: 'sf-2',
        title: 'Ersatzruhetag innerhalb von 8 Wochen',
        law: 'ArbZG § 11',
        description: 'Für jeden gearbeiteten Sonntag muss ein Ersatzruhetag innerhalb der nächsten 8 Wochen gewährt werden. Für Feiertage innerhalb von 8 Wochen.',
      },
      {
        id: 'sf-3',
        title: 'Mindestens 10 freie Sonntage/Jahr',
        law: 'ArbZG § 11 (1)',
        description: 'In der Gastronomie müssen mindestens 10 Sonntage pro Kalenderjahr arbeitsfrei bleiben (allgemein: 15 Sonntage).',
        tip: 'Planen Sie die freien Sonntage am Jahresanfang.',
      },
      {
        id: 'sf-4',
        title: 'Feiertagszuschlag',
        law: 'Vertraglich',
        description: 'Ein gesetzlicher Zuschlag für Sonn- und Feiertagsarbeit existiert nicht. Er kann aber im Arbeitsvertrag oder Tarifvertrag geregelt sein. Üblich: 25–50 %.',
      },
    ],
  },
];

/** Get all important rules (for dashboard preview) */
export function getImportantRules(): { category: RuleCategory; rule: LegalRule }[] {
  const result: { category: RuleCategory; rule: LegalRule }[] = [];
  for (const cat of LEGAL_CATEGORIES) {
    for (const rule of cat.rules) {
      if (rule.important) {
        result.push({ category: cat, rule });
      }
    }
  }
  return result;
}

/** Get total rule count */
export function getTotalRuleCount(): number {
  return LEGAL_CATEGORIES.reduce((sum, cat) => sum + cat.rules.length, 0);
}

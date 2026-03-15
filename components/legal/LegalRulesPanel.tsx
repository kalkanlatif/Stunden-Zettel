'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LEGAL_CATEGORIES, getTotalRuleCount } from '@/lib/legal-rules';
import { BookOpen, Lightbulb } from 'lucide-react';

interface LegalRulesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   badge: 'bg-amber-100 text-amber-700' },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-800',  badge: 'bg-orange-100 text-orange-700' },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-800',    badge: 'bg-blue-100 text-blue-700' },
  green:   { bg: 'bg-green-50',   border: 'border-green-200',   text: 'text-green-800',   badge: 'bg-green-100 text-green-700' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' },
  sky:     { bg: 'bg-sky-50',     border: 'border-sky-200',     text: 'text-sky-800',     badge: 'bg-sky-100 text-sky-700' },
  red:     { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-800',     badge: 'bg-red-100 text-red-700' },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-800',  badge: 'bg-violet-100 text-violet-700' },
};

export function LegalRulesPanel({ open, onOpenChange }: LegalRulesPanelProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const totalRules = getTotalRuleCount();

  const filteredCategories = activeCategory
    ? LEGAL_CATEGORIES.filter((c) => c.id === activeCategory)
    : LEGAL_CATEGORIES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <BookOpen className="h-5 w-5 text-amber-500" />
            Arbeitsrecht-Ratgeber
          </DialogTitle>
          <DialogDescription className="text-xs">
            {totalRules} Regeln in {LEGAL_CATEGORIES.length} Kategorien — Gastronomie
          </DialogDescription>
        </DialogHeader>

        {/* Category Filter Chips */}
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-3 py-1 text-[10px] font-semibold transition-all ${
              activeCategory === null
                ? 'bg-amber-500 text-white'
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
            }`}
          >
            Alle
          </button>
          {LEGAL_CATEGORIES.map((cat) => {
            const colors = CATEGORY_COLORS[cat.color] || CATEGORY_COLORS.amber;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`rounded-full px-3 py-1 text-[10px] font-semibold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-amber-500 text-white'
                    : `${colors.bg} ${colors.text} hover:opacity-80`
                }`}
              >
                {cat.emoji} {cat.title}
              </button>
            );
          })}
        </div>

        {/* Rules List */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {filteredCategories.map((cat) => {
            const colors = CATEGORY_COLORS[cat.color] || CATEGORY_COLORS.amber;
            return (
              <div key={cat.id}>
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white py-1 z-10">
                  <span className="text-base">{cat.emoji}</span>
                  <h3 className={`text-sm font-bold ${colors.text}`}>{cat.title}</h3>
                  <span className="text-[10px] text-neutral-400">{cat.rules.length} Regeln</span>
                </div>

                {/* Rules */}
                <div className="space-y-2">
                  {cat.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`rounded-xl border ${colors.border} ${colors.bg} p-3`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold text-neutral-800">{rule.title}</h4>
                        <Badge className={`shrink-0 text-[9px] ${colors.badge}`}>
                          {rule.law}
                        </Badge>
                      </div>
                      <p className="text-[11px] leading-relaxed text-neutral-600">
                        {rule.description}
                      </p>
                      {rule.tip && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-white/70 px-2.5 py-2">
                          <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                          <p className="text-[10px] font-medium text-amber-700">{rule.tip}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

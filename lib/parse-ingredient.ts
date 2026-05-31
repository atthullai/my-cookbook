/**
 * Ingredient line parser — drop-in replacement for parseIngredientLine in recipe-import.ts
 * Handles: unicode fractions, parenthetical notes, "to taste" variants, Indian units (no.)
 */

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5, '¼': 0.25, '¾': 0.75,
  '⅓': 0.333, '⅔': 0.667, '⅛': 0.125, '⅜': 0.375,
  '⅝': 0.625, '⅞': 0.875,
};

function normalizeFractions(s: string): string {
  s = s.replace(/(\d)([½¼¾⅓⅔⅛⅜⅝⅞])/g, (_, whole, frac) =>
    String(Number(whole) + (UNICODE_FRACTIONS[frac] ?? 0))
  );
  s = s.replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g, (m) => String(UNICODE_FRACTIONS[m] ?? m));
  s = s.replace(/(\d+)\/(\d+)/g, (_, n, d) =>
    String(Number(n) / Number(d))
  );
  return s;
}

const KNOWN_UNITS = new Set([
  'tsp', 'tbsp', 'cup', 'cups', 'ml', 'l', 'g', 'kg', 'oz', 'lb',
  'no.', 'no', 'piece', 'pieces', 'pinch', 'pinches',
  'sprig', 'sprigs', 'handful', 'handfuls',
  'clove', 'cloves', 'head', 'heads',
  'slice', 'slices', 'bunch', 'bunches',
  'stalk', 'stalks', 'can', 'cans', 'packet', 'packets',
  'sheet', 'sheets', 'pod', 'pods', 'stick', 'sticks',
]);

const UNIT_NORMALIZE: Record<string, string> = {
  cups: 'cup', pieces: 'piece', no: 'no.',
  sprigs: 'sprig', cloves: 'clove', slices: 'slice',
  stalks: 'stalk', pinches: 'pinch', handfuls: 'handful',
  heads: 'head', bunches: 'bunch', cans: 'can',
  packets: 'packet', sheets: 'sheet', pods: 'pod', sticks: 'stick',
};

const TO_TASTE_PATTERN =
  /^(to taste|as needed|as required|a pinch|adjust to taste|season to taste|to season)$/i;

export interface ParsedIngredient {
  quantity: number | null;
  unit: string;
  name_en: string;
  note: string | null;
  isToTaste: boolean;
  raw: string;
}

export function parseIngredientLine(raw: string): ParsedIngredient {
  const line = raw.replace(/\s+/g, ' ').trim();

  // 1. Detect "to taste" / "as needed" standalone lines
  if (TO_TASTE_PATTERN.test(line)) {
    return { quantity: null, unit: 'to_taste', name_en: line, note: null, isToTaste: true, raw };
  }

  // 2. Extract trailing parenthetical note: "Tamarind (or a small lemon sized ball)"
  const noteMatch = line.match(/\(([^)]+)\)\s*$/);
  const note = noteMatch ? noteMatch[1].trim() : null;

  // Check if the extracted note is "to taste" / "as needed"
  const noteIsToTaste = note ? TO_TASTE_PATTERN.test(note) : false;

  let cleaned = line
    .replace(/\s*\([^)]+\)\s*$/, '')
    .replace(/,\s*$/, '')
    .trim();

  // 3. Normalize unicode fractions
  cleaned = normalizeFractions(cleaned);

  // 4. Try to match: [quantity] [unit] [name]
  // Pattern: optional number, optional unit, rest is name
  const qtyUnitNameMatch = cleaned.match(
    /^(\d+(?:\.\d+)?)\s+(\S+)\s+(.+)$/
  );

  if (qtyUnitNameMatch) {
    const [, rawQty, rawUnit, rawName] = qtyUnitNameMatch;
    const unitKey = rawUnit.toLowerCase().replace(/\.$/, '');
    const unitWithDot = rawUnit.toLowerCase();
    const isUnit = KNOWN_UNITS.has(unitKey) || KNOWN_UNITS.has(unitWithDot);
    const quantity = Number(rawQty);

    if (isUnit) {
      const normalized = UNIT_NORMALIZE[unitKey] ?? unitKey;
      return {
        quantity,
        unit: normalized,
        name_en: rawName.trim(),
        note,
        isToTaste: noteIsToTaste,
        raw,
      };
    } else {
      // Not a unit — treat [rawUnit rawName] as the ingredient name
      return {
        quantity,
        unit: '',
        name_en: `${rawUnit} ${rawName}`.trim(),
        note,
        isToTaste: noteIsToTaste,
        raw,
      };
    }
  }

  // 5. quantity only — "30g Tamarind" style (no space between number and unit)
  const compactMatch = cleaned.match(/^(\d+(?:\.\d+)?)(g|kg|ml|l)\s+(.+)$/i);
  if (compactMatch) {
    const [, rawQty, rawUnit, rawName] = compactMatch;
    return {
      quantity: Number(rawQty),
      unit: rawUnit.toLowerCase(),
      name_en: rawName.trim(),
      note,
      isToTaste: noteIsToTaste,
      raw,
    };
  }

  // 6. quantity only, no unit — "4 Chilli" or just "Chilli"
  const qtyOnlyMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (qtyOnlyMatch) {
    return {
      quantity: Number(qtyOnlyMatch[1]),
      unit: '',
      name_en: qtyOnlyMatch[2].trim(),
      note,
      isToTaste: noteIsToTaste,
      raw,
    };
  }

  // 7. No quantity at all
  return { quantity: null, unit: '', name_en: cleaned, note, isToTaste: noteIsToTaste, raw };
}

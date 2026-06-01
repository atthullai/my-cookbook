/**
 * equipment-matcher.ts
 * Matches a raw equipment label string to the canonical equipment library.
 * Uses: exact name → synonym → partial substring.
 * No database call — works entirely against the local EQUIPMENT_LIBRARY.
 */

import { EQUIPMENT_LIBRARY, type EquipmentItem } from "@/lib/equipment-library";

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Returns the best matching EquipmentItem for the given raw label, or undefined.
 */
export function matchEquipment(label: string): EquipmentItem | undefined {
  const q = normalize(label);
  if (!q) return undefined;

  // 1. Exact name_en or name_de match
  const exact = EQUIPMENT_LIBRARY.find(
    (e) => normalize(e.name_en) === q || normalize(e.name_de) === q,
  );
  if (exact) return exact;

  // 2. Exact synonym match
  const bySynonym = EQUIPMENT_LIBRARY.find((e) =>
    e.synonyms.some((s) => normalize(s) === q),
  );
  if (bySynonym) return bySynonym;

  // 3. Partial synonym / name substring
  const partial = EQUIPMENT_LIBRARY.find(
    (e) =>
      normalize(e.name_en).includes(q) ||
      q.includes(normalize(e.name_en)) ||
      e.synonyms.some((s) => normalize(s).includes(q) || q.includes(normalize(s))),
  );
  return partial;
}

/**
 * Infer a list of equipment items from free-form recipe text (title, steps, ingredients).
 * Replaces the old hard-coded regex rules in recipe-types.ts.
 */
export function inferEquipmentFromText(text: string): EquipmentItem[] {
  const lower = text.toLowerCase();
  const matched: EquipmentItem[] = [];

  for (const item of EQUIPMENT_LIBRARY) {
    const terms = [item.name_en, item.name_de, ...item.synonyms].map((s) =>
      s.toLowerCase().trim(),
    );
    const hit = terms.some((term) => {
      // word-boundary-ish: surrounded by non-alphanumeric or start/end
      const re = new RegExp(`(?<![a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z])`, "i");
      return re.test(lower);
    });
    if (hit) matched.push(item);
  }

  // deduplicate and cap at 8
  const seen = new Set<string>();
  return matched.filter((e) => {
    if (seen.has(e.name_en)) return false;
    seen.add(e.name_en);
    return true;
  }).slice(0, 8);
}

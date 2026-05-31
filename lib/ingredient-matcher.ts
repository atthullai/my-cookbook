/**
 * Matches a raw ingredient name to the canonical ingredients library.
 * Uses: exact match → synonym (GIN) → partial ilike fallback.
 */
import { SupabaseClient } from '@supabase/supabase-js';

function normalizeForMatch(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s*\([^)]+\)/g, '')
    .replace(/,.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function matchToLibrary(
  name_en: string,
  supabase: SupabaseClient
): Promise<{ libraryId: string | null; confidence: 'exact' | 'measured' | 'estimated' | 'unknown' }> {
  const normalized = normalizeForMatch(name_en);
  if (!normalized) return { libraryId: null, confidence: 'unknown' };

  // 1. Exact name_en match
  try {
    const { data } = await supabase
      .from('ingredients')
      .select('id, weight_confidence')
      .eq('name_en', normalized)
      .maybeSingle();
    if (data) return { libraryId: data.id, confidence: data.weight_confidence as 'exact' | 'measured' | 'estimated' | 'unknown' };
  } catch { /* continue */ }

  // 2. Synonym GIN match
  try {
    const { data } = await supabase
      .from('ingredients')
      .select('id, weight_confidence')
      .contains('synonyms', [normalized])
      .limit(1)
      .maybeSingle();
    if (data) return { libraryId: data.id, confidence: data.weight_confidence as 'exact' | 'measured' | 'estimated' | 'unknown' };
  } catch { /* continue */ }

  // 3. Partial ilike fallback
  try {
    const { data } = await supabase
      .from('ingredients')
      .select('id, weight_confidence')
      .ilike('name_en', `%${normalized}%`)
      .limit(1)
      .maybeSingle();
    if (data) return { libraryId: data.id, confidence: 'estimated' };
  } catch { /* continue */ }

  return { libraryId: null, confidence: 'unknown' };
}

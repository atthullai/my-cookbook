// ---------------------------------------------------------------------------
// Creator detection
// Set NEXT_PUBLIC_CREATOR_USER_ID in .env.local to your Supabase user ID.
// Find it at: Supabase Dashboard → Authentication → Users → your row → User UID
//
// CREATOR   → recipes go to Discover (is_public: true), can edit/delete from Discover
// USER      → recipes go to Library only (is_public: false), can only edit/delete their own
// ---------------------------------------------------------------------------

export const CREATOR_USER_ID = process.env.NEXT_PUBLIC_CREATOR_USER_ID ?? "";

export function isCreator(userId: string | null | undefined): boolean {
  if (!userId) return false;
  if (!CREATOR_USER_ID) return false; // env var not set — no one is treated as creator
  return userId === CREATOR_USER_ID;
}

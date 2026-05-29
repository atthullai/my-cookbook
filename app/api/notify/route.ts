/**
 * POST /api/notify
 *
 * Called by Vercel Cron every morning at 8am.
 * Queries every user's pantry_items for:
 *   - expired items
 *   - expiring within 3 days
 *   - quantity at or below low_stock_threshold
 *
 * Sends a Web Push notification to every subscribed device for that user.
 * Protected by CRON_SECRET so only Vercel (or you) can trigger it.
 */
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// ── Supabase admin client (bypasses RLS) ─────────────────────────────────────
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key);
}

// ── VAPID setup ───────────────────────────────────────────────────────────────
function initWebPush() {
  const pub  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error("VAPID env vars missing");
  webpush.setVapidDetails("mailto:noreply@cookbook.app", pub, priv);
}

interface PantryRow {
  name: string;
  quantity: number;
  unit: string | null;
  expiry_date: string | null;
  low_stock_threshold: number | null;
}

interface SubRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

function buildMessage(
  expired: string[],
  expiring: { name: string; days: number }[],
  lowStock: string[]
): { title: string; body: string } | null {
  const parts: string[] = [];

  if (expired.length)
    parts.push(`✗ Expired: ${expired.join(", ")}`);

  if (expiring.length)
    parts.push(
      `⚠ Expiring soon: ${expiring
        .map((e) => `${e.name} (${e.days === 0 ? "today" : e.days === 1 ? "tomorrow" : `${e.days}d`})`)
        .join(", ")}`
    );

  if (lowStock.length)
    parts.push(`↓ Low stock: ${lowStock.join(", ")}`);

  if (!parts.length) return null;

  return {
    title: "🥘 Pantry alert",
    body: parts.join(" · "),
  };
}

export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    initWebPush();
    const db = adminClient();

    // 1. Fetch all pantry items grouped by user
    const { data: items, error: itemsErr } = await db
      .from("pantry_items")
      .select("user_id, name, quantity, unit, expiry_date, low_stock_threshold");

    if (itemsErr) throw itemsErr;

    // Group by user_id
    const byUser = new Map<string, PantryRow[]>();
    for (const row of items ?? []) {
      const list = byUser.get(row.user_id) ?? [];
      list.push(row as PantryRow);
      byUser.set(row.user_id, list);
    }

    // 2. Fetch all push subscriptions
    const { data: subs, error: subsErr } = await db
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth");

    if (subsErr) throw subsErr;

    const subsByUser = new Map<string, SubRow[]>();
    for (const s of subs ?? []) {
      const list = subsByUser.get(s.user_id) ?? [];
      list.push(s as SubRow);
      subsByUser.set(s.user_id, list);
    }

    const now = Date.now();
    let sent = 0;

    // 3. For each user with subscriptions, check their pantry
    for (const [userId, userSubs] of subsByUser) {
      const userItems = byUser.get(userId) ?? [];

      const expired:  string[] = [];
      const expiring: { name: string; days: number }[] = [];
      const lowStock: string[] = [];

      for (const item of userItems) {
        if (item.expiry_date) {
          const days = Math.ceil(
            (new Date(item.expiry_date).getTime() - now) / 86_400_000
          );
          if (days < 0) expired.push(item.name);
          else if (days <= 3) expiring.push({ name: item.name, days });
        }
        if (
          item.low_stock_threshold != null &&
          item.quantity <= item.low_stock_threshold
        ) {
          lowStock.push(`${item.name} (${item.quantity} ${item.unit ?? ""})`);
        }
      }

      const msg = buildMessage(expired, expiring, lowStock);
      if (!msg) continue;

      const payload = JSON.stringify({ ...msg, url: "/pantry" });

      // 4. Send to all subscribed devices for this user
      await Promise.allSettled(
        userSubs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            );
            sent++;
          } catch (err: unknown) {
            // 410 Gone = subscription expired — clean it up
            if (
              err instanceof Error &&
              "statusCode" in err &&
              (err as { statusCode: number }).statusCode === 410
            ) {
              await db
                .from("push_subscriptions")
                .delete()
                .eq("endpoint", sub.endpoint);
            }
          }
        })
      );
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error("[notify]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

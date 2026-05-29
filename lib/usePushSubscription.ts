"use client";

/**
 * usePushSubscription
 *
 * Registers the service worker, requests notification permission,
 * subscribes to Web Push, and saves the subscription to Supabase
 * so the server can send notifications via /api/notify.
 *
 * Requires NEXT_PUBLIC_VAPID_PUBLIC_KEY in env.
 * Generate VAPID keys once with:  npx web-push generate-vapid-keys
 */
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

export function usePushSubscription() {
  useEffect(() => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;                          // not configured — skip silently
    if (!("serviceWorker" in navigator)) return;    // unsupported browser
    if (!("PushManager" in window)) return;

    (async () => {
      try {
        // 1. Register (or reuse) the service worker
        const reg = await navigator.serviceWorker.register("/sw.js");

        // 2. Check existing permission — don't prompt if already denied
        if (Notification.permission === "denied") return;

        // 3. Request permission (browser prompt appears at most once)
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        // 4. Subscribe to Web Push
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        // 5. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 6. Upsert subscription into Supabase
        //    (endpoint is the natural unique key per browser/device)
        const subJson = subscription.toJSON();
        await supabase.from("push_subscriptions").upsert(
          {
            user_id:  user.id,
            endpoint: subJson.endpoint,
            p256dh:   subJson.keys?.p256dh,
            auth:     subJson.keys?.auth,
          },
          { onConflict: "endpoint" }
        );
      } catch (err) {
        // Push setup is best-effort — never crash the page
        console.warn("[push]", err);
      }
    })();
  }, []);
}

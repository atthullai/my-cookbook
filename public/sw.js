/**
 * Service Worker — handles Web Push notifications for pantry alerts.
 * Receives push events from /api/notify and displays them as
 * OS-level notifications even when the app is closed.
 */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Cookbook Alert", body: event.data.text() };
  }

  const { title = "My Cookbook", body = "", url = "/pantry" } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/animations/peacock.json", // fallback; replace with a real icon if you have one
      badge: "/favicon.ico",
      data: { url },
      tag: "pantry-alert",          // replaces previous notification of same type
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/pantry";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

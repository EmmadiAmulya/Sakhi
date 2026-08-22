// ponytail: minimal installability service worker — network-first passthrough,
// no offline cache yet. Add Workbox/precaching when offline use is a requirement.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // passthrough — presence of a SW is what makes the app installable
});

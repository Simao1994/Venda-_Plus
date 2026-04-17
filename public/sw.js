// SELF-DESTRUCT: This SW unregisters itself and clears all caches immediately.
// It exists only to replace the old broken SW that was causing infinite fetch loops.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach((client) => client.navigate(client.url));
    })
  );
});

// Do NOT intercept any fetch requests
self.addEventListener('fetch', () => {
  // Intentionally empty - let the browser handle all requests natively
  return;
});

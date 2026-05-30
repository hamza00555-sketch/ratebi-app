import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({ cacheName: 'pages' })
);

registerRoute(
  ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new CacheFirst({ cacheName: 'assets' })
);

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

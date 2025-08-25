/// <reference lib = "WebWorker" />
self.addEventListener('install', function () {
  console.log('Service worker installing...');
});

self.addEventListener('activate', (event) => {
  // @ts-expect-error: See https://github.com/microsoft/TypeScript/issues/14877
  event.waitUntil(self.clients.claim());
})
// SPDX-FileCopyrightText: 2024-2025 Pagefault Games
// SPDX-FileContributor: SirzBenjie
//
// SPDX-License-Identifier: AGPL-3.0-only

self.addEventListener('install', function () {
  console.log('Service worker installing...');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
})
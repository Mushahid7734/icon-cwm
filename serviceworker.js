'use strict';

const CACHE_VERSION = 1;
let CURRENT_CACHES = { offline: "offline-v1" };
const OFFLINE_URL = "/offline.html";

function createCacheBustedRequest(url) {
  let request = new Request(url, { cache: 'reload' });

  if ('cache' in request) {
    return request;
  }

  let bustedUrl = new URL(url, self.location.href);
  bustedUrl.search += (bustedUrl.search ? '&' : '') + 'cachebust=' + Date.now();
  return new Request(bustedUrl);
}

self.addEventListener('install', event => {
  event.waitUntil(
    fetch(createCacheBustedRequest(OFFLINE_URL)).then(response => {
      return caches.open(CURRENT_CACHES.offline).then(cache => {
        return cache.put(OFFLINE_URL, response);
      });
    })
  );
});

self.addEventListener('activate', event => {
  let cacheWhitelist = Object.values(CURRENT_CACHES);

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting out of date cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (
    event.request.mode === 'navigate' ||
    (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))
  ) {
    console.log('Handling fetch event for', event.request.url);

    event.respondWith(
      fetch(event.request).catch(error => {
        console.log('Fetch failed; returning offline page instead.', error);
        return caches.match(OFFLINE_URL);
      })
    );
  }
});

// Installation Prompt
self.addEventListener('beforeinstallprompt', event => {
  // Prevent Chrome's default installation prompt
  event.preventDefault();

  // Custom installation prompt logic
  const screenshots = [
    'https://cdn.jsdelivr.net/gh/Mushahid7734/icon-cwm/screenshot%20mobile.png',
    'https://cdn.jsdelivr.net/gh/Mushahid7734/icon-cwm/screenshot%20big.png'
  ];

  const promptOptions = {
    title: 'Install Class With Mason',
    text: 'Add Class With Mason to your home screen',
    screenshots: screenshots
  };

  event.userChoice.then(choiceResult => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the installation prompt.');
    } else {
      console.log('User dismissed the installation prompt.');
    }
  });

  // Display the custom installation prompt
  self.promptInstallation(promptOptions);
});

// Custom method to display installation prompt
self.promptInstallation = options => {
  return new Promise((resolve, reject) => {
    if (!self || !self.registration || !self.registration.showInstallationPrompt) {
      reject(new Error('Installation prompt not supported.'));
      return;
    }

    self.registration.showInstallationPrompt(options)
      .then(userChoice => {
        resolve(userChoice);
      })
      .catch(error => {
        reject(error);
      });
  });
};

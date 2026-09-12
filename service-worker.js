const CACHE_NAME = "csp-bird-pwa-v2";

const APP_FILES = [
    "./",
    "./index.html",
    "./manifest.json",
    "./splash.jpg",
    "./logoleft.jpg",
    "./logomiddle.jpg",
    "./logoright.jpg",
    "./icon-192.png",
    "./icon-512.png"
];


/* =========================
   INSTALL
========================= */

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME).then(cache => {

            return cache.addAll(APP_FILES);

        })

    );

    self.skipWaiting();

});


/* =========================
   ACTIVATE
========================= */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(cacheNames => {

            return Promise.all(

                cacheNames.map(cacheName => {

                    if (cacheName !== CACHE_NAME) {

                        return caches.delete(cacheName);

                    }

                })

            );

        })

    );

    self.clients.claim();

});


/* =========================
   FETCH
========================= */

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request).then(cachedResponse => {

            if (cachedResponse) {

                return cachedResponse;

            }


            return fetch(event.request).catch(() => {

                return caches.match("./index.html");

            });

        })

    );

});


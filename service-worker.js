const CACHE_NAME = "csp-bird-pwa-v3";

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
            // ক্যাশে ফাইল যুক্ত করা
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
                    // পুরনো ক্যাশ ডিলিট করা
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
    const request = event.request;

    // ১. POST রিকোয়েস্ট বা নন-HTTP স্কিম (যেমন chrome-extension://) ইগনোর করা
    if (request.method !== "GET" || !request.url.startsWith("http")) {
        return;
    }

    /* =========================
       INDEX.HTML -> NETWORK FIRST
    ========================= */
    if (
        request.destination === "document" ||
        request.url.endsWith("/index.html") ||
        request.url.endsWith("/")
    ) {
        event.respondWith(
            fetch(request)
                .then(networkResponse => {
                    // ২. রেসপন্স সঠিক থাকলে (200 OK) তবেই ক্যাশে আপডেট করা
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // নেটওয়ার্ক ফেল করলে ক্যাশ থেকে দেখানো
                    return caches.match(request)
                        .then(cachedResponse => {
                            return cachedResponse || caches.match("./index.html");
                        });
                })
        );
        return;
    }

    /* =========================
       OTHER FILES -> CACHE FIRST
    ========================= */
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            // ক্যাশে থাকলে সেটিই রিটার্ন করবে
            if (cachedResponse) {
                return cachedResponse;
            }

            // ক্যাশে না থাকলে নেটওয়ার্ক থেকে আনবে
            return fetch(request).then(networkResponse => {
                // ৩. রেসপন্স ভ্যালিড কি না চেক করা
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
                    return networkResponse;
                }

                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, responseClone);
                });

                return networkResponse;
            }).catch(() => {
                // অফলাইন থাকা অবস্থায় ইমেজ বা ফন্টের জন্য কোনো এরর যেন ক্র্যাশ না করে
                console.log('Fetch failed for: ', request.url);
            });
        })
    );
});
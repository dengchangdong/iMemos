const CACHE_NAME = 'memos-themes-cache-v1';

// 需要缓存的资源列表
const CACHE_URLS = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://rsms.me/inter/inter.css',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css'
];

// 安装Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已创建');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求并提供缓存响应
self.addEventListener('fetch', event => {
  // 跳过不支持缓存的请求
  if (event.request.method !== 'GET') return;
  
  // 排除API请求
  if (event.request.url.includes('/api/')) return;
  
  const requestUrl = new URL(event.request.url);
  
  // 处理导航请求 - 使用网络优先策略
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match('/');
            });
        })
    );
    return;
  }

  // 处理静态资源 - 缓存优先策略
  if (
    requestUrl.origin === self.location.origin ||
    requestUrl.hostname.includes('jsdelivr.net') ||
    requestUrl.hostname.includes('rsms.me') ||
    requestUrl.hostname.includes('fonts.googleapis.com') ||
    requestUrl.hostname.includes('fonts.gstatic.com') ||
    requestUrl.hostname.includes('tailwindcss.com')
  ) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // 返回缓存同时在后台更新缓存
            const fetchPromise = fetch(event.request)
              .then(networkResponse => {
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, networkResponse.clone());
                  });
                return networkResponse;
              })
              .catch(() => {});
            
            // 启动后台更新但不等待
            fetchPromise.catch(() => console.log('缓存更新失败', event.request.url));
            
            return cachedResponse;
          }
          
          // 如果没有缓存，尝试网络请求并缓存
          return fetch(event.request)
            .then(response => {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              return response;
            });
        })
    );
    return;
  }
  
  // 对于其他请求，使用网络优先策略，失败时才用缓存
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 仅缓存成功的响应
        if (response.ok) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// 预缓存策略 - 在后台预缓存常用资源
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => Promise.all(
          event.data.urls.map(url => {
            return fetch(url)
              .then(response => cache.put(url, response))
              .catch(error => console.log('预缓存失败:', url, error));
          })
        ))
    );
  }
}); 
// 缓存版本号 - 修改此值以更新缓存
const CACHE_VERSION = 'v1';
const CACHE_NAME = `imemos-cache-${CACHE_VERSION}`;

// 需要缓存的资源
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/offline-image.png'
];

// 动态缓存API响应的最大时间 (24小时)
const API_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

// 安装Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存静态资源');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('imemos-cache-') && cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          console.log(`删除旧缓存: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  // 跳过不支持缓存的请求
  if (!event.request.url.startsWith('http')) return;
  
  // 处理API请求 (适用缓存策略)
  if (event.request.url.includes('/api/')) {
    return event.respondWith(handleApiRequest(event.request));
  }
  
  // 处理静态资源
  // 检查是否为外部资源（非当前域名）
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  
  // 对于外部资源，直接通过网络获取，不尝试缓存
  if (!isSameOrigin && !event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // 离线回退处理
          if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return caches.match('/offline-image.png');
          }
          if (event.request.headers.get('Accept').includes('text/html')) {
            return caches.match('/offline.html');
          }
          return new Response('网络连接失败', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        })
    );
    return;
  }
  
  // 处理同源资源
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // 如果缓存中有，则返回缓存
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // 没有缓存则网络请求
        return fetch(event.request)
          .then((response) => {
            // 不缓存错误响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 只缓存同源资源
            if (isSameOrigin) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(() => {
            // 离线回退处理 - 对图片返回占位图
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              return caches.match('/offline-image.png');
            }
            
            // 对HTML页面返回离线页面
            if (event.request.headers.get('Accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            // 其他资源直接返回错误
            return new Response('网络连接失败', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// 处理API请求的缓存策略
async function handleApiRequest(request) {
  // 尝试获取缓存
  try {
    const cachedResponse = await caches.match(request);
    
    // 检查缓存是否存在且未过期
    if (cachedResponse) {
      const cachedDate = new Date(cachedResponse.headers.get('sw-cache-date'));
      const now = new Date();
      
      // 如果缓存未过期，直接返回缓存
      if (now.getTime() - cachedDate.getTime() < API_CACHE_MAX_AGE) {
        return cachedResponse;
      }
    }
    
    // 缓存不存在或已过期，发起网络请求
    const response = await fetch(request);
    
    // 请求成功，更新缓存
    if (response.ok) {
      const clonedResponse = response.clone();
      
      // 添加缓存时间戳
      const headers = new Headers(clonedResponse.headers);
      headers.append('sw-cache-date', new Date().toISOString());
      
      // 创建新的响应对象
      const cachedResponse = new Response(
        await clonedResponse.blob(),
        {
          status: clonedResponse.status,
          statusText: clonedResponse.statusText,
          headers: headers
        }
      );
      
      // 存入缓存
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, cachedResponse);
      
      return response;
    }
    
    // 如果请求失败但有缓存，返回过期的缓存
    if (cachedResponse) {
      console.log('API请求失败，使用过期缓存');
      return cachedResponse;
    }
    
    // 没有缓存且请求失败，返回错误响应
    return response;
  } catch (error) {
    console.error('API请求处理错误:', error);
    
    // 尝试使用任何可用的缓存
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 完全失败，返回错误响应
    return new Response(JSON.stringify({ error: '网络连接失败' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
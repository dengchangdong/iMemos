const CACHE_NAME = 'memos-cache-v1'
const OFFLINE_URL = '/offline'
const OFFLINE_IMAGE = '/offline-image'
const IMAGE_CACHE_NAME = 'memos-image-cache-v1'

// 需要缓存的资源
const CACHED_RESOURCES = [
  '/',
  '/offline',
  '/offline-image',
  'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css',
  'https://cdn.tailwindcss.com'
]

// 图片缓存配置
const IMAGE_CACHE_CONFIG = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
  maxSize: 50 * 1024 * 1024 // 50MB
}

// 安装 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('缓存基础资源')
        return cache.addAll(CACHED_RESOURCES)
      }),
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        console.log('初始化图片缓存')
        return cache
      })
    ])
  )
})

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('删除旧缓存:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// 清理过期图片缓存
async function cleanImageCache() {
  const cache = await caches.open(IMAGE_CACHE_NAME)
  const requests = await cache.keys()
  const now = Date.now()
  
  for (const request of requests) {
    const response = await cache.match(request)
    const headers = response.headers
    const cacheTime = headers.get('sw-cache-time')
    
    if (cacheTime && now - parseInt(cacheTime) > IMAGE_CACHE_CONFIG.maxAge) {
      await cache.delete(request)
    }
  }
}

// 处理图片请求
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const response = await fetch(request)
    if (!response || response.status !== 200) {
      throw new Error('图片加载失败')
    }
    
    // 克隆响应并添加缓存时间
    const headers = new Headers(response.headers)
    headers.append('sw-cache-time', Date.now().toString())
    
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
    
    // 存储到缓存
    await cache.put(request, newResponse.clone())
    return newResponse
  } catch (error) {
    console.error('图片加载失败:', error)
    return caches.match(OFFLINE_IMAGE)
  }
}

// 处理请求
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return

  // 处理图片请求
  if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    event.respondWith(handleImageRequest(event.request))
    return
  }

  // 处理 HTML 请求
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(() => {
          return caches.match(OFFLINE_URL)
        })
    )
    return
  }

  // 处理其他请求
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response
          }

          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })

          return response
        })
    })
  )
}) 
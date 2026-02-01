// Service Worker - 离线功能和缓存管理
const CACHE_NAME = 'riding-assistant-v1.0.0';
const STATIC_CACHE = 'riding-assistant-static-v1';
const DYNAMIC_CACHE = 'riding-assistant-dynamic-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/js/config.js',
    '/js/storage.js',
    '/js/map.js',
    '/js/location.js',
    '/js/weather.js',
    '/js/ui.js',
    '/js/app.js',
    '/manifest.json',
    // 天地图API（考虑跨域问题，可能不需要缓存）
    'https://api.tianditu.gov.cn/api/v=4.0&tk=b9dba51939890c06d308032e54dd8c71'
];

// 需要动态缓存的API端点
const DYNAMIC_APIS = [
    // 天气API缓存策略
    {
        url: 'https://api.tianditu.gov.cn/weather/v2/getWeather',
        strategy: 'cacheFirst',
        cacheTime: 30 * 60 * 1000 // 30分钟
    }
];

// 安装事件
self.addEventListener('install', (event) => {
    console.log('Service Worker 安装中...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('缓存静态资源...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('静态资源缓存完成');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('静态资源缓存失败:', error);
            })
    );
});

// 激活事件
self.addEventListener('activate', (event) => {
    console.log('Service Worker 激活中...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // 删除旧版本缓存
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('删除旧缓存:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('缓存清理完成');
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('缓存清理失败:', error);
            })
    );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 跳过非HTTP(S)请求
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // 处理不同的资源类型
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isAPIRequest(request)) {
        event.respondWith(handleAPIRequest(request));
    } else if (isMapTileRequest(request)) {
        event.respondWith(handleMapTileRequest(request));
    } else {
        event.respondWith(handleDynamicRequest(request));
    }
});

// 判断是否为静态资源
function isStaticAsset(request) {
    const url = new URL(request.url);
    return request.destination === 'script' ||
           request.destination === 'style' ||
           request.destination === 'image' ||
           request.destination === 'font' ||
           url.pathname === '/' ||
           url.pathname.endsWith('.html') ||
           url.pathname.endsWith('.css') ||
           url.pathname.endsWith('.js') ||
           url.pathname.endsWith('.json') ||
           url.pathname.endsWith('.png') ||
           url.pathname.endsWith('.jpg') ||
           url.pathname.endsWith('.svg');
}

// 判断是否为API请求
function isAPIRequest(request) {
    const url = new URL(request.url);
    return url.hostname.includes('tianditu.gov.cn') && 
           url.pathname.includes('/weather/') ||
           url.hostname.includes('deepseek.com');
}

// 判断是否为地图瓦片请求
function isMapTileRequest(request) {
    const url = new URL(request.url);
    return url.hostname.includes('tianditu.gov.cn') && 
           (url.pathname.includes('/wmts/') || 
            url.pathname.includes('/vec/') ||
            url.pathname.includes('/cva/'));
}

// 处理静态资源 - 缓存优先
async function handleStaticAsset(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
                const cache = await caches.open(STATIC_CACHE);
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        } catch (error) {
            console.warn('网络请求失败，返回缓存或离线页面:', error);
            return getOfflineResponse(request);
        }
    } catch (error) {
        console.error('处理静态资源失败:', error);
        return getOfflineResponse(request);
    }
}

// 处理API请求 - 智能缓存策略
async function handleAPIRequest(request) {
    const url = new URL(request.url);
    
    // 天气API - 缓存优先，有网络时更新
    if (url.pathname.includes('/weather/')) {
        return handleWeatherAPI(request);
    }
    
    // DeepSeek API - 网络优先
    if (url.hostname.includes('deepseek.com')) {
        return handleDeepSeekAPI(request);
    }
    
    // 其他API - 网络优先
    try {
        return await fetch(request);
    } catch (error) {
        console.warn('API请求失败，尝试缓存:', error);
        return caches.match(request);
    }
}

// 处理天气API - 缓存优先
async function handleWeatherAPI(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    // 检查缓存是否过期
    if (cachedResponse) {
        const cachedTime = cachedResponse.headers.get('cached-time');
        if (cachedTime) {
            const age = Date.now() - parseInt(cachedTime);
            if (age < 30 * 60 * 1000) { // 30分钟内
                return cachedResponse;
            }
        }
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            responseClone.headers.set('cached-time', Date.now().toString());
            cache.put(request, responseClone);
        }
        return networkResponse;
    } catch (error) {
        console.warn('天气API请求失败，使用缓存:', error);
        return cachedResponse || createErrorResponse('天气数据暂时不可用');
    }
}

// 处理DeepSeek API - 网络优先
async function handleDeepSeekAPI(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            return networkResponse;
        }
        throw new Error('API请求失败');
    } catch (error) {
        console.warn('DeepSeek API请求失败:', error);
        return createErrorResponse('AI服务暂时不可用');
    }
}

// 处理地图瓦片 - 网络优先，缓存备用
async function handleMapTileRequest(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // 缓存地图瓦片（限制数量）
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        throw new Error('地图瓦片请求失败');
    } catch (error) {
        console.warn('地图瓦片请求失败，尝试缓存:', error);
        return caches.match(request) || createErrorResponse('地图数据暂时不可用');
    }
}

// 处理动态请求 - 网络优先
async function handleDynamicRequest(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.warn('动态请求失败:', error);
        return getOfflineResponse(request);
    }
}

// 获取离线响应
function getOfflineResponse(request) {
    const url = new URL(request.url);
    
    // 主页请求返回离线页面
    if (url.pathname === '/' || url.pathname.endsWith('.html')) {
        return caches.match('/') || createOfflinePage();
    }
    
    // 其他请求返回错误
    return createErrorResponse('资源暂时不可用，请检查网络连接');
}

// 创建错误响应
function createErrorResponse(message) {
    return new Response(
        JSON.stringify({ 
            error: message, 
            offline: true,
            timestamp: new Date().toISOString()
        }), 
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
}

// 创建离线页面
function createOfflinePage() {
    const offlineHTML = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>离线模式 - 智能骑行助手</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .offline-container {
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 400px;
            }
            .offline-icon {
                font-size: 64px;
                margin-bottom: 20px;
            }
            h1 {
                color: #333;
                margin: 0 0 10px 0;
            }
            p {
                color: #666;
                margin: 0 0 20px 0;
                line-height: 1.6;
            }
            .retry-btn {
                background: #2196F3;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
            }
            .retry-btn:hover {
                background: #1976D2;
            }
            .offline-features {
                margin-top: 30px;
                text-align: left;
            }
            .feature {
                display: flex;
                align-items: center;
                margin: 10px 0;
            }
            .feature-icon {
                margin-right: 10px;
            }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="offline-icon">🚴</div>
            <h1>离线模式</h1>
            <p>您当前处于离线状态，部分功能可能受限。我们正在尝试重新连接...</p>
            
            <button class="retry-btn" onclick="location.reload()">重新连接</button>
            
            <div class="offline-features">
                <h3>离线可用功能：</h3>
                <div class="feature">
                    <span class="feature-icon">📍</span>
                    <span>查看已缓存的地图数据</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">📊</span>
                    <span>查看行程统计和历史记录</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">⚙️</span>
                    <span>应用设置和配置</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">🆘</span>
                    <span>紧急求助功能</span>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
    
    return new Response(offlineHTML, {
        headers: {
            'Content-Type': 'text/html'
        }
    });
}

// 消息处理
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            }).catch((error) => {
                event.ports[0].postMessage({ success: false, error: error.message });
            });
            break;
            
        case 'GET_CACHE_SIZE':
            getCacheSize().then((size) => {
                event.ports[0].postMessage({ size });
            });
            break;
            
        default:
            console.log('未知消息类型:', type);
    }
});

// 清理所有缓存
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}

// 获取缓存大小
async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const text = await response.text();
                totalSize += text.length;
            }
        }
    }
    
    return totalSize;
}

// 后台同步
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// 执行后台同步
async function doBackgroundSync() {
    try {
        console.log('执行后台同步...');
        
        // 同步离线存储的数据
        const offlineData = await getOfflineData();
        
        for (const data of offlineData) {
            try {
                await syncDataItem(data);
                await removeOfflineDataItem(data.id);
            } catch (error) {
                console.error('同步数据项失败:', error);
            }
        }
        
        console.log('后台同步完成');
    } catch (error) {
        console.error('后台同步失败:', error);
    }
}

// 获取离线数据
async function getOfflineData() {
    // 从IndexedDB或localStorage获取待同步数据
    return [];
}

// 同步数据项
async function syncDataItem(data) {
    // 实现具体的同步逻辑
    console.log('同步数据项:', data);
}

// 移除离线数据项
async function removeOfflineDataItem(id) {
    // 从IndexedDB或localStorage移除已同步的数据
    console.log('移除已同步数据项:', id);
}

// 推送通知
self.addEventListener('push', (event) => {
    const options = {
        body: '您有新的AI建议或天气预警',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            {
                action: 'explore',
                title: '查看详情',
                icon: '/icons/checkmark.png'
            },
            {
                action: 'close',
                title: '关闭',
                icon: '/icons/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('智能骑行助手', options)
    );
});

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('Service Worker 加载完成');
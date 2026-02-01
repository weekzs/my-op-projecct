// 事件管理器 - 统一管理应用内所有事件
class EventManager {
    constructor() {
        this.events = new Map(); // 事件监听器存储
        this.history = []; // 事件历史记录
        this.maxHistorySize = 1000; // 最大历史记录数
        this.middleware = []; // 中间件
        
        // 内置事件类型
        this.eventTypes = {
            // 应用生命周期事件
            APP_INIT: 'app:init',
            APP_READY: 'app:ready',
            APP_DESTROY: 'app:destroy',
            
            // 导航事件
            NAVIGATION_START: 'navigation:start',
            NAVIGATION_STOP: 'navigation:stop',
            NAVIGATION_PAUSE: 'navigation:pause',
            NAVIGATION_RESUME: 'navigation:resume',
            NAVIGATION_UPDATE: 'navigation:update',
            NAVIGATION_TURN: 'navigation:turn',
            NAVIGATION_ARRIVAL: 'navigation:arrival',
            NAVIGATION_DEVIATION: 'navigation:deviation',
            
            // 位置事件
            LOCATION_UPDATE: 'location:update',
            LOCATION_ERROR: 'location:error',
            LOCATION_PERMISSION_DENIED: 'location:permission_denied',
            
            // 地图事件
            MAP_LOADED: 'map:loaded',
            MAP_ERROR: 'map:error',
            MAP_CLICK: 'map:click',
            MAP_ZOOM_CHANGE: 'map:zoom_change',
            MAP_MOVE: 'map:move',
            
            // AI事件
            AI_SUGGESTION: 'ai:suggestion',
            AI_ANALYSIS: 'ai:analysis',
            AI_ERROR: 'ai:error',
            
            // 天气事件
            WEATHER_UPDATE: 'weather:update',
            WEATHER_WARNING: 'weather:warning',
            WEATHER_ERROR: 'weather:error',
            
            // 路况事件
            TRAFFIC_UPDATE: 'traffic:update',
            TRAFFIC_CONGESTION: 'traffic:congestion',
            TRAFFIC_ACCIDENT: 'traffic:accident',
            TRAFFIC_ERROR: 'traffic:error',
            
            // 用户界面事件
            UI_INTERACTION: 'ui:interaction',
            UI_RESIZE: 'ui:resize',
            UI_ORIENTATION_CHANGE: 'ui:orientation_change',
            
            // 网络事件
            NETWORK_ONLINE: 'network:online',
            NETWORK_OFFLINE: 'network:offline',
            NETWORK_SLOW: 'network:slow',
            
            // 错误事件
            ERROR_OCCURRED: 'error:occurred',
            ERROR_RECOVERED: 'error:recovered',
            
            // 数据事件
            DATA_LOADED: 'data:loaded',
            DATA_SAVED: 'data:saved',
            DATA_ERROR: 'data:error',
            DATA_SYNCED: 'data:synced'
        };
    }

    // 添加事件监听器
    on(eventType, handler, options = {}) {
        if (typeof handler !== 'function') {
            throw new Error('事件处理器必须是函数');
        }
        
        if (!this.events.has(eventType)) {
            this.events.set(eventType, []);
        }
        
        const listener = {
            id: this.generateListenerId(),
            handler: handler,
            once: options.once || false,
            priority: options.priority || 0,
            context: options.context || null,
            namespace: options.namespace || null
        };
        
        // 按优先级插入
        const listeners = this.events.get(eventType);
        const insertIndex = listeners.findIndex(l => l.priority < listener.priority);
        
        if (insertIndex === -1) {
            listeners.push(listener);
        } else {
            listeners.splice(insertIndex, 0, listener);
        }
        
        // 如果是一次性监听器，自动移除
        if (listener.once) {
            const wrappedHandler = (event) => {
                try {
                    handler.call(listener.context, event);
                } finally {
                    this.off(eventType, listener.id);
                }
            };
            listener.handler = wrappedHandler;
        }
        
        console.debug(`事件监听器已添加: ${eventType} (${listener.id})`);
        return listener.id;
    }

    // 移除事件监听器
    off(eventType, listenerId) {
        if (!this.events.has(eventType)) {
            return false;
        }
        
        const listeners = this.events.get(eventType);
        const index = listeners.findIndex(l => l.id === listenerId || l.handler === listenerId);
        
        if (index !== -1) {
            listeners.splice(index, 1);
            console.debug(`事件监听器已移除: ${eventType} (${listenerId})`);
            
            // 如果没有监听器了，删除事件类型
            if (listeners.length === 0) {
                this.events.delete(eventType);
            }
            
            return true;
        }
        
        return false;
    }

    // 触发事件
    emit(eventType, data = null, options = {}) {
        const event = {
            type: eventType,
            data: data,
            timestamp: Date.now(),
            target: options.target || this,
            preventDefault: false,
            stopPropagation: false
        };
        
        // 记录事件历史
        this.recordEvent(event);
        
        // 执行中间件
        const middlewareResult = this.executeMiddleware(event);
        if (middlewareResult === false) {
            return false; // 中间件阻止了事件
        }
        
        // 获取监听器
        const listeners = this.events.get(eventType);
        if (!listeners || listeners.length === 0) {
            console.debug(`无监听器处理事件: ${eventType}`);
            return true;
        }
        
        console.debug(`触发事件: ${eventType} (${listeners.length}个监听器)`);
        
        // 执行监听器
        for (const listener of listeners) {
            try {
                listener.handler.call(listener.context, event);
                
                if (event.stopPropagation) {
                    console.debug(`事件传播被停止: ${eventType}`);
                    break;
                }
            } catch (error) {
                console.error(`事件处理器执行失败 (${eventType}):`, error);
                this.emit(this.eventTypes.ERROR_OCCURRED, {
                    type: 'event_handler_error',
                    eventType: eventType,
                    error: error,
                    listener: listener
                });
            }
        }
        
        return !event.preventDefault;
    }

    // 添加中间件
    use(middleware, options = {}) {
        this.middleware.push({
            handler: middleware,
            priority: options.priority || 0,
            namespace: options.namespace || null
        });
        
        // 按优先级排序
        this.middleware.sort((a, b) => b.priority - a.priority);
        
        console.debug(`中间件已添加: ${options.namespace || 'anonymous'}`);
    }

    // 执行中间件
    executeMiddleware(event) {
        for (const middleware of this.middleware) {
            try {
                const result = middleware.handler(event);
                if (result === false) {
                    console.debug(`中间件阻止了事件: ${event.type}`);
                    return false;
                }
            } catch (error) {
                console.error('中间件执行失败:', error);
            }
        }
        return true;
    }

    // 命名空间管理
    namespace(name) {
        return {
            on: (eventType, handler, options = {}) => {
                return this.on(eventType, handler, { ...options, namespace: name });
            },
            off: (eventType, listenerId) => {
                return this.off(eventType, listenerId);
            },
            emit: (eventType, data, options = {}) => {
                return this.emit(eventType, data, options);
            },
            clear: () => {
                return this.clearNamespace(name);
            }
        };
    }

    // 清除命名空间下的所有监听器
    clearNamespace(namespace) {
        let removedCount = 0;
        
        for (const [eventType, listeners] of this.events) {
            const initialLength = listeners.length;
            listeners = listeners.filter(listener => listener.namespace !== namespace);
            
            if (listeners.length === 0) {
                this.events.delete(eventType);
            } else {
                this.events.set(eventType, listeners);
            }
            
            removedCount += initialLength - listeners.length;
        }
        
        console.debug(`命名空间 "${namespace}" 已清除，移除 ${removedCount} 个监听器`);
        return removedCount;
    }

    // 事件委托
    delegate(element, eventType, selector, handler) {
        const delegatedHandler = (event) => {
            const target = event.target.closest(selector);
            if (target && element.contains(target)) {
                event.delegateTarget = target;
                handler.call(target, event);
            }
        };
        
        element.addEventListener(eventType, delegatedHandler);
        
        // 返回取消委托的函数
        return () => {
            element.removeEventListener(eventType, delegatedHandler);
        };
    }

    // 防抖事件
    debounce(eventType, handler, delay = 300, options = {}) {
        let timeoutId;
        
        return this.on(eventType, (event) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                handler.call(options.context || null, event);
            }, delay);
        }, options);
    }

    // 节流事件
    throttle(eventType, handler, delay = 300, options = {}) {
        let lastExecution = 0;
        let timeoutId;
        
        return this.on(eventType, (event) => {
            const now = Date.now();
            
            if (now - lastExecution >= delay) {
                lastExecution = now;
                handler.call(options.context || null, event);
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    lastExecution = Date.now();
                    handler.call(options.context || null, event);
                }, delay - (now - lastExecution));
            }
        }, options);
    }

    // 记录事件历史
    recordEvent(event) {
        this.history.push({
            type: event.type,
            timestamp: event.timestamp,
            data: event.data
        });
        
        // 限制历史记录大小
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(-this.maxHistorySize);
        }
    }

    // 获取事件历史
    getHistory(eventType = null, limit = null) {
        let history = this.history;
        
        if (eventType) {
            history = history.filter(h => h.type === eventType);
        }
        
        if (limit && limit > 0) {
            history = history.slice(-limit);
        }
        
        return history;
    }

    // 获取统计信息
    getStats() {
        const stats = {
            totalEvents: this.history.length,
            eventTypes: {},
            listenersCount: 0,
            middlewareCount: this.middleware.length
        };
        
        // 统计事件类型
        this.history.forEach(h => {
            stats.eventTypes[h.type] = (stats.eventTypes[h.type] || 0) + 1;
        });
        
        // 统计监听器数量
        for (const listeners of this.events.values()) {
            stats.listenersCount += listeners.length;
        }
        
        return stats;
    }

    // 生成监听器ID
    generateListenerId() {
        return 'listener_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 清理所有监听器
    clear() {
        this.events.clear();
        this.middleware = [];
        console.debug('所有事件监听器和中间件已清理');
    }

    // 销毁事件管理器
    destroy() {
        this.clear();
        this.history = [];
        console.debug('事件管理器已销毁');
    }
}

// 创建全局事件管理器实例
const eventManager = new EventManager();

// 添加常用中间件
eventManager.use((event) => {
    // 性能监控中间件
    if (event.type.startsWith('ai:')) {
        console.time(`AI事件处理: ${event.type}`);
        // 在事件处理完成后记录
        setTimeout(() => {
            console.timeEnd(`AI事件处理: ${event.type}`);
        }, 0);
    }
}, { priority: 10, namespace: 'performance' });

eventManager.use((event) => {
    // 调试日志中间件
    if (CONFIG && CONFIG.DEBUG && event.type !== eventManager.eventTypes.UI_INTERACTION) {
        console.debug(`事件: ${event.type}`, event.data);
    }
}, { priority: 1, namespace: 'debug' });

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventManager;
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.EventManager = EventManager;
    window.eventManager = eventManager;
}
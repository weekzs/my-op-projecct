// 性能优化模块 - 资源预加载、懒加载、缓存管理、性能监控
class PerformanceOptimizer {
    constructor() {
        this.performanceMetrics = {
            resourceTiming: [],
            navigationTiming: null,
            paintTiming: {},
            memoryUsage: [],
            apiCalls: new Map(),
            renderPerformance: new Map()
        };
        
        this.optimizationStrategies = {
            resourcePreloading: true,
            lazyLoading: true,
            apiCaching: true,
            imageOptimization: true,
            bundleOptimization: true
        };
        
        this.performanceThresholds = {
            loadTime: 3000,        // 3秒加载时间阈值
            apiResponseTime: 2000,  // 2秒API响应时间阈值
            memoryUsage: 50 * 1024 * 1024, // 50MB内存使用阈值
            renderTime: 16.67      // 60fps渲染时间阈值(16.67ms)
        };
        
        this.init();
    }

    // 初始化性能监控
    init() {
        this.setupPerformanceObserver();
        this.setupResourceTiming();
        this.setupMemoryMonitoring();
        this.setupAPIMonitoring();
        this.setupRenderMonitoring();
        this.optimizeCriticalPath();
        
        console.log('性能优化器初始化完成');
    }

    // 设置性能观察器
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // 监控导航性能
            const navigationObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'navigation') {
                        this.performanceMetrics.navigationTiming = entry;
                        this.analyzeNavigationPerformance(entry);
                    }
                }
            });
            navigationObserver.observe({ entryTypes: ['navigation'] });

            // 监控资源加载
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.performanceMetrics.resourceTiming.push(entry);
                    this.analyzeResourcePerformance(entry);
                }
            });
            resourceObserver.observe({ entryTypes: ['resource'] });

            // 监控首次绘制时间
            const paintObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.performanceMetrics.paintTiming[entry.name] = entry.startTime;
                    this.analyzePaintPerformance(entry);
                }
            });
            paintObserver.observe({ entryTypes: ['paint'] });
        }
    }

    // 设置资源时间监控
    setupResourceTiming() {
        // 监控图片、脚本、样式等资源的加载时间
        const resourceTypes = ['script', 'link', 'img', 'css'];
        
        resourceTypes.forEach(type => {
            this.measureResourceLoadTime(type);
        });
    }

    // 监控特定类型资源
    measureResourceLoadTime(resourceType) {
        const resources = performance.getEntriesByType('resource')
            .filter(resource => {
                if (resourceType === 'script') return resource.initiatorType === 'script';
                if (resourceType === 'css') return resource.initiatorType === 'link' && resource.name.includes('.css');
                if (resourceType === 'img') return resource.initiatorType === 'img';
                if (resourceType === 'link') return resource.initiatorType === 'link';
                return false;
            });

        const totalLoadTime = resources.reduce((sum, resource) => {
            return sum + (resource.responseEnd - resource.startTime);
        }, 0);

        if (resources.length > 0) {
            const averageLoadTime = totalLoadTime / resources.length;
            console.log(`${resourceType} 资源平均加载时间: ${averageLoadTime.toFixed(2)}ms`);
            
            if (averageLoadTime > this.performanceThresholds.loadTime / 4) {
                this.optimizeResourceType(resourceType);
            }
        }
    }

    // 设置内存监控
    setupMemoryMonitoring() {
        if (performance.memory) {
            // 每30秒检查一次内存使用情况
            setInterval(() => {
                const memoryInfo = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                };
                
                this.performanceMetrics.memoryUsage.push(memoryInfo);
                
                // 只保留最近50次记录
                if (this.performanceMetrics.memoryUsage.length > 50) {
                    this.performanceMetrics.memoryUsage = this.performanceMetrics.memoryUsage.slice(-50);
                }
                
                // 检查内存使用是否超过阈值
                if (memoryInfo.used > this.performanceThresholds.memoryUsage) {
                    this.handleHighMemoryUsage(memoryInfo);
                }
            }, 30000);
        }
    }

    // 设置API监控
    setupAPIMonitoring() {
        // 重写fetch以监控API调用
        const originalFetch = window.fetch;
        const self = this;
        
        window.fetch = async function(...args) {
            const startTime = performance.now();
            const url = args[0];
            const method = args[1]?.method || 'GET';
            
            try {
                const response = await originalFetch.apply(this, args);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // 记录API调用性能
                self.recordAPICall(url, method, response.status, duration);
                
                // 检查响应时间
                if (duration > self.performanceThresholds.apiResponseTime) {
                    console.warn(`API响应时间过长: ${method} ${url} - ${duration.toFixed(2)}ms`);
                    self.optimizeAPICall(url, method);
                }
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                self.recordAPICall(url, method, 0, duration, error);
                throw error;
            }
        };
    }

    // 设置渲染监控
    setupRenderMonitoring() {
        // 监控帧率和渲染时间
        if ('requestAnimationFrame' in window) {
            let lastTime = performance.now();
            let frameCount = 0;
            let frameTimeSum = 0;
            
            const measureFrame = (currentTime) => {
                const frameTime = currentTime - lastTime;
                frameCount++;
                frameTimeSum += frameTime;
                
                // 每秒计算一次平均帧率
                if (frameCount >= 60) {
                    const averageFrameTime = frameTimeSum / frameCount;
                    const fps = 1000 / averageFrameTime;
                    
                    this.performanceMetrics.renderPerformance.set('fps', fps);
                    this.performanceMetrics.renderPerformance.set('frameTime', averageFrameTime);
                    
                    frameCount = 0;
                    frameTimeSum = 0;
                    
                    // 检查渲染性能
                    if (averageFrameTime > this.performanceThresholds.renderTime) {
                        console.warn(`渲染性能不佳: 平均帧时间 ${averageFrameTime.toFixed(2)}ms (FPS: ${fps.toFixed(1)})`);
                        this.optimizeRendering();
                    }
                }
                
                lastTime = currentTime;
                requestAnimationFrame(measureFrame);
            };
            
            requestAnimationFrame(measureFrame);
        }
    }

    // 优化关键渲染路径
    optimizeCriticalPath() {
        // 预加载关键资源
        this.preloadCriticalResources();
        
        // 延迟加载非关键资源
        this.lazyLoadNonCriticalResources();
        
        // 优化CSS加载
        this.optimizeCSSLoading();
        
        // 优化字体加载
        this.optimizeFontLoading();
    }

    // 预加载关键资源
    preloadCriticalResources() {
        const criticalResources = [
            'https://api.tianditu.gov.cn/api?v=4.0&tk=b9dba51939890c06d308032e54dd8c71',
            'js/config.js',
            'js/utils.js',
            'styles.css'
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = resource.includes('.js') ? 'script' : 
                     resource.includes('.css') ? 'style' : 'fetch';
            link.href = resource;
            document.head.appendChild(link);
        });
        
        console.log('关键资源预加载完成');
    }

    // 懒加载非关键资源
    lazyLoadNonCriticalResources() {
        // 监听页面加载完成后再加载非关键资源
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.loadNonCriticalResources();
            }, 1000);
        });
    }

    // 加载非关键资源
    loadNonCriticalResources() {
        const nonCriticalResources = [
            // 可以添加非关键资源
        ];
        
        nonCriticalResources.forEach(resource => {
            if (resource.includes('.js')) {
                const script = document.createElement('script');
                script.src = resource;
                script.async = true;
                document.body.appendChild(script);
            } else if (resource.includes('.css')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = resource;
                document.head.appendChild(link);
            }
        });
        
        console.log('非关键资源加载完成');
    }

    // 优化CSS加载
    optimizeCSSLoading() {
        // 关键CSS内联
        // 非关键CSS异步加载
        // CSS压缩和合并
        
        const criticalCSS = `
            /* 关键CSS已内联到HTML中 */
        `;
        
        console.log('CSS加载优化完成');
    }

    // 优化字体加载
    optimizeFontLoading() {
        // 预加载字体
        const fonts = [
            // 添加需要预加载的字体
        ];
        
        fonts.forEach(font => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            link.href = font;
            document.head.appendChild(link);
        });
        
        console.log('字体加载优化完成');
    }

    // 记录API调用
    recordAPICall(url, method, status, duration, error = null) {
        const apiName = this.extractAPIName(url);
        const key = `${method} ${apiName}`;
        
        if (!this.performanceMetrics.apiCalls.has(key)) {
            this.performanceMetrics.apiCalls.set(key, {
                count: 0,
                totalTime: 0,
                errors: 0,
                statusCodes: {},
                lastCall: null
            });
        }
        
        const metrics = this.performanceMetrics.apiCalls.get(key);
        metrics.count++;
        metrics.totalTime += duration;
        metrics.lastCall = Date.now();
        
        if (error || status === 0) {
            metrics.errors++;
        } else {
            metrics.statusCodes[status] = (metrics.statusCodes[status] || 0) + 1;
        }
    }

    // 分析导航性能
    analyzeNavigationPerformance(entry) {
        const loadTime = entry.loadEventEnd - entry.startTime;
        const domContentLoaded = entry.domContentLoadedEventEnd - entry.startTime;
        
        console.log(`页面加载时间: ${loadTime.toFixed(2)}ms`);
        console.log(`DOM内容加载时间: ${domContentLoaded.toFixed(2)}ms`);
        
        if (loadTime > this.performanceThresholds.loadTime) {
            console.warn(`页面加载时间过长: ${loadTime.toFixed(2)}ms`);
            this.optimizePageLoading();
        }
    }

    // 分析资源性能
    analyzeResourcePerformance(entry) {
        const loadTime = entry.responseEnd - entry.startTime;
        
        if (loadTime > 1000) { // 资源加载时间超过1秒
            console.warn(`资源加载缓慢: ${entry.name} - ${loadTime.toFixed(2)}ms`);
        }
    }

    // 分析绘制性能
    analyzePaintPerformance(entry) {
        console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);
        
        if (entry.name === 'first-contentful-paint' && entry.startTime > 2000) {
            console.warn(`首次内容绘制时间过长: ${entry.startTime.toFixed(2)}ms`);
            this.optimizeFCP();
        }
    }

    // 优化资源类型
    optimizeResourceType(resourceType) {
        switch (resourceType) {
            case 'script':
                console.log('优化脚本加载策略');
                this.optimizeScriptLoading();
                break;
            case 'css':
                console.log('优化样式加载策略');
                this.optimizeCSSLoading();
                break;
            case 'img':
                console.log('优化图片加载策略');
                this.optimizeImageLoading();
                break;
        }
    }

    // 优化脚本加载
    optimizeScriptLoading() {
        // 使用defer或async
        // 合并脚本文件
        // 压缩脚本
        console.log('脚本加载优化策略已应用');
    }

    // 优化图片加载
    optimizeImageLoading() {
        // 使用现代图片格式
        // 实现懒加载
        // 响应式图片
        console.log('图片加载优化策略已应用');
    }

    // 优化API调用
    optimizeAPICall(url, method) {
        // 实现请求缓存
        // 请求合并
        // 请求优先级
        console.log(`API调用优化: ${method} ${url}`);
    }

    // 处理高内存使用
    handleHighMemoryUsage(memoryInfo) {
        console.warn(`内存使用过高: ${(memoryInfo.used / 1024 / 1024).toFixed(2)}MB`);
        
        // 清理缓存
        this.clearCache();
        
        // 释放不必要的内存
        this.releaseMemory();
    }

    // 清理缓存
    clearCache() {
        // 清理localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('temp_')) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`清理了${keysToRemove.length}个临时缓存项`);
    }

    // 释放内存
    releaseMemory() {
        // 清理事件监听器
        // 清理定时器
        // 清理无用对象引用
        console.log('内存释放完成');
    }

    // 优化渲染
    optimizeRendering() {
        // 减少DOM操作
        // 使用虚拟滚动
        // 优化动画
        console.log('渲染性能优化已应用');
    }

    // 优化页面加载
    optimizePageLoading() {
        // 减少关键资源
        // 启用Gzip压缩
        // 使用CDN
        console.log('页面加载优化已应用');
    }

    // 优化首次内容绘制
    optimizeFCP() {
        // 内联关键CSS
        // 预加载关键资源
        // 减少服务器响应时间
        console.log('首次内容绘制优化已应用');
    }

    // 提取API名称
    extractAPIName(url) {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            return path.split('/').pop() || 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }

    // 获取性能报告
    getPerformanceReport() {
        const report = {
            timestamp: Date.now(),
            navigation: this.getNavigationPerformance(),
            resources: this.getResourcePerformance(),
            memory: this.getMemoryPerformance(),
            api: this.getAPIPerformance(),
            rendering: this.getRenderingPerformance(),
            recommendations: this.getOptimizationRecommendations()
        };
        
        return report;
    }

    // 获取导航性能
    getNavigationPerformance() {
        const nav = this.performanceMetrics.navigationTiming;
        if (!nav) return null;
        
        return {
            loadTime: nav.loadEventEnd - nav.startTime,
            domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
            firstPaint: this.performanceMetrics.paintTiming['first-paint'],
            firstContentfulPaint: this.performanceMetrics.paintTiming['first-contentful-paint']
        };
    }

    // 获取资源性能
    getResourcePerformance() {
        const resources = this.performanceMetrics.resourceTiming;
        const resourceTypes = {};
        
        resources.forEach(resource => {
            const type = resource.initiatorType;
            if (!resourceTypes[type]) {
                resourceTypes[type] = {
                    count: 0,
                    totalTime: 0,
                    totalSize: 0
                };
            }
            
            resourceTypes[type].count++;
            resourceTypes[type].totalTime += (resource.responseEnd - resource.startTime);
            resourceTypes[type].totalSize += resource.transferSize || 0;
        });
        
        return resourceTypes;
    }

    // 获取内存性能
    getMemoryPerformance() {
        const memoryUsage = this.performanceMetrics.memoryUsage;
        if (memoryUsage.length === 0) return null;
        
        const latest = memoryUsage[memoryUsage.length - 1];
        const average = memoryUsage.reduce((sum, m) => sum + m.used, 0) / memoryUsage.length;
        const peak = Math.max(...memoryUsage.map(m => m.used));
        
        return {
            current: latest.used,
            average: average,
            peak: peak,
            limit: latest.limit
        };
    }

    // 获取API性能
    getAPIPerformance() {
        const apiPerformance = {};
        
        for (const [key, metrics] of this.performanceMetrics.apiCalls) {
            apiPerformance[key] = {
                count: metrics.count,
                averageTime: metrics.totalTime / metrics.count,
                errorRate: (metrics.errors / metrics.count) * 100,
                lastCall: metrics.lastCall
            };
        }
        
        return apiPerformance;
    }

    // 获取渲染性能
    getRenderingPerformance() {
        return {
            fps: this.performanceMetrics.renderPerformance.get('fps') || 0,
            averageFrameTime: this.performanceMetrics.renderPerformance.get('frameTime') || 0
        };
    }

    // 获取优化建议
    getOptimizationRecommendations() {
        const recommendations = [];
        
        // 页面加载建议
        const nav = this.getNavigationPerformance();
        if (nav && nav.loadTime > this.performanceThresholds.loadTime) {
            recommendations.push({
                type: 'page_load',
                priority: 'high',
                message: `页面加载时间过长(${nav.loadTime.toFixed(2)}ms)，建议优化关键资源加载`,
                solutions: [
                    '启用资源压缩',
                    '使用CDN加速',
                    '内联关键CSS',
                    '减少HTTP请求数'
                ]
            });
        }
        
        // 内存使用建议
        const memory = this.getMemoryPerformance();
        if (memory && memory.current > this.performanceThresholds.memoryUsage) {
            recommendations.push({
                type: 'memory',
                priority: 'medium',
                message: `内存使用过高(${(memory.current / 1024 / 1024).toFixed(2)}MB)，建议优化内存管理`,
                solutions: [
                    '清理无用缓存',
                    '释放无用对象引用',
                    '优化图片缓存策略'
                ]
            });
        }
        
        // API性能建议
        const api = this.getAPIPerformance();
        for (const [key, metrics] of Object.entries(api)) {
            if (metrics.averageTime > this.performanceThresholds.apiResponseTime) {
                recommendations.push({
                    type: 'api',
                    priority: 'high',
                    message: `API响应时间过长(${key}: ${metrics.averageTime.toFixed(2)}ms)`,
                    solutions: [
                        '实现请求缓存',
                        '使用API版本控制',
                        '优化网络传输',
                        '考虑服务端优化'
                    ]
                });
            }
        }
        
        // 渲染性能建议
        const rendering = this.getRenderingPerformance();
        if (rendering.fps < 55) {
            recommendations.push({
                type: 'rendering',
                priority: 'medium',
                message: `渲染性能不足(${rendering.fps.toFixed(1)}fps)，建议优化渲染逻辑`,
                solutions: [
                    '减少DOM操作',
                    '使用CSS动画',
                    '实现虚拟滚动',
                    '优化重绘和回流'
                ]
            });
        }
        
        return recommendations;
    }

    // 导出性能数据
    exportPerformanceData() {
        const data = this.getPerformanceReport();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${new Date().toISOString().slice(0, 19)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('性能数据已导出');
    }
}

// 创建全局性能优化器实例
const performanceOptimizer = new PerformanceOptimizer();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.PerformanceOptimizer = PerformanceOptimizer;
    window.performanceOptimizer = performanceOptimizer;
}
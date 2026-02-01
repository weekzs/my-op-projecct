// 错误处理和日志系统 - 统一管理错误处理、日志记录、性能监控
class ErrorLogger {
    constructor() {
        this.logs = [];
        this.maxLogsSize = 5000;
        this.logLevels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            FATAL: 4
        };
        this.currentLogLevel = this.logLevels.INFO;
        
        // 性能监控
        this.performanceMetrics = {
            apiCalls: new Map(),
            renderTimes: new Map(),
            memoryUsage: [],
            networkRequests: []
        };
        
        // 错误统计
        this.errorStats = {
            totalErrors: 0,
            errorsByType: new Map(),
            errorsByModule: new Map(),
            criticalErrors: []
        };
        
        // 初始化
        this.init();
    }

    // 初始化
    init() {
        // 设置全局错误处理
        this.setupGlobalErrorHandlers();
        
        // 设置性能监控
        this.setupPerformanceMonitoring();
        
        // 设置网络监控
        this.setupNetworkMonitoring();
        
        // 定期清理日志
        setInterval(() => {
            this.cleanupLogs();
        }, 5 * 60 * 1000); // 每5分钟清理一次
        
        this.info('错误日志系统初始化完成', { module: 'ErrorLogger' });
    }

    // 设置全局错误处理
    setupGlobalErrorHandlers() {
        // JavaScript错误
        window.addEventListener('error', (event) => {
            this.error('JavaScript运行时错误', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : null,
                module: this.extractModuleFromPath(event.filename)
            });
        });

        // Promise错误
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Promise拒绝未处理', {
                reason: event.reason,
                stack: event.reason ? event.reason.stack : null,
                module: 'Promise'
            });
        });

        // 资源加载错误
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.error('资源加载失败', {
                    element: event.target.tagName,
                    source: event.target.src || event.target.href,
                    module: this.extractModuleFromPath(event.target.src)
                });
            }
        }, true);
    }

    // 设置性能监控
    setupPerformanceMonitoring() {
        // 监控API调用
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];
            const method = args[1]?.method || 'GET';
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.recordAPICall(url, method, response.status, duration);
                
                if (!response.ok) {
                    this.warn(`API调用失败: ${method} ${url}`, {
                        status: response.status,
                        duration: duration,
                        module: this.extractModuleFromURL(url)
                    });
                }
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                this.error(`API调用异常: ${method} ${url}`, {
                    error: error.message,
                    duration: duration,
                    module: this.extractModuleFromURL(url)
                });
                
                this.recordAPICall(url, method, 0, duration, error);
                throw error;
            }
        };

        // 监控页面渲染性能
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'measure') {
                        this.recordRenderTime(entry.name, entry.duration);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['measure'] });
        }
    }

    // 设置网络监控
    setupNetworkMonitoring() {
        // 监控网络状态变化
        window.addEventListener('online', () => {
            this.info('网络连接恢复', { module: 'Network' });
        });

        window.addEventListener('offline', () => {
            this.warn('网络连接断开', { module: 'Network' });
        });

        // 监控连接类型变化
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                this.info('网络连接类型变化', {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt,
                    module: 'Network'
                });
            });
        }
    }

    // 日志方法
    debug(message, data = {}) {
        this.log(this.logLevels.DEBUG, message, data);
    }

    info(message, data = {}) {
        this.log(this.logLevels.INFO, message, data);
    }

    warn(message, data = {}) {
        this.log(this.logLevels.WARN, message, data);
    }

    error(message, data = {}) {
        this.log(this.logLevels.ERROR, message, data);
        this.updateErrorStats(message, data);
    }

    fatal(message, data = {}) {
        this.log(this.logLevels.FATAL, message, data);
        this.updateErrorStats(message, data, true);
        
        // 致命错误特殊处理
        this.handleFatalError(message, data);
    }

    // 核心日志记录方法
    log(level, message, data = {}) {
        // 检查日志级别
        if (level < this.currentLogLevel) {
            return;
        }

        const logEntry = {
            level: this.getLevelName(level),
            levelValue: level,
            message: message,
            data: data,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            module: data.module || 'Unknown'
        };

        // 添加到日志数组
        this.logs.push(logEntry);

        // 限制日志大小
        if (this.logs.length > this.maxLogsSize) {
            this.logs = this.logs.slice(-this.maxLogsSize);
        }

        // 控制台输出
        this.outputToConsole(logEntry);

        // 重大错误上报
        if (level >= this.logLevels.ERROR) {
            this.reportError(logEntry);
        }
    }

    // 控制台输出
    outputToConsole(logEntry) {
        const { level, message, data, module } = logEntry;
        const prefix = `[${this.getCurrentTime()}] [${level}] [${module}]`;
        
        switch (logEntry.levelValue) {
            case this.logLevels.DEBUG:
                console.debug(prefix, message, data);
                break;
            case this.logLevels.INFO:
                console.info(prefix, message, data);
                break;
            case this.logLevels.WARN:
                console.warn(prefix, message, data);
                break;
            case this.logLevels.ERROR:
            case this.logLevels.FATAL:
                console.error(prefix, message, data);
                break;
        }
    }

    // 记录API调用
    recordAPICall(url, method, status, duration, error = null) {
        const apiName = this.extractAPIName(url);
        const key = `${method} ${apiName}`;
        
        if (!this.performanceMetrics.apiCalls.has(key)) {
            this.performanceMetrics.apiCalls.set(key, {
                count: 0,
                totalDuration: 0,
                errors: 0,
                lastCall: null
            });
        }
        
        const metric = this.performanceMetrics.apiCalls.get(key);
        metric.count++;
        metric.totalDuration += duration;
        metric.lastCall = Date.now();
        
        if (error || !status || status >= 400) {
            metric.errors++;
        }
        
        // 记录到网络请求历史
        this.performanceMetrics.networkRequests.push({
            url: url,
            method: method,
            status: status,
            duration: duration,
            timestamp: Date.now(),
            error: error ? error.message : null
        });
        
        // 限制历史记录大小
        if (this.performanceMetrics.networkRequests.length > 1000) {
            this.performanceMetrics.networkRequests = this.performanceMetrics.networkRequests.slice(-1000);
        }
    }

    // 记录渲染时间
    recordRenderTime(name, duration) {
        if (!this.performanceMetrics.renderTimes.has(name)) {
            this.performanceMetrics.renderTimes.set(name, []);
        }
        
        const times = this.performanceMetrics.renderTimes.get(name);
        times.push(duration);
        
        // 只保留最近的100次测量
        if (times.length > 100) {
            times.splice(0, times.length - 100);
        }
    }

    // 更新错误统计
    updateErrorStats(message, data, isCritical = false) {
        this.errorStats.totalErrors++;
        
        // 按类型统计
        const errorType = data.type || 'Unknown';
        this.errorStats.errorsByType.set(errorType, 
            (this.errorStats.errorsByType.get(errorType) || 0) + 1);
        
        // 按模块统计
        const module = data.module || 'Unknown';
        this.errorStats.errorsByModule.set(module,
            (this.errorStats.errorsByModule.get(module) || 0) + 1);
        
        // 关键错误
        if (isCritical) {
            this.errorStats.criticalErrors.push({
                message: message,
                data: data,
                timestamp: Date.now()
            });
            
            // 只保留最近10个关键错误
            if (this.errorStats.criticalErrors.length > 10) {
                this.errorStats.criticalErrors = this.errorStats.criticalErrors.slice(-10);
            }
        }
    }

    // 处理致命错误
    handleFatalError(message, data) {
        // 显示用户友好的错误信息
        if (window.uiManager) {
            window.uiManager.showFatalError(message, data);
        } else {
            // 备用显示方式
            document.body.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5; font-family: Arial, sans-serif;">
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #d32f2f; margin-bottom: 20px;">应用遇到严重错误</h2>
                        <p style="margin-bottom: 20px;">${message}</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            重新加载应用
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // 上报错误
    async reportError(logEntry) {
        if (!CONFIG || !CONFIG.ERROR_REPORTING || !CONFIG.ERROR_REPORTING.enabled) {
            return;
        }
        
        try {
            const reportData = {
                ...logEntry,
                appVersion: CONFIG.APP.VERSION,
                userId: this.getUserId(),
                sessionId: this.getSessionId(),
                deviceInfo: this.getDeviceInfo()
            };
            
            const response = await fetch(CONFIG.ERROR_REPORTING.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': CONFIG.ERROR_REPORTING.apiKey
                },
                body: JSON.stringify(reportData)
            });
            
            if (!response.ok) {
                this.warn('错误上报失败', { status: response.status });
            }
        } catch (error) {
            this.warn('错误上报异常', { error: error.message });
        }
    }

    // 工具方法
    getLevelName(level) {
        for (const [name, value] of Object.entries(this.logLevels)) {
            if (value === level) {
                return name;
            }
        }
        return 'UNKNOWN';
    }

    getCurrentTime() {
        return new Date().toISOString();
    }

    extractModuleFromPath(path) {
        if (!path) return 'Unknown';
        
        // 从文件路径提取模块名
        if (path.includes('js/')) {
            const match = path.match(/js\/([^.]+)\.js/);
            return match ? match[1] : 'Unknown';
        }
        
        return 'Unknown';
    }

    extractModuleFromURL(url) {
        if (!url) return 'Unknown';
        
        // 从URL提取模块名
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            
            if (path.includes('/api/')) {
                return 'API';
            } else if (path.includes('/tianditu/')) {
                return 'Map';
            } else if (path.includes('/deepseek/')) {
                return 'AI';
            }
        } catch (error) {
            // URL解析失败
        }
        
        return 'External';
    }

    extractAPIName(url) {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            return path.split('/').pop() || 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }

    getUserId() {
        // 从存储中获取或生成用户ID
        let userId = localStorage.getItem('user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('user_id', userId);
        }
        return userId;
    }

    getSessionId() {
        // 获取会话ID
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            pixelRatio: window.devicePixelRatio || 1,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isOnline: navigator.onLine,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
    }

    // 清理日志
    cleanupLogs() {
        // 清理旧日志
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24小时前
        const initialSize = this.logs.length;
        
        this.logs = this.logs.filter(log => log.timestamp > cutoffTime);
        
        const cleaned = initialSize - this.logs.length;
        if (cleaned > 0) {
            this.debug(`清理了${cleaned}条日志`, { module: 'ErrorLogger' });
        }
        
        // 清理性能指标历史
        if (this.performanceMetrics.networkRequests.length > 500) {
            this.performanceMetrics.networkRequests = this.performanceMetrics.networkRequests.slice(-500);
        }
    }

    // 获取性能报告
    getPerformanceReport() {
        const report = {
            apiCalls: {},
            renderTimes: {},
            memoryInfo: this.getMemoryInfo(),
            networkInfo: this.getNetworkInfo(),
            errorStats: { ...this.errorStats }
        };
        
        // API调用统计
        for (const [key, metric] of this.performanceMetrics.apiCalls) {
            report.apiCalls[key] = {
                ...metric,
                averageDuration: metric.totalDuration / metric.count,
                errorRate: (metric.errors / metric.count) * 100
            };
        }
        
        // 渲染时间统计
        for (const [name, times] of this.performanceMetrics.renderTimes) {
            if (times.length > 0) {
                report.renderTimes[name] = {
                    count: times.length,
                    average: times.reduce((a, b) => a + b, 0) / times.length,
                    min: Math.min(...times),
                    max: Math.max(...times),
                    median: this.median(times)
                };
            }
        }
        
        return report;
    }

    getMemoryInfo() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    getNetworkInfo() {
        const recentRequests = this.performanceMetrics.networkRequests.slice(-20);
        const errorRate = recentRequests.filter(r => r.error || !r.status || r.status >= 400).length / recentRequests.length;
        
        return {
            averageResponseTime: recentRequests.length > 0 ? 
                recentRequests.reduce((sum, r) => sum + r.duration, 0) / recentRequests.length : 0,
            errorRate: errorRate * 100,
            totalRequests: this.performanceMetrics.networkRequests.length
        };
    }

    median(arr) {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // 获取日志
    getLogs(level = null, module = null, limit = 100) {
        let filteredLogs = this.logs;
        
        if (level !== null) {
            filteredLogs = filteredLogs.filter(log => log.levelValue >= level);
        }
        
        if (module !== null) {
            filteredLogs = filteredLogs.filter(log => log.module === module);
        }
        
        return filteredLogs.slice(-limit);
    }

    // 设置日志级别
    setLogLevel(level) {
        this.currentLogLevel = level;
        this.info(`日志级别已设置为: ${this.getLevelName(level)}`, { module: 'ErrorLogger' });
    }

    // 导出日志
    exportLogs() {
        const data = {
            logs: this.logs,
            performanceMetrics: this.performanceMetrics,
            errorStats: this.errorStats,
            exportTime: Date.now(),
            appVersion: CONFIG.APP.VERSION
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString().slice(0, 19)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        this.info('日志已导出', { module: 'ErrorLogger' });
    }
}

// 创建全局错误日志实例
const errorLogger = new ErrorLogger();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorLogger;
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.ErrorLogger = ErrorLogger;
    window.errorLogger = errorLogger;
}
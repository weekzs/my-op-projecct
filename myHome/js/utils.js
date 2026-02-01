// 工具函数库 - 通用工具、验证、格式化、计算等功能
class Utils {
    constructor() {
        // 常量定义
        this.EARTH_RADIUS = 6371000; // 地球半径（米）
        this.DEG_TO_RAD = Math.PI / 180;
        this.RAD_TO_DEG = 180 / Math.PI;
    }

    // 地理位置计算工具
    geo = {
        // 计算两点间距离（Haversine公式）
        calculateDistance: (point1, point2) => {
            const R = 6371000; // 地球半径（米）
            const lat1Rad = point1.lat * Math.PI / 180;
            const lat2Rad = point2.lat * Math.PI / 180;
            const deltaLatRad = (point2.lat - point1.lat) * Math.PI / 180;
            const deltaLngRad = (point2.lng - point1.lng) * Math.PI / 180;
            
            const a = Math.sin(deltaLatRad/2) * Math.sin(deltaLatRad/2) +
                       Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                       Math.sin(deltaLngRad/2) * Math.sin(deltaLngRad/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            
            return R * c / 1000; // 转换为公里
        },

        // 计算方位角
        calculateBearing: (point1, point2) => {
            const lat1Rad = point1.lat * Math.PI / 180;
            const lat2Rad = point2.lat * Math.PI / 180;
            const deltaLngRad = (point2.lng - point1.lng) * Math.PI / 180;
            
            const y = Math.sin(deltaLngRad) * Math.cos(lat2Rad);
            const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
                     Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLngRad);
            
            const bearing = Math.atan2(y, x) * 180 / Math.PI;
            return (bearing + 360) % 360;
        },

        // 计算目标点坐标
        calculateDestination: (origin, distance, bearing) => {
            const R = 6371000; // 地球半径（米）
            const lat1Rad = origin.lat * Math.PI / 180;
            const bearingRad = bearing * Math.PI / 180;
            const angularDistance = distance * 1000 / R;
            
            const lat2Rad = Math.asin(
                Math.sin(lat1Rad) * Math.cos(angularDistance) +
                Math.cos(lat1Rad) * Math.sin(angularDistance) * Math.cos(bearingRad)
            );
            
            const lng2Rad = origin.lng * Math.PI / 180 + Math.atan2(
                Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1Rad),
                Math.cos(angularDistance) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
            );
            
            return {
                lat: lat2Rad * 180 / Math.PI,
                lng: lng2Rad * 180 / Math.PI
            };
        },

        // 判断点是否在多边形内
        isPointInPolygon: (point, polygon) => {
            let inside = false;
            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                const xi = polygon[i].lng, yi = polygon[i].lat;
                const xj = polygon[j].lng, yj = polygon[j].lat;
                
                const intersect = ((yi > point.lat) !== (yj > point.lat))
                    && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        }
    };

    // 时间处理工具
    time = {
        // 格式化时间
        formatTime: (date, format = 'HH:mm:ss') => {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            return format
                .replace('HH', hours)
                .replace('mm', minutes)
                .replace('ss', seconds);
        },

        // 格式化日期
        formatDate: (date, format = 'YYYY-MM-DD') => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day);
        },

        // 计算时间差
        timeDifference: (date1, date2) => {
            const diff = Math.abs(date1 - date2);
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            return { days, hours, minutes, seconds };
        },

        // 格式化持续时间
        formatDuration: (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            if (hours > 0) {
                return `${hours}小时${minutes}分钟`;
            } else if (minutes > 0) {
                return `${minutes}分钟${secs}秒`;
            } else {
                return `${secs}秒`;
            }
        }
    };

    // 数据验证工具
    validation = {
        // 验证坐标
        isValidCoordinate: (lat, lng) => {
            return typeof lat === 'number' && typeof lng === 'number' &&
                   lat >= -90 && lat <= 90 &&
                   lng >= -180 && lng <= 180 &&
                   !isNaN(lat) && !isNaN(lng);
        },

        // 验证邮箱
        isValidEmail: (email) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        // 验证电话号码
        isValidPhone: (phone) => {
            const phoneRegex = /^1[3-9]\d{9}$/;
            return phoneRegex.test(phone);
        },

        // 验证URL
        isValidURL: (url) => {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        },

        // 验证数字范围
        isInRange: (value, min, max) => {
            return typeof value === 'number' && value >= min && value <= max;
        }
    };

    // 格式化工具
    format = {
        // 格式化距离
        distance: (meters) => {
            if (meters < 1000) {
                return `${Math.round(meters)}m`;
            } else {
                return `${(meters / 1000).toFixed(1)}km`;
            }
        },

        // 格式化速度
        speed: (kmh) => {
            return `${Math.round(kmh)}km/h`;
        },

        // 格式化温度
        temperature: (celsius) => {
            return `${Math.round(celsius)}°C`;
        },

        // 格式化金额
        currency: (amount, currency = 'CNY') => {
            return currency === 'CNY' ? 
                `¥${amount.toFixed(2)}` : 
                `${amount.toFixed(2)} ${currency}`;
        },

        // 格式化百分比
        percentage: (value, total) => {
            const percent = total > 0 ? (value / total * 100) : 0;
            return `${Math.round(percent)}%`;
        }
    };

    // 存储工具
    storage = {
        // 设置本地存储
        set: (key, value, options = {}) => {
            const data = {
                value: value,
                timestamp: Date.now(),
                expire: options.expire || null
            };
            
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('LocalStorage设置失败:', error);
                return false;
            }
        },

        // 获取本地存储
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                if (!item) return defaultValue;
                
                const data = JSON.parse(item);
                
                // 检查是否过期
                if (data.expire && Date.now() > data.expire) {
                    localStorage.removeItem(key);
                    return defaultValue;
                }
                
                return data.value;
            } catch (error) {
                console.error('LocalStorage获取失败:', error);
                return defaultValue;
            }
        },

        // 删除本地存储
        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('LocalStorage删除失败:', error);
                return false;
            }
        },

        // 清理过期数据
        cleanup: () => {
            try {
                const keys = Object.keys(localStorage);
                let cleanedCount = 0;
                
                keys.forEach(key => {
                    try {
                        const item = localStorage.getItem(key);
                        if (item) {
                            const data = JSON.parse(item);
                            if (data.expire && Date.now() > data.expire) {
                                localStorage.removeItem(key);
                                cleanedCount++;
                            }
                        }
                    } catch (error) {
                        // 清理无效数据
                        localStorage.removeItem(key);
                        cleanedCount++;
                    }
                });
                
                return cleanedCount;
            } catch (error) {
                console.error('LocalStorage清理失败:', error);
                return 0;
            }
        }
    };

    // 事件工具
    events = {
        // 防抖
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // 节流
        throttle: (func, limit) => {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // 一次性事件监听
        once: (element, event, handler) => {
            const onceHandler = (e) => {
                handler(e);
                element.removeEventListener(event, onceHandler);
            };
            element.addEventListener(event, onceHandler);
        }
    };

    // DOM操作工具
    dom = {
        // 创建元素
        create: (tag, attributes = {}, content = '') => {
            const element = document.createElement(tag);
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else if (key.startsWith('data-')) {
                    element.setAttribute(key, value);
                } else if (key === 'className') {
                    element.className = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
            
            if (content) {
                element.innerHTML = content;
            }
            
            return element;
        },

        // 查找元素
        find: (selector, context = document) => {
            return context.querySelector(selector);
        },

        // 查找所有元素
        findAll: (selector, context = document) => {
            return Array.from(context.querySelectorAll(selector));
        },

        // 添加类
        addClass: (element, className) => {
            if (element && className) {
                element.classList.add(className);
            }
        },

        // 移除类
        removeClass: (element, className) => {
            if (element && className) {
                element.classList.remove(className);
            }
        },

        // 切换类
        toggleClass: (element, className) => {
            if (element && className) {
                element.classList.toggle(className);
            }
        },

        // 检查是否有类
        hasClass: (element, className) => {
            return element && element.classList.contains(className);
        }
    };

    // 动画工具
    animation = {
        // 淡入
        fadeIn: (element, duration = 300) => {
            element.style.opacity = '0';
            element.style.display = 'block';
            
            const start = performance.now();
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = progress;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        },

        // 淡出
        fadeOut: (element, duration = 300) => {
            const start = performance.now();
            const initialOpacity = parseFloat(window.getComputedStyle(element).opacity);
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = initialOpacity * (1 - progress);
                
                if (progress >= 1) {
                    element.style.display = 'none';
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        },

        // 滑动
        slideDown: (element, duration = 300) => {
            element.style.height = '0';
            element.style.overflow = 'hidden';
            element.style.display = 'block';
            
            const start = performance.now();
            const targetHeight = element.scrollHeight;
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.height = `${targetHeight * progress}px`;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.height = 'auto';
                    element.style.overflow = 'visible';
                }
            };
            
            requestAnimationFrame(animate);
        }
    };

    // 数学计算工具
    math = {
        // 限制范围
        clamp: (value, min, max) => {
            return Math.min(Math.max(value, min), max);
        },

        // 线性插值
        lerp: (start, end, factor) => {
            return start + (end - start) * factor;
        },

        // 随机数生成
        random: (min, max) => {
            return Math.random() * (max - min) + min;
        },

        // 四舍五入到指定小数位
        round: (value, decimals = 0) => {
            const factor = Math.pow(10, decimals);
            return Math.round(value * factor) / factor;
        },

        // 角度转弧度
        degToRad: (degrees) => {
            return degrees * Math.PI / 180;
        },

        // 弧度转角度
        radToDeg: (radians) => {
            return radians * 180 / Math.PI;
        }
    };

    // 设备检测工具
    device = {
        // 是否为移动设备
        isMobile: () => {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },

        // 是否为触摸设备
        isTouch: () => {
            return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        },

        // 获取设备类型
        getDeviceType: () => {
            if (device.isMobile()) {
                if (device.isTouch()) {
                    return 'mobile-touch';
                } else {
                    return 'mobile';
                }
            } else {
                return 'desktop';
            }
        },

        // 获取屏幕尺寸
        getScreenSize: () => {
            return {
                width: window.screen.width,
                height: window.screen.height,
                availWidth: window.screen.availWidth,
                availHeight: window.screen.availHeight
            };
        },

        // 获取视口尺寸
        getViewportSize: () => {
            return {
                width: window.innerWidth,
                height: window.innerHeight
            };
        }
    };

    // 网络工具
    network = {
        // 检查网络状态
        isOnline: () => {
            return navigator.onLine;
        },

        // 获取连接类型
        getConnectionType: () => {
            if (navigator.connection) {
                return navigator.connection.effectiveType;
            }
            return 'unknown';
        },

        // 下载速度测试
        testSpeed: async () => {
            const startTime = performance.now();
            const testData = new Array(1024 * 100).fill(0).join(''); // 100KB测试数据
            
            try {
                const response = await fetch('data:text/plain;charset=utf-8,' + encodeURIComponent(testData));
                const data = await response.text();
                const endTime = performance.now();
                
                const duration = (endTime - startTime) / 1000; // 秒
                const speed = (data.length * 8) / (1024 * duration); // Kbps
                
                return speed;
            } catch (error) {
                console.error('网络速度测试失败:', error);
                return null;
            }
        }
    };

    // 错误处理工具
    error = {
        // 创建错误对象
        create: (message, code = null, details = null) => {
            const error = new Error(message);
            error.code = code;
            error.details = details;
            error.timestamp = Date.now();
            return error;
        },

        // 捕获并处理错误
        handle: (error, handler = null) => {
            console.error('捕获到错误:', error);
            
            if (handler && typeof handler === 'function') {
                handler(error);
            }
            
            // 发送错误报告（如果配置了）
            if (CONFIG && CONFIG.ERROR_REPORTING) {
                this.report(error);
            }
            
            return error;
        },

        // 错误报告
        report: async (error) => {
            try {
                const errorData = {
                    message: error.message,
                    stack: error.stack,
                    code: error.code,
                    details: error.details,
                    timestamp: error.timestamp,
                    userAgent: navigator.userAgent,
                    url: window.location.href
                };
                
                // 这里可以发送到错误收集服务
                console.log('错误报告数据:', errorData);
            } catch (reportError) {
                console.error('错误报告失败:', reportError);
            }
        }
    };
}

// 创建全局工具实例
const utils = new Utils();

// 导出工具
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.Utils = Utils;
    window.utils = utils;
}
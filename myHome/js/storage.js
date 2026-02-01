// 本地存储管理模块
class StorageManager {
    constructor() {
        this.prefix = 'riding_assistant_';
        this.isAvailable = this.checkStorageAvailability();
    }

    // 检查存储是否可用
    checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('LocalStorage不可用，将使用内存存储');
            return false;
        }
    }

    // 生成存储键名
    getKey(key) {
        return `${this.prefix}${key}`;
    }

    // 设置数据
    set(key, value, options = {}) {
        try {
            const storageKey = this.getKey(key);
            const data = {
                value: value,
                timestamp: Date.now(),
                version: options.version || 1,
                expire: options.expire || null
            };

            if (this.isAvailable) {
                localStorage.setItem(storageKey, JSON.stringify(data));
            } else {
                // 内存存储
                if (!this.memoryStorage) {
                    this.memoryStorage = {};
                }
                this.memoryStorage[storageKey] = data;
            }

            return true;
        } catch (error) {
            console.error('存储数据失败:', error);
            return false;
        }
    }

    // 获取数据
    get(key, defaultValue = null) {
        try {
            const storageKey = this.getKey(key);
            let data;

            if (this.isAvailable) {
                const item = localStorage.getItem(storageKey);
                if (!item) return defaultValue;
                data = JSON.parse(item);
            } else {
                if (!this.memoryStorage || !this.memoryStorage[storageKey]) {
                    return defaultValue;
                }
                data = this.memoryStorage[storageKey];
            }

            // 检查过期时间
            if (data.expire && Date.now() > data.expire) {
                this.remove(key);
                return defaultValue;
            }

            return data.value;
        } catch (error) {
            console.error('获取数据失败:', error);
            return defaultValue;
        }
    }

    // 删除数据
    remove(key) {
        try {
            const storageKey = this.getKey(key);
            
            if (this.isAvailable) {
                localStorage.removeItem(storageKey);
            } else {
                if (this.memoryStorage) {
                    delete this.memoryStorage[storageKey];
                }
            }
            
            return true;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    }

    // 清空所有数据
    clear() {
        try {
            if (this.isAvailable) {
                Object.keys(localStorage)
                    .filter(key => key.startsWith(this.prefix))
                    .forEach(key => localStorage.removeItem(key));
            } else {
                this.memoryStorage = {};
            }
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }

    // 获取存储大小
    getSize() {
        if (this.isAvailable) {
            let size = 0;
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    size += localStorage[key].length;
                }
            });
            return size;
        }
        return 0;
    }

    // 获取所有键名
    getKeys() {
        if (this.isAvailable) {
            return Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .map(key => key.replace(this.prefix, ''));
        }
        return this.memoryStorage ? Object.keys(this.memoryStorage) : [];
    }
}

// 用户配置管理
class UserManager {
    constructor(storage) {
        this.storage = storage;
        this.configKey = 'user_config';
        this.loadConfig();
    }

    // 加载用户配置
    loadConfig() {
        this.config = this.storage.get(this.configKey, CONFIG.USER_DEFAULTS);
        return this.config;
    }

    // 保存用户配置
    saveConfig() {
        return this.storage.set(this.configKey, this.config);
    }

    // 更新配置
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        return this.saveConfig();
    }

    // 获取配置值
    getConfig(key, defaultValue = null) {
        return this.config[key] !== undefined ? this.config[key] : defaultValue;
    }

    // 设置配置值
    setConfig(key, value) {
        this.config[key] = value;
        return this.saveConfig();
    }

    // 重置配置
    resetConfig() {
        this.config = { ...CONFIG.USER_DEFAULTS };
        return this.saveConfig();
    }

    // 添加紧急联系人
    addEmergencyContact(contact) {
        if (!this.config.emergencyContacts) {
            this.config.emergencyContacts = [];
        }
        
        if (this.config.emergencyContacts.length >= CONFIG.EMERGENCY.EMERGENCY_CONTACTS_LIMIT) {
            throw new Error('紧急联系人数量已达上限');
        }

        const contactWithId = {
            id: Date.now().toString(),
            ...contact,
            addedAt: new Date().toISOString()
        };

        this.config.emergencyContacts.push(contactWithId);
        this.saveConfig();
        return contactWithId;
    }

    // 删除紧急联系人
    removeEmergencyContact(id) {
        if (!this.config.emergencyContacts) return false;

        const index = this.config.emergencyContacts.findIndex(c => c.id === id);
        if (index !== -1) {
            this.config.emergencyContacts.splice(index, 1);
            this.saveConfig();
            return true;
        }
        return false;
    }

    // 获取紧急联系人列表
    getEmergencyContacts() {
        return this.config.emergencyContacts || [];
    }
}

// 行程数据管理
class TripManager {
    constructor(storage) {
        this.storage = storage;
        this.currentKey = 'trip_current';
        this.historyKey = 'trip_history';
        this.loadCurrentTrip();
    }

    // 加载当前行程
    loadCurrentTrip() {
        this.currentTrip = this.storage.get(this.currentKey, this.getEmptyTripData());
        return this.currentTrip;
    }

    // 获取空行程数据结构
    getEmptyTripData() {
        return {
            id: this.generateTripId(),
            status: CONFIG.TRIP_STATUS.NOT_STARTED,
            startTime: null,
            endTime: null,
            startPosition: null,
            endPosition: null,
            currentPosition: null,
            todayDistance: 0,
            totalDistance: 0,
            todayElevation: 0,
            totalElevation: 0,
            averageSpeed: 0,
            maxSpeed: 0,
            ridingTime: 0,
            restTime: 0,
            waypoints: [],
            restStops: [],
            weatherLog: [],
            aiSuggestions: [],
            adjustments: [],
            emergencyEvents: [],
            dailyStats: []
        };
    }

    // 生成行程ID
    generateTripId() {
        return `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 保存当前行程
    saveCurrentTrip() {
        return this.storage.set(this.currentKey, this.currentTrip);
    }

    // 开始行程
    startTrip() {
        this.currentTrip.status = CONFIG.TRIP_STATUS.ACTIVE;
        this.currentTrip.startTime = new Date().toISOString();
        this.currentTrip.startPosition = CONFIG.ROUTE.START;
        this.currentTrip.currentPosition = CONFIG.ROUTE.START;
        return this.saveCurrentTrip();
    }

    // 暂停行程
    pauseTrip() {
        if (this.currentTrip.status === CONFIG.TRIP_STATUS.ACTIVE) {
            this.currentTrip.status = CONFIG.TRIP_STATUS.PAUSED;
            return this.saveCurrentTrip();
        }
        return false;
    }

    // 继续行程
    resumeTrip() {
        if (this.currentTrip.status === CONFIG.TRIP_STATUS.PAUSED) {
            this.currentTrip.status = CONFIG.TRIP_STATUS.ACTIVE;
            return this.saveCurrentTrip();
        }
        return false;
    }

    // 结束行程
    endTrip() {
        this.currentTrip.status = CONFIG.TRIP_STATUS.COMPLETED;
        this.currentTrip.endTime = new Date().toISOString();
        this.currentTrip.endPosition = CONFIG.ROUTE.END;
        
        // 保存到历史记录
        this.saveToHistory();
        
        return this.saveCurrentTrip();
    }

    // 更新位置信息
    updatePosition(position) {
        this.currentTrip.currentPosition = {
            lat: position.lat,
            lng: position.lng,
            accuracy: position.accuracy,
            timestamp: position.timestamp || new Date().toISOString(),
            speed: position.speed,
            heading: position.heading
        };

        // 计算距离和速度
        if (position.speed !== null && position.speed > 0) {
            this.currentTrip.averageSpeed = this.calculateAverageSpeed(position.speed);
            this.currentTrip.maxSpeed = Math.max(this.currentTrip.maxSpeed, position.speed);
        }

        return this.saveCurrentTrip();
    }

    // 计算平均速度
    calculateAverageSpeed(currentSpeed) {
        if (this.currentTrip.averageSpeed === 0) {
            return currentSpeed;
        }
        
        // 使用加权平均，最近的速度权重更大
        const weight = 0.1; // 最近速度的权重
        return (this.currentTrip.averageSpeed * (1 - weight) + currentSpeed * weight);
    }

    // 添加休息点
    addRestStop(restStop) {
        const stopWithId = {
            id: Date.now().toString(),
            ...restStop,
            timestamp: new Date().toISOString()
        };

        this.currentTrip.restStops.push(stopWithId);
        return this.saveCurrentTrip();
    }

    // 更新今日距离
    updateTodayDistance(distance) {
        this.currentTrip.todayDistance = distance;
        this.currentTrip.totalDistance = Math.max(this.currentTrip.totalDistance, distance);
        return this.saveCurrentTrip();
    }

    // 添加天气记录
    addWeatherLog(weatherData) {
        const logWithId = {
            id: Date.now().toString(),
            ...weatherData,
            timestamp: new Date().toISOString()
        };

        this.currentTrip.weatherLog.push(logWithId);
        
        // 限制日志数量
        if (this.currentTrip.weatherLog.length > 50) {
            this.currentTrip.weatherLog = this.currentTrip.weatherLog.slice(-30);
        }

        return this.saveCurrentTrip();
    }

    // 添加AI建议
    addAISuggestion(suggestion) {
        const suggestionWithId = {
            id: Date.now().toString(),
            ...suggestion,
            timestamp: new Date().toISOString(),
            status: 'pending' // pending, accepted, rejected
        };

        this.currentTrip.aiSuggestions.push(suggestionWithId);
        
        // 限制建议数量
        if (this.currentTrip.aiSuggestions.length > 20) {
            this.currentTrip.aiSuggestions = this.currentTrip.aiSuggestions.slice(-10);
        }

        return this.saveCurrentTrip();
    }

    // 更新AI建议状态
    updateSuggestionStatus(id, status) {
        const suggestion = this.currentTrip.aiSuggestions.find(s => s.id === id);
        if (suggestion) {
            suggestion.status = status;
            return this.saveCurrentTrip();
        }
        return false;
    }

    // 添加调整记录
    addAdjustment(adjustment) {
        const adjustmentWithId = {
            id: Date.now().toString(),
            ...adjustment,
            timestamp: new Date().toISOString()
        };

        this.currentTrip.adjustments.push(adjustmentWithId);
        return this.saveCurrentTrip();
    }

    // 添加紧急事件
    addEmergencyEvent(event) {
        const eventWithId = {
            id: Date.now().toString(),
            ...event,
            timestamp: new Date().toISOString()
        };

        this.currentTrip.emergencyEvents.push(eventWithId);
        return this.saveCurrentTrip();
    }

    // 保存到历史记录
    saveToHistory() {
        const history = this.storage.get(this.historyKey, []);
        history.push(this.currentTrip);
        
        // 限制历史记录数量
        if (history.length > 10) {
            history.splice(0, history.length - 10);
        }

        this.storage.set(this.historyKey, history);
    }

    // 获取历史行程
    getHistory() {
        return this.storage.get(this.historyKey, []);
    }

    // 清除当前行程
    clearCurrentTrip() {
        this.currentTrip = this.getEmptyTripData();
        return this.saveCurrentTrip();
    }

    // 获取行程统计
    getTripStats() {
        const now = new Date();
        const startTime = this.currentTrip.startTime ? new Date(this.currentTrip.startTime) : null;
        
        return {
            duration: startTime ? Math.floor((now - startTime) / 1000 / 60) : 0, // 分钟
            distance: this.currentTrip.totalDistance,
            averageSpeed: this.currentTrip.averageSpeed,
            maxSpeed: this.currentTrip.maxSpeed,
            restStops: this.currentTrip.restStops.length,
            weatherChanges: this.currentTrip.weatherLog.length,
            aiSuggestions: this.currentTrip.aiSuggestions.length
        };
    }
}

// 数据管理器
class DataManager {
    constructor() {
        this.storage = new StorageManager();
        this.userManager = new UserManager(this.storage);
        this.tripManager = new TripManager(this.storage);
    }

    // 初始化
    async init() {
        console.log('数据管理器初始化完成');
        
        // 检查是否是首次使用
        const isFirstUse = this.storage.get('is_first_use', true);
        if (isFirstUse) {
            this.storage.set('is_first_use', false);
            await this.setupFirstUse();
        }
    }

    // 首次使用设置
    async setupFirstUse() {
        console.log('首次使用设置');
        // 可以在这里添加引导逻辑
    }

    // 清理过期数据
    cleanup() {
        const keys = this.storage.getKeys();
        const now = Date.now();
        
        keys.forEach(key => {
            // 清理过期的缓存数据
            if (key.includes('cache_')) {
                const data = this.storage.get(key);
                if (data && data.expire && now > data.expire) {
                    this.storage.remove(key);
                }
            }
        });

        console.log('数据清理完成');
    }

    // 导出数据
    exportData() {
        const data = {
            userConfig: this.userManager.config,
            currentTrip: this.tripManager.currentTrip,
            tripHistory: this.tripManager.getHistory(),
            exportTime: new Date().toISOString()
        };

        return JSON.stringify(data, null, 2);
    }

    // 导入数据
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.userConfig) {
                this.userManager.config = data.userConfig;
                this.userManager.saveConfig();
            }
            
            if (data.currentTrip) {
                this.tripManager.currentTrip = data.currentTrip;
                this.tripManager.saveCurrentTrip();
            }
            
            if (data.tripHistory) {
                this.storage.set('trip_history', data.tripHistory);
            }

            return true;
        } catch (error) {
            console.error('数据导入失败:', error);
            return false;
        }
    }
}

// 创建全局实例
const dataManager = new DataManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StorageManager,
        UserManager,
        TripManager,
        DataManager,
        dataManager
    };
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
    window.UserManager = UserManager;
    window.TripManager = TripManager;
    window.DataManager = DataManager;
    window.dataManager = dataManager;
}
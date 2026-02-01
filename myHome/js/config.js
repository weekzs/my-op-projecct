// 应用配置文件
const CONFIG = {
    // 应用信息
    APP: {
        NAME: '宁波-九江智能骑行助手',
        VERSION: '1.0.0',
        DESCRIPTION: '智能骑行导航助手 - 实时导航、天气预警、住宿规划',
        AUTHOR: '智能骑行助手开发团队'
    },

    // 路线配置
    ROUTE: {
        START: {
            name: '宁波',
            coords: { lat: 29.8683, lng: 121.5440 }
        },
        END: {
            name: '九江',
            coords: { lat: 29.7047, lng: 115.9920 }
        },
        TOTAL_DISTANCE: 686, // 总距离（公里）
        ESTIMATED_DAYS: 5,    // 预计天数
        WAYPOINTS: [
            {
                name: '杭州湾跨海大桥',
                coords: { lat: 30.3695, lng: 121.1226 },
                distance: 60
            },
            {
                name: '嘉兴',
                coords: { lat: 30.7627, lng: 120.7505 },
                distance: 150
            },
            {
                name: '杭州',
                coords: { lat: 30.2741, lng: 120.1551 },
                distance: 250
            },
            {
                name: '黄山',
                coords: { lat: 29.7092, lng: 118.3366 },
                distance: 400
            },
            {
                name: '景德镇',
                coords: { lat: 29.3022, lng: 117.2145 },
                distance: 530
            }
        ]
    },

    // API配置
    API: {
        TIANDITU: {
            MAP_KEY: 'b9dba51939890c06d308032e54dd8c71',
            WEATHER_KEY: '1d558b2a4b64bd56595789e1828f3a45',
            BASE_URL: 'https://api.tianditu.gov.cn',
            MAP_JS_URL: 'https://api.tianditu.gov.cn/api?v=4.0'
        },
        DEEPSEEK: {
            API_KEY: 'sk-14dd8e7224024b758b8dae6db81d9299',
            BASE_URL: 'https://api.deepseek.com/v1',
            MODEL: 'deepseek-chat',
            MAX_TOKENS: 2000,
            TEMPERATURE: 0.7
        }
    },

    // 定位配置
    LOCATION: {
        UPDATE_INTERVAL: 5 * 60 * 1000, // 5分钟更新一次
        ACCURACY_THRESHOLD: 50,        // 精度阈值（米）
        TIMEOUT: 10000,                // 超时时间（毫秒）
        MAX_AGE: 60000,               // 缓存时间（毫秒）
        ENABLE_HIGH_ACCURACY: true,
        TIMEOUT_AFTER_HIGH_ACCURACY: 5000
    },

    // AI决策配置
    AI: {
        EVALUATION_INTERVAL: 60 * 60 * 1000, // 每小时评估一次
        CONFIDENCE_THRESHOLD: 0.7,            // 置信度阈值
        AUTO_EXECUTE_THRESHOLD: 0.8,          // 自动执行阈值
        MAX_RETRY_ATTEMPTS: 3,                // 最大重试次数
        CONTEXT_WINDOW_SIZE: 5,               // 上下文窗口大小
        LEARNING_RATE: 0.1                    // 学习率
    },

    // 用户配置默认值
    USER_DEFAULTS: {
        dailyBudget: 100,           // 每日预算（元）
        preferredStartTime: '08:00', // 偏好出发时间
        ridingStyle: 'conservative', // 骑行风格: conservative, balanced, aggressive
        accommodationType: 'budget', // 住宿类型: budget, economy, comfort
        autoAdjustment: true,       // 自动调整
        emergencyContacts: [],       // 紧急联系人
        ridingPreferences: {
            dailyDistance: 120,      // 每日目标距离
            restInterval: 20,        // 休息间隔（分钟）
            maxSpeed: 25,           // 最大速度
            preferredTerrain: 'mixed' // 地形偏好
        }
    },

    // 天气配置
    WEATHER: {
        UPDATE_INTERVAL: 30 * 60 * 1000, // 30分钟更新一次
        WARNING_CONDITIONS: ['大雨', '暴雨', '大风', '高温', '雷电'],
        PERFECT_CONDITIONS: ['晴', '多云', '阴'],
        TEMPERATURE_RANGES: {
            PERFECT: { min: 15, max: 25 },
            ACCEPTABLE: { min: 10, max: 30 },
            WARNING: { min: 5, max: 35 }
        }
    },

    // 住宿配置
    ACCOMMODATION: {
        SEARCH_RADIUS: 10,         // 搜索半径（公里）
        BUDGET_RANGES: {
            budget: { min: 30, max: 80 },
            economy: { min: 80, max: 150 },
            comfort: { min: 150, max: 300 }
        },
        PRIORITY_FACTORS: ['safety', 'price', 'facilities', 'convenience'],
        EMERGENCY_FALLBACK: true    // 紧急情况下价格放宽
    },

    // 性能配置
    PERFORMANCE: {
        MAP_TILE_CACHE_SIZE: 100,   // 地图瓦片缓存数量
        LOCATION_CACHE_DURATION: 5 * 60 * 1000, // 位置缓存时间
        API_REQUEST_TIMEOUT: 10000, // API请求超时
        RETRY_DELAY: 1000,          // 重试延迟
        MAX_CONCURRENT_REQUESTS: 3, // 最大并发请求数
        BATTERY_SAVE_MODE_THRESHOLD: 20 // 低电量阈值
    },

    // 紧急配置
    EMERGENCY: {
        SOS_DURATION: 5 * 60 * 1000,    // SOS持续时间
        LOCATION_SHARE_DURATION: 60 * 60 * 1000, // 位置分享持续时间
        EMERGENCY_CONTACTS_LIMIT: 5,    // 紧急联系人数量限制
        AUTO_CALL_EMERGENCY: false,     // 自动拨打紧急电话
        NEARBY_HELP_RADIUS: 5           // 附近帮助搜索半径
    },

    // 缓存配置
    CACHE: {
        MAP_DATA: 'mapData',
        USER_SETTINGS: 'userSettings',
        TRIP_DATA: 'tripData',
        WEATHER_DATA: 'weatherData',
        ACCOMMODATION_DATA: 'accommodationData',
        AI_SUGGESTIONS: 'aiSuggestions'
    },

    // 状态常量
    TRIP_STATUS: {
        NOT_STARTED: 'not_started',
        ACTIVE: 'active',
        PAUSED: 'paused',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    },

    AI_SUGGESTION_TYPES: {
        ROUTE_ADJUSTMENT: 'route_adjustment',
        ACCOMMODATION_CHANGE: 'accommodation_change',
        REST_RECOMMENDATION: 'rest_recommendation',
        WEATHER_WARNING: 'weather_warning',
        EMERGENCY_ASSISTANCE: 'emergency_assistance',
        SPEED_ADJUSTMENT: 'speed_adjustment'
    },

    // 网络状态
    NETWORK: {
        OFFLINE_DETECTION_INTERVAL: 5000,  // 离线检测间隔
        API_RETRY_ATTEMPTS: 3,               // API重试次数
        OFFLINE_QUEUE_SIZE: 100              // 离线队列大小
    }
};

// 导出配置（支持模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
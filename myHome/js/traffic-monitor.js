// 实时路况监控模块 - 路况分析、避堵建议、交通预警
class TrafficMonitor {
    constructor() {
        this.isMonitoring = false;
        this.trafficData = new Map(); // 路况数据缓存
        this.congestionZones = []; // 拥堵区域
        this.constructionZones = []; // 施工区域
        this.accidentReports = []; // 事故报告
        this.updateInterval = 5 * 60 * 1000; // 5分钟更新间隔
        this.lastUpdate = 0;
        this.apiEndpoints = {
            baidu: 'https://api.map.baidu.com/traffic/v1',
            amap: 'https://restapi.amap.com/v3/traffic/status/road',
            tianditu: 'https://api.tianditu.gov.cn/traffic' // 假设天地图有路况API
        };
        
        // 路况等级定义
        this.trafficLevels = {
            SMOOTH: { level: 1, color: '#4CAF50', description: '畅通' },
            SLOW: { level: 2, color: '#FFC107', description: '缓慢' },
            CONGESTED: { level: 3, color: '#FF9800', description: '拥堵' },
            HEAVY: { level: 4, color: '#F44336', description: '严重拥堵' }
        };
        
        // 绑定方法
        this.init = this.init.bind(this);
        this.startMonitoring = this.startMonitoring.bind(this);
        this.updateTrafficData = this.updateTrafficData.bind(this);
    }

    // 初始化路况监控
    async init() {
        try {
            console.log('🚦 初始化路况监控系统...');
            
            // 加载基础数据
            await this.loadBaseTrafficData();
            
            // 初始化监控区域
            this.initializeMonitoringZones();
            
            // 绑定事件监听
            this.bindEventListeners();
            
            console.log('✅ 路况监控系统初始化完成');
            return true;
            
        } catch (error) {
            console.error('❌ 路况监控系统初始化失败:', error);
            return false;
        }
    }

    // 加载基础路况数据
    async loadBaseTrafficData() {
        try {
            // 加载预设的拥堵区域（基于宁波-九江路线）
            this.congestionZones = [
                {
                    id: 'ningbo_city_center',
                    name: '宁波市中心',
                    coords: { lat: 29.8683, lng: 121.5440 },
                    radius: 5000, // 5公里
                    congestionLevel: this.trafficLevels.SLOW.level,
                    peakHours: ['07:30-09:00', '17:00-18:30'],
                    alternativeRoutes: ['外环路', '江东路']
                },
                {
                    id: 'hangzhou_bridge',
                    name: '杭州湾跨海大桥',
                    coords: { lat: 30.3695, lng: 121.1226 },
                    radius: 10000, // 10公里
                    congestionLevel: this.trafficLevels.SMOOTH.level,
                    weatherSensitive: true,
                    tollInfo: { standard: 80, motorcycle: 40 }
                },
                {
                    id: 'hangzhou_west_lake',
                    name: '杭州西湖景区',
                    coords: { lat: 30.2741, lng: 120.1551 },
                    radius: 3000, // 3公里
                    congestionLevel: this.trafficLevels.CONGESTED.level,
                    touristPeak: true,
                    peakHours: ['09:00-11:00', '14:00-16:00', '18:00-20:00'],
                    restrictions: ['周末限行', '节假日限行']
                }
            ];
            
            // 加载施工区域
            this.constructionZones = [
                {
                    id: 'g15_construction',
                    name: 'G15高速施工段',
                    startCoords: { lat: 30.2, lng: 120.8 },
                    endCoords: { lat: 30.4, lng: 121.0 },
                    type: 'road_work',
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                    impact: 'lane_reduction',
                    speedLimit: 40,
                    alternativeRoute: 'S4省道'
                }
            ];
            
            console.log('✓ 基础路况数据加载完成');
            
        } catch (error) {
            console.error('基础路况数据加载失败:', error);
        }
    }

    // 初始化监控区域
    initializeMonitoringZones() {
        // 基于路线定义监控区域
        this.monitoringZones = CONFIG.ROUTE.WAYPOINTS.map((waypoint, index) => ({
            id: `zone_${index}`,
            name: waypoint.name,
            coords: waypoint.coords,
            radius: 10000, // 10公里监控半径
            priority: index < 3 ? 'high' : 'medium', // 前三个地点为高优先级
            trafficLevel: null,
            lastUpdate: null
        }));
        
        console.log(`✓ 初始化${this.monitoringZones.length}个监控区域`);
    }

    // 绑定事件监听
    bindEventListeners() {
        // 监听定位更新
        document.addEventListener('locationUpdate', this.handleLocationUpdate.bind(this));
        
        // 监听导航开始
        document.addEventListener('navigationStarted', this.handleNavigationStarted.bind(this));
        
        // 监听导航结束
        document.addEventListener('navigationStopped', this.handleNavigationStopped.bind(this));
    }

    // 开始监控
    startMonitoring() {
        if (this.isMonitoring) {
            console.log('路况监控已在运行');
            return;
        }
        
        console.log('🚦 开始路况监控...');
        this.isMonitoring = true;
        
        // 立即更新一次数据
        this.updateTrafficData();
        
        // 设置定时更新
        this.monitoringTimer = setInterval(() => {
            this.updateTrafficData();
        }, this.updateInterval);
        
        // 触发监控开始事件
        this.dispatchTrafficEvent('monitoringStarted', {
            interval: this.updateInterval,
            zones: this.monitoringZones.length
        });
    }

    // 停止监控
    stopMonitoring() {
        if (!this.isMonitoring) {
            console.log('路况监控未在运行');
            return;
        }
        
        console.log('⏹️ 停止路况监控...');
        this.isMonitoring = false;
        
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }
        
        // 触发监控结束事件
        this.dispatchTrafficEvent('monitoringStopped', {});
    }

    // 更新路况数据
    async updateTrafficData() {
        try {
            console.log('📊 更新路况数据...');
            const updateTime = Date.now();
            
            // 更新各个监控区域的路况
            for (const zone of this.monitoringZones) {
                const trafficInfo = await this.getZoneTrafficInfo(zone);
                if (trafficInfo) {
                    zone.trafficLevel = trafficInfo.level;
                    zone.lastUpdate = updateTime;
                    zone.trafficInfo = trafficInfo;
                    
                    // 缓存数据
                    this.trafficData.set(zone.id, {
                        ...trafficInfo,
                        timestamp: updateTime
                    });
                }
            }
            
            // 检查是否有重大路况变化
            const significantChanges = this.checkSignificantChanges();
            if (significantChanges.length > 0) {
                this.handleSignificantTrafficChanges(significantChanges);
            }
            
            this.lastUpdate = updateTime;
            console.log('✓ 路况数据更新完成');
            
        } catch (error) {
            console.error('路况数据更新失败:', error);
        }
    }

    // 获取区域路况信息
    async getZoneTrafficInfo(zone) {
        try {
            // 结合实时API和预定义数据
            let trafficLevel = this.trafficLevels.SMOOTH.level;
            let factors = [];
            let recommendations = [];
            
            // 检查是否在预定义的拥堵区域
            const congestionZone = this.findNearbyCongestionZone(zone);
            if (congestionZone) {
                trafficLevel = Math.max(trafficLevel, congestionZone.congestionLevel);
                factors.push(`${congestionZone.name}区域易拥堵`);
                
                if (congestionZone.alternativeRoutes) {
                    recommendations.push(`可考虑${congestionZone.alternativeRoutes.join('或')}`);
                }
            }
            
            // 检查施工区域
            const constructionZone = this.findNearbyConstruction(zone);
            if (constructionZone) {
                trafficLevel = Math.max(trafficLevel, this.trafficLevels.SLOW.level);
                factors.push(`${constructionZone.name}施工中`);
                recommendations.push(`建议绕行${constructionZone.alternativeRoute}`);
            }
            
            // 检查时间段影响
            const timeFactor = this.getTimeBasedTrafficFactor(zone);
            trafficLevel = Math.max(trafficLevel, timeFactor.level);
            if (timeFactor.factors.length > 0) {
                factors.push(...timeFactor.factors);
            }
            
            // 模拟API调用（实际应用中这里应该调用真实的路况API）
            const apiTrafficLevel = await this.callTrafficAPI(zone);
            if (apiTrafficLevel) {
                trafficLevel = Math.max(trafficLevel, apiTrafficLevel);
            }
            
            return {
                level: trafficLevel,
                levelName: this.getTrafficLevelName(trafficLevel),
                color: this.getTrafficLevelColor(trafficLevel),
                factors: factors,
                recommendations: recommendations,
                estimatedDelay: this.calculateEstimatedDelay(trafficLevel),
                confidence: 0.8 // 置信度
            };
            
        } catch (error) {
            console.error(`获取${zone.name}路况信息失败:`, error);
            return null;
        }
    }

    // 查找附近的拥堵区域
    findNearbyCongestionZone(zone) {
        return this.congestionZones.find(cz => {
            const distance = this.calculateDistance(zone.coords, cz.coords);
            return distance <= cz.radius;
        });
    }

    // 查找附近的施工区域
    findNearbyConstruction(zone) {
        return this.constructionZones.find(cz => {
            const distance = this.calculateDistance(zone.coords, cz.startCoords);
            return distance <= 5000; // 5公里内
        });
    }

    // 获取基于时间的路况因素
    getTimeBasedTrafficFactor(zone) {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;
        
        let level = this.trafficLevels.SMOOTH.level;
        const factors = [];
        
        // 检查拥堵区域的峰值时间
        const congestionZone = this.findNearbyCongestionZone(zone);
        if (congestionZone && congestionZone.peakHours) {
            for (const peakRange of congestionZone.peakHours) {
                if (this.isTimeInRange(currentTime, peakRange)) {
                    level = Math.max(level, this.trafficLevels.SLOW.level);
                    factors.push(`${congestionZone.name}高峰时段`);
                    break;
                }
            }
        }
        
        // 检查景区的旅游高峰
        if (congestionZone && congestionZone.touristPeak && isWeekend) {
            level = Math.max(level, this.trafficLevels.CONGESTED.level);
            factors.push(`${congestionZone.name}周末旅游高峰`);
        }
        
        return { level, factors };
    }

    // 检查时间是否在范围内
    isTimeInRange(currentTime, timeRange) {
        const [start, end] = timeRange.split('-');
        return currentTime >= start && currentTime <= end;
    }

    // 调用路况API（模拟）
    async callTrafficAPI(zone) {
        try {
            // 这里应该调用真实的路况API
            // 目前使用模拟数据
            
            // 模拟不同区域的随机路况
            const randomFactor = Math.random();
            let trafficLevel;
            
            if (randomFactor < 0.6) {
                trafficLevel = this.trafficLevels.SMOOTH.level;
            } else if (randomFactor < 0.8) {
                trafficLevel = this.trafficLevels.SLOW.level;
            } else if (randomFactor < 0.95) {
                trafficLevel = this.trafficLevels.CONGESTED.level;
            } else {
                trafficLevel = this.trafficLevels.HEAVY.level;
            }
            
            // 模拟API延迟
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
            
            return trafficLevel;
            
        } catch (error) {
            console.error('路况API调用失败:', error);
            return null;
        }
    }

    // 检查重大路况变化
    checkSignificantChanges() {
        const changes = [];
        
        for (const zone of this.monitoringZones) {
            const currentData = this.trafficData.get(zone.id);
            const previousData = this.getPreviousTrafficData(zone.id);
            
            if (currentData && previousData) {
                const levelChange = Math.abs(currentData.level - previousData.level);
                if (levelChange >= 2) { // 路况等级变化2级以上
                    changes.push({
                        zone: zone,
                        from: previousData.level,
                        to: currentData.level,
                        change: currentData.level - previousData.level
                    });
                }
            }
        }
        
        return changes;
    }

    // 处理重大路况变化
    handleSignificantTrafficChanges(changes) {
        console.log('🚨 检测到重大路况变化:', changes);
        
        for (const change of changes) {
            // 生成路况变化通知
            const notification = this.createTrafficChangeNotification(change);
            
            // 发送通知
            this.sendTrafficNotification(notification);
            
            // 通知导航系统调整路线
            if (window.navigationManager) {
                window.navigationManager.handleTrafficChange(change);
            }
        }
    }

    // 创建路况变化通知
    createTrafficChangeNotification(change) {
        const direction = change.change > 0 ? '恶化' : '改善';
        const levelName = this.getTrafficLevelName(change.to);
        
        return {
            type: 'traffic_change',
            title: `${change.zone.name}路况${direction}`,
            message: `当前路况等级：${levelName}`,
            zone: change.zone,
            change: change,
            timestamp: Date.now(),
            priority: Math.abs(change.change) >= 3 ? 'high' : 'medium'
        };
    }

    // 发送路况通知
    sendTrafficNotification(notification) {
        // 显示通知
        if (window.uiManager) {
            window.uiManager.showToast(
                `${notification.title}: ${notification.message}`,
                notification.priority === 'high' ? 'error' : 'warning',
                8000
            );
        }
        
        // 触发通知事件
        this.dispatchTrafficEvent('trafficNotification', notification);
    }

    // 获取路线路况分析
    async getRouteTrafficAnalysis(route) {
        try {
            console.log('📊 分析路线路况...');
            
            const analysis = {
                overallLevel: this.trafficLevels.SMOOTH.level,
                zones: [],
                totalDelay: 0,
                recommendations: [],
                alternativeRoutes: []
            };
            
            // 分析路线上每个点的路况
            for (const waypoint of route.waypoints) {
                const zone = this.monitoringZones.find(z => 
                    this.calculateDistance(z.coords, waypoint.location) < z.radius
                );
                
                if (zone) {
                    const trafficData = this.trafficData.get(zone.id);
                    if (trafficData) {
                        analysis.zones.push({
                            name: zone.name,
                            level: trafficData.level,
                            levelName: trafficData.levelName,
                            estimatedDelay: trafficData.estimatedDelay
                        });
                        
                        analysis.overallLevel = Math.max(analysis.overallLevel, trafficData.level);
                        analysis.totalDelay += trafficData.estimatedDelay;
                        
                        if (trafficData.recommendations.length > 0) {
                            analysis.recommendations.push(...trafficData.recommendations);
                        }
                    }
                }
            }
            
            // 生成整体建议
            analysis.overallRecommendation = this.generateOverallRecommendation(analysis);
            
            console.log('✓ 路线路况分析完成');
            return analysis;
            
        } catch (error) {
            console.error('路线路况分析失败:', error);
            return this.getDefaultRouteAnalysis();
        }
    }

    // 生成整体建议
    generateOverallRecommendation(analysis) {
        const { overallLevel, totalDelay } = analysis;
        
        if (overallLevel >= this.trafficLevels.HEAVY.level) {
            return {
                action: 'avoid_or_delay',
                message: '路线严重拥堵，建议避开或延迟出行',
                urgency: 'high'
            };
        } else if (overallLevel >= this.trafficLevels.CONGESTED.level) {
            return {
                action: 'consider_alternative',
                message: '路线有拥堵，考虑备选路线',
                urgency: 'medium'
            };
        } else if (totalDelay > 30) {
            return {
                action: 'allow_extra_time',
                message: `预计延误${Math.round(totalDelay)}分钟，请预留充足时间`,
                urgency: 'low'
            };
        } else {
            return {
                action: 'proceed_normal',
                message: '路况良好，按计划出行',
                urgency: 'low'
            };
        }
    }

    // 事件处理器
    handleLocationUpdate(event) {
        const { position } = event.detail;
        
        // 检查当前位置是否在拥堵区域
        for (const zone of this.congestionZones) {
            const distance = this.calculateDistance(position, zone.coords);
            if (distance <= zone.radius) {
                this.handleEnteringCongestionZone(zone);
                break;
            }
        }
    }

    handleNavigationStarted(event) {
        console.log('导航开始，启动路况监控');
        this.startMonitoring();
    }

    handleNavigationStopped(event) {
        console.log('导航结束，停止路况监控');
        this.stopMonitoring();
    }

    handleEnteringCongestionZone(zone) {
        if (!this.zoneNotifications) {
            this.zoneNotifications = new Set();
        }
        
        if (!this.zoneNotifications.has(zone.id)) {
            this.zoneNotifications.add(zone.id);
            
            const notification = {
                type: 'entering_congestion_zone',
                title: `进入${zone.name}拥堵区域`,
                message: '请注意车流量较大，减速慢行',
                zone: zone,
                timestamp: Date.now()
            };
            
            this.sendTrafficNotification(notification);
        }
    }

    // 辅助方法
    calculateDistance(point1, point2) {
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
    }

    getTrafficLevelName(level) {
        for (const [key, value] of Object.entries(this.trafficLevels)) {
            if (value.level === level) {
                return value.description;
            }
        }
        return '未知';
    }

    getTrafficLevelColor(level) {
        for (const [key, value] of Object.entries(this.trafficLevels)) {
            if (value.level === level) {
                return value.color;
            }
        }
        return '#9E9E9E';
    }

    calculateEstimatedDelay(level) {
        const delays = {
            1: 0,    // 畅通：无延误
            2: 5,    // 缓慢：5分钟
            3: 15,   // 拥堵：15分钟
            4: 30    // 严重拥堵：30分钟
        };
        return delays[level] || 0;
    }

    getPreviousTrafficData(zoneId) {
        // 获取前一次的路况数据
        const allData = Array.from(this.trafficData.entries())
            .filter(([id, data]) => id === zoneId)
            .sort((a, b) => b[1].timestamp - a[1].timestamp);
        
        return allData.length > 1 ? allData[1][1] : null;
    }

    getDefaultRouteAnalysis() {
        return {
            overallLevel: this.trafficLevels.SMOOTH.level,
            zones: [],
            totalDelay: 0,
            recommendations: ['路况信息暂不可用，请谨慎驾驶'],
            alternativeRoutes: [],
            overallRecommendation: {
                action: 'proceed_with_caution',
                message: '路况信息不足，请谨慎驾驶',
                urgency: 'medium'
            }
        };
    }

    dispatchTrafficEvent(eventName, data) {
        const event = new CustomEvent(eventName, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    // 获取监控状态
    getMonitoringStatus() {
        return {
            isMonitoring: this.isMonitoring,
            lastUpdate: this.lastUpdate,
            zonesCount: this.monitoringZones.length,
            activeZones: this.monitoringZones.filter(z => z.trafficLevel !== null).length,
            congestionZones: this.congestionZones.length,
            constructionZones: this.constructionZones.length
        };
    }

    // 销毁监控器
    destroy() {
        this.stopMonitoring();
        this.trafficData.clear();
        this.zoneNotifications = null;
        
        console.log('路况监控器已销毁');
    }
}

// 创建路况监控器实例
const trafficMonitor = new TrafficMonitor();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrafficMonitor;
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.TrafficMonitor = TrafficMonitor;
    window.trafficMonitor = trafficMonitor;
}
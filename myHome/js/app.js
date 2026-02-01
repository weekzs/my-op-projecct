// 主应用文件
class RidingAssistantApp {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
        this.eventListeners = new Map();
        
        // 绑定方法
        this.init = this.init.bind(this);
        this.handleOnline = this.handleOnline.bind(this);
        this.handleOffline = this.handleOffline.bind(this);
        this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    }

    // 初始化应用
    async init() {
        try {
            console.log('🚴 启动智能骑行助手...');
            
            // 显示加载状态
            this.showLoadingScreen();

            // 初始化数据管理器
            await this.initDataManager();

            // 初始化UI管理器
            await this.initUI();

            // 初始化地图服务
            await this.initMap();

            // 初始化定位服务
            await this.initLocation();

            // 初始化天气服务
            await this.initWeather();
            
            // 初始化AI助手
            await this.initAIAssistant();
            
            // 初始化导航管理器
            await this.initNavigationManager();
            
            // 初始化路况监控
            await this.initTrafficMonitor();

            // 设置应用状态监听
            this.setupAppStateMonitoring();

            // 启动AI决策循环
            await this.startAIDecisionCycle();

            // 隐藏加载状态
            this.hideLoadingScreen();

            this.isInitialized = true;
            console.log('✅ 智能骑行助手启动完成');

            // 显示欢迎消息
            this.showWelcomeMessage();

            return true;

        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            this.showErrorMessage('应用初始化失败，请刷新页面重试');
            return false;
        }
    }

    // 显示加载屏幕
    showLoadingScreen() {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'loading-screen';
        loadingScreen.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #2196F3, #667eea);
                color: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">🚴</div>
                <h1 style="margin: 0 0 10px 0; font-size: 24px;">智能骑行助手</h1>
                <p style="margin: 0; opacity: 0.8;">宁波 → 九江</p>
                <div style="margin-top: 30px;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 3px solid rgba(255,255,255,0.3);
                        border-top: 3px solid white;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    "></div>
                </div>
                <p style="margin-top: 20px; font-size: 14px; opacity: 0.7;">正在初始化...</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loadingScreen);
    }

    // 隐藏加载屏幕
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (loadingScreen.parentNode) {
                    loadingScreen.parentNode.removeChild(loadingScreen);
                }
            }, 500);
        }
    }

    // 初始化数据管理器
    async initDataManager() {
        this.updateLoadingMessage('初始化数据管理器...');
        await window.dataManager.init();
        this.modules.dataManager = window.dataManager;
    }

    // 初始化UI管理器
    async initUI() {
        this.updateLoadingMessage('初始化用户界面...');
        await window.uiManager.init();
        this.modules.uiManager = window.uiManager;
    }

    // 初始化地图服务
    async initMap() {
        this.updateLoadingMessage('加载地图服务...');
        
        // 等待天地图API加载完成
        await this.waitForTiandituAPI();
        
        // 验证API是否可用
        if (typeof T === 'undefined') {
            throw new Error('天地图API加载失败，请检查网络连接');
        }
        
        console.log('✓ 天地图API验证通过，开始初始化地图');
        await window.mapManager.init();
        this.modules.mapManager = window.mapManager;
    }

    // 等待天地图API加载
    async waitForTiandituAPI() {
        const maxWaitTime = 30000; // 最大等待30秒
        const checkInterval = 500;  // 每500ms检查一次
        let waitTime = 0;
        
        console.log('⏳ 等待天地图API加载...');
        
        return new Promise((resolve, reject) => {
            const checkAPI = () => {
                waitTime += checkInterval;
                
                if (window.tiandituLoadStatus.loaded && typeof T !== 'undefined') {
                    console.log('✅ 天地图API加载完成');
                    resolve();
                } else if (window.tiandituLoadStatus.error) {
                    console.error('❌ 天地图API加载失败');
                    reject(new Error('天地图API加载失败'));
                } else if (waitTime >= maxWaitTime) {
                    console.error('⏰ 天地图API加载超时');
                    reject(new Error('地图API加载超时，请检查网络连接'));
                } else {
                    setTimeout(checkAPI, checkInterval);
                }
            };
            
            checkAPI();
        });
    }

    // 初始化定位服务
    async initLocation() {
        this.updateLoadingMessage('启动定位服务...');
        const success = await window.locationManager.init();
        if (success) {
            this.modules.locationManager = window.locationManager;
        } else {
            console.warn('定位服务初始化失败，将使用离线模式');
        }
    }

    // 初始化天气服务
    async initWeather() {
        this.updateLoadingMessage('获取天气信息...');
        await window.weatherManager.init();
        this.modules.weatherManager = window.weatherManager;
    }
    
    // 初始化AI助手
    async initAIAssistant() {
        this.updateLoadingMessage('初始化AI助手...');
        const success = await window.aiAssistant.init();
        if (success) {
            this.modules.aiAssistant = window.aiAssistant;
        } else {
            console.warn('AI助手初始化失败，将使用基础功能');
        }
    }
    
    // 初始化导航管理器
    async initNavigationManager() {
        this.updateLoadingMessage('初始化导航系统...');
        const success = await window.navigationManager.init();
        if (success) {
            this.modules.navigationManager = window.navigationManager;
        } else {
            console.warn('导航管理器初始化失败');
        }
    }
    
    // 初始化路况监控
    async initTrafficMonitor() {
        this.updateLoadingMessage('启动路况监控...');
        const success = await window.trafficMonitor.init();
        if (success) {
            this.modules.trafficMonitor = window.trafficMonitor;
        } else {
            console.warn('路况监控初始化失败');
        }
    }

    // 更新加载消息
    updateLoadingMessage(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            const messageElement = loadingScreen.querySelector('p:last-child');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }
    }

    // 设置应用状态监控
    setupAppStateMonitoring() {
        // 网络状态监控
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);

        // 页面卸载前保存数据
        window.addEventListener('beforeunload', this.handleBeforeUnload);

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // 低电量警告
        if ('getBattery' in navigator) {
            navigator.getBattery().then((battery) => {
                battery.addEventListener('levelchange', () => {
                    this.handleBatteryLevelChange(battery.level);
                });
                
                // 初始电量检查
                this.handleBatteryLevelChange(battery.level);
            });
        }
    }

    // 启动AI决策循环
    async startAIDecisionCycle() {
        console.log('启动AI决策循环...');
        
        // 立即执行一次评估
        await this.executeAIDecisionCycle();
        
        // 设置定时循环
        setInterval(async () => {
            await this.executeAIDecisionCycle();
        }, CONFIG.AI.EVALUATION_INTERVAL);
    }

    // 执行AI决策循环
    async executeAIDecisionCycle() {
        try {
            if (!this.isInitialized) {
                return;
            }

            console.log('执行AI决策评估...');

            // 收集实时数据
            const currentData = await this.collectRealTimeData();
            
            // 分析当前状态
            const analysis = await this.analyzeCurrentState(currentData);
            
            // 生成决策建议
            const suggestions = await this.generateAISuggestions(analysis);
            
            // 执行自动决策
            await this.executeAutomaticDecisions(suggestions);
            
            // 更新UI显示
            this.updateAIDisplay(suggestions);

        } catch (error) {
            console.error('AI决策循环执行失败:', error);
        }
    }

    // 收集实时数据
    async collectRealTimeData() {
        const data = {
            timestamp: new Date().toISOString(),
            location: null,
            weather: null,
            trip: null,
            user: null,
            environment: {
                battery: null,
                network: navigator.onLine,
                visibility: document.visibilityState
            }
        };

        // 获取位置数据
        if (this.modules.locationManager) {
            data.location = this.modules.locationManager.getCurrentPositionData();
        }

        // 获取天气数据
        if (this.modules.weatherManager) {
            data.weather = this.modules.weatherManager.getCurrentWeatherData();
        }

        // 获取行程数据
        if (this.modules.dataManager && this.modules.dataManager.tripManager) {
            data.trip = this.modules.dataManager.tripManager.currentTrip;
        }

        // 获取用户配置
        if (this.modules.dataManager && this.modules.dataManager.userManager) {
            data.user = this.modules.dataManager.userManager.config;
        }

        // 获取电量信息
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                data.environment.battery = battery.level;
            } catch (error) {
                console.warn('获取电量信息失败:', error);
            }
        }

        return data;
    }

    // 分析当前状态
    async analyzeCurrentState(data) {
        const analysis = {
            progress: null,
            risk: null,
            opportunity: null,
            recommendations: []
        };

        // 分析行程进度
        if (data.trip && data.user) {
            analysis.progress = this.analyzeTripProgress(data.trip, data.user);
        }

        // 分析风险因素
        analysis.risk = this.analyzeRiskFactors(data);

        // 分析机会
        analysis.opportunity = this.analyzeOpportunities(data);

        return analysis;
    }

    // 分析行程进度
    analyzeTripProgress(trip, user) {
        const targetDistance = user.ridingPreferences?.dailyDistance || 120;
        const completionRate = (trip.todayDistance / targetDistance) * 100;
        
        return {
            completionRate: Math.round(completionRate),
            isAhead: completionRate > 80,
            isBehind: completionRate < 50,
            averageSpeed: trip.averageSpeed,
            distance: trip.todayDistance,
            targetDistance: targetDistance
        };
    }

    // 分析风险因素
    analyzeRiskFactors(data) {
        const risks = [];
        
        // 天气风险
        if (data.weather && this.modules.weatherManager) {
            if (!this.modules.weatherManager.isGoodForRiding()) {
                risks.push({
                    type: 'weather',
                    level: 'high',
                    description: '天气条件不适合骑行'
                });
            }
        }

        // 电量风险
        if (data.environment.battery !== null && data.environment.battery < 0.2) {
            risks.push({
                type: 'battery',
                level: 'medium',
                description: '设备电量较低'
            });
        }

        // 网络风险
        if (!data.environment.network) {
            risks.push({
                type: 'network',
                level: 'low',
                description: '网络连接已断开'
            });
        }

        // 体力风险
        if (data.trip && data.trip.restStops.length > 10) {
            risks.push({
                type: 'fatigue',
                level: 'medium',
                description: '休息次数较多，可能体力不足'
            });
        }

        return risks;
    }

    // 分析机会
    analyzeOpportunities(data) {
        const opportunities = [];
        
        // 天气良好
        if (data.weather && this.modules.weatherManager && this.modules.weatherManager.isGoodForRiding()) {
            opportunities.push({
                type: 'weather',
                description: '天气条件良好，适合加速骑行'
            });
        }

        // 进度超前
        if (data.trip && data.trip.todayDistance > 100) {
            opportunities.push({
                type: 'progress',
                description: '进度良好，可考虑升级住宿或增加行程'
            });
        }

        return opportunities;
    }

    // 生成AI建议
    async generateAISuggestions(analysis) {
        const suggestions = [];

        // 基于进度分析生成建议
        if (analysis.progress) {
            if (analysis.progress.isBehind) {
                suggestions.push({
                    type: CONFIG.AI_SUGGESTION_TYPES.SPEED_ADJUSTMENT,
                    title: '进度落后',
                    content: '当前进度较慢，建议适当提高速度或延长骑行时间',
                    priority: 'medium',
                    autoExecute: false
                });
            } else if (analysis.progress.isAhead) {
                suggestions.push({
                    type: CONFIG.AI_SUGGESTION_TYPES.ACCOMMODATION_CHANGE,
                    title: '进度超前',
                    content: '今日进度很好，可考虑升级住宿条件',
                    priority: 'low',
                    autoExecute: false
                });
            }
        }

        // 基于风险因素生成建议
        if (analysis.risk && analysis.risk.length > 0) {
            analysis.risk.forEach(risk => {
                if (risk.type === 'weather') {
                    suggestions.push({
                        type: CONFIG.AI_SUGGESTION_TYPES.WEATHER_WARNING,
                        title: '天气预警',
                        content: risk.description,
                        priority: 'high',
                        autoExecute: false
                    });
                } else if (risk.type === 'battery') {
                    suggestions.push({
                        type: CONFIG.AI_SUGGESTION_TYPES.SPEED_ADJUSTMENT,
                        title: '电量优化',
                        content: '设备电量较低，已启用省电模式',
                        priority: 'medium',
                        autoExecute: true
                    });
                }
            });
        }

        // 生成休息建议
        const now = new Date();
        const hours = now.getHours();
        if (hours >= 12 && hours <= 14) {
            suggestions.push({
                type: CONFIG.AI_SUGGESTION_TYPES.REST_RECOMMENDATION,
                title: '午餐时间',
                content: '建议在附近用餐休息，补充体力',
                priority: 'low',
                autoExecute: false
            });
        }

        return suggestions;
    }

    // 执行自动决策
    async executeAutomaticDecisions(suggestions) {
        for (const suggestion of suggestions) {
            if (suggestion.autoExecute) {
                await this.executeSuggestion(suggestion);
            }
        }
    }

    // 执行建议
    async executeSuggestion(suggestion) {
        try {
            switch (suggestion.type) {
                case CONFIG.AI_SUGGESTION_TYPES.SPEED_ADJUSTMENT:
                    if (suggestion.title === '电量优化' && this.modules.locationManager) {
                        this.modules.locationManager.enableBatterySavingMode();
                    }
                    break;
                default:
                    console.log('自动执行建议:', suggestion.title);
            }
        } catch (error) {
            console.error('执行建议失败:', error);
        }
    }

    // 更新AI显示
    updateAIDisplay(suggestions) {
        if (suggestions.length === 0) {
            this.updateAISuggestion({
                type: 'status',
                title: '状态良好',
                content: '一切正常，继续保持当前节奏',
                priority: 'low',
                autoExecute: false
            });
            return;
        }

        // 显示优先级最高的建议
        const topSuggestion = suggestions.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        })[0];

        this.updateAISuggestion(topSuggestion);
    }

    // 更新AI建议显示
    updateAISuggestion(suggestion) {
        const contentElement = document.getElementById('suggestion-content');
        const acceptBtn = document.getElementById('accept-suggestion');
        const modifyBtn = document.getElementById('modify-suggestion');

        if (contentElement) {
            contentElement.innerHTML = `
                <div class="suggestion-item">
                    <h4 style="margin: 0 0 8px 0; color: #fff;">${suggestion.title}</h4>
                    <p style="margin: 0; font-size: 14px; opacity: 0.9;">${suggestion.content}</p>
                    <div style="margin-top: 8px;">
                        <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                            ${suggestion.priority === 'high' ? '🔴 高优先级' : 
                              suggestion.priority === 'medium' ? '🟡 中优先级' : '🟢 低优先级'}
                        </span>
                    </div>
                </div>
            `;
        }

        if (acceptBtn) {
            acceptBtn.disabled = suggestion.autoExecute;
        }

        if (modifyBtn) {
            modifyBtn.disabled = false;
        }

        // 保存建议到行程数据
        if (this.modules.dataManager && this.modules.dataManager.tripManager) {
            this.modules.dataManager.tripManager.addAISuggestion(suggestion);
        }
    }

    // 显示欢迎消息
    showWelcomeMessage() {
        const isFirstUse = this.modules.dataManager.storage.get('is_first_use_today', true);
        
        if (isFirstUse) {
            this.modules.uiManager.showToast(
                '欢迎使用智能骑行助手！请先检查设备设置和路线规划',
                'info',
                8000
            );
            
            this.modules.dataManager.storage.set('is_first_use_today', false, {
                expire: Date.now() + 24 * 60 * 60 * 1000 // 24小时后过期
            });
        }
    }

    // 事件处理器
    handleOnline() {
        console.log('网络已连接');
        this.modules.uiManager.showToast('网络已连接', 'success', 3000);
    }

    handleOffline() {
        console.log('网络已断开');
        this.modules.uiManager.showToast('网络已断开，使用离线模式', 'warning', 5000);
    }

    handleBeforeUnload(event) {
        // 保存重要数据
        if (this.modules.dataManager) {
            this.modules.dataManager.cleanup();
        }

        // 提示用户保存数据
        const message = '确定要离开吗？请确保数据已保存';
        event.returnValue = message;
        return message;
    }

    handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            // 应用进入后台，降低更新频率
            this.enterBackgroundMode();
        } else {
            // 应用回到前台，恢复正常模式
            this.enterForegroundMode();
        }
    }

    handleBatteryLevelChange(level) {
        if (level < CONFIG.PERFORMANCE.BATTERY_SAVE_MODE_THRESHOLD / 100) {
            this.modules.uiManager.showToast(
                '设备电量较低，已启用省电模式',
                'warning',
                5000
            );
            
            if (this.modules.locationManager) {
                this.modules.locationManager.enableBatterySavingMode();
            }
        }
    }

    // 进入后台模式
    enterBackgroundMode() {
        console.log('应用进入后台模式');
        // 降低更新频率
        // 暂停非必要功能
    }

    // 进入前台模式
    enterForegroundMode() {
        console.log('应用回到前台');
        // 恢复正常更新频率
        // 恢复所有功能
    }

    // 显示错误消息
    showErrorMessage(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    color: #333;
                    padding: 40px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    text-align: center;
                    max-width: 400px;
                ">
                    <div style="font-size: 48px; margin-bottom: 20px; color: #F44336;">❌</div>
                    <h2 style="margin: 0 0 15px 0;">启动失败</h2>
                    <p style="margin: 0 0 20px 0; color: #666;">${message}</p>
                    <button onclick="location.reload()" style="
                        background: #2196F3;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                    ">重新加载</button>
                </div>
            `;
        }
    }

    // 获取应用状态
    getAppStatus() {
        return {
            isInitialized: this.isInitialized,
            modules: Object.keys(this.modules),
            uptime: Date.now() - (this.startTime || Date.now()),
            version: CONFIG.APP.VERSION
        };
    }

    // 销毁应用
    destroy() {
        // 清理定时器
        if (this.aiDecisionTimer) {
            clearInterval(this.aiDecisionTimer);
        }

        // 清理事件监听器
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        window.removeEventListener('beforeunload', this.handleBeforeUnload);

        // 清理模块
        Object.values(this.modules).forEach(module => {
            if (module.destroy && typeof module.destroy === 'function') {
                module.destroy();
            }
        });

        this.isInitialized = false;
        this.modules = {};
    }
}

// 创建应用实例
const ridingAssistantApp = new RidingAssistantApp();

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ridingAssistantApp.init();
    } catch (error) {
        console.error('应用启动失败:', error);
    }
});

// 导出应用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RidingAssistantApp;
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.RidingAssistantApp = RidingAssistantApp;
    window.ridingAssistantApp = ridingAssistantApp;
}
// 导航功能模块 - 实时路线规划、转向提示、语音导航
class NavigationManager {
    constructor() {
        this.isActive = false;
        this.currentRoute = null;
        this.currentInstruction = null;
        this.navigationPath = [];
        this.waypoints = [];
        this.totalDistance = 0;
        this.remainingDistance = 0;
        this.estimatedTime = 0;
        this.currentSpeed = 0;
        this.voiceEnabled = true;
        this.lastVoiceTime = 0;
        this.voiceInterval = 30000; // 30秒语音间隔
        this.instructionHistory = [];
        
        // 导航状态
        this.navigationState = {
            isNavigating: false,
            currentStepIndex: 0,
            totalSteps: 0,
            nextInstruction: null,
            distanceToNextTurn: 0,
            timeToNextTurn: 0,
            deviation: 0
        };
        
        // 绑定方法
        this.init = this.init.bind(this);
        this.startNavigation = this.startNavigation.bind(this);
        this.updateNavigation = this.updateNavigation.bind(this);
        this.processLocationUpdate = this.processLocationUpdate.bind(this);
    }

    // 初始化导航管理器
    async init() {
        try {
            console.log('🧭 初始化导航管理器...');
            
            // 初始化语音功能
            await this.initVoiceService();
            
            // 绑定事件监听器
            this.bindEventListeners();
            
            console.log('✅ 导航管理器初始化完成');
            return true;
            
        } catch (error) {
            console.error('❌ 导航管理器初始化失败:', error);
            return false;
        }
    }

    // 初始化语音服务
    async initVoiceService() {
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
            this.voiceEnabled = true;
            console.log('✅ 语音导航服务可用');
            
            // 预加载中文语音
            this.loadChineseVoice();
        } else {
            this.voiceEnabled = false;
            console.warn('⚠️ 语音导航服务不可用');
        }
    }

    // 加载中文语音
    loadChineseVoice() {
        const voices = this.speechSynthesis.getVoices();
        this.chineseVoice = voices.find(voice => 
            voice.lang.includes('zh') || voice.lang.includes('CN')
        ) || voices[0]; // 默认语音
        
        console.log(`选择语音: ${this.chineseVoice?.name || '默认'}`);
    }

    // 绑定事件监听器
    bindEventListeners() {
        // 监听语音列表加载
        if ('speechSynthesis' in window) {
            this.speechSynthesis.onvoiceschanged = () => {
                this.loadChineseVoice();
            };
        }
        
        // 监听定位更新事件
        document.addEventListener('locationUpdate', this.processLocationUpdate);
        
        // 监听导航控制按钮
        this.bindNavigationControls();
    }

    // 绑定导航控制
    bindNavigationControls() {
        const startBtn = document.getElementById('start-navigation');
        const stopBtn = document.getElementById('stop-navigation');
        const voiceBtn = document.getElementById('toggle-voice');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startNavigation());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopNavigation());
        }
        
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleVoice());
        }
    }

    // 开始导航
    async startNavigation(destination = null) {
        try {
            console.log('🚀 开始导航...');
            
            // 获取路线规划
            const route = await this.planRoute(destination);
            if (!route) {
                throw new Error('路线规划失败');
            }
            
            this.currentRoute = route;
            this.navigationPath = route.path;
            this.waypoints = route.waypoints;
            this.totalDistance = route.totalDistance;
            this.estimatedTime = route.estimatedTime;
            this.remainingDistance = this.totalDistance;
            
            // 初始化导航状态
            this.navigationState = {
                isNavigating: true,
                currentStepIndex: 0,
                totalSteps: this.waypoints.length,
                nextInstruction: this.waypoints[0]?.instruction || '开始导航',
                distanceToNextTurn: this.waypoints[0]?.distance || 0,
                timeToNextTurn: this.waypoints[0]?.time || 0,
                deviation: 0
            };
            
            this.isActive = true;
            this.updateNavigationUI();
            
            // 语音播报开始导航
            this.speak('开始导航，总距离' + Math.round(this.totalDistance) + '公里');
            
            // 启动导航更新循环
            this.startNavigationLoop();
            
            console.log('✅ 导航已开始');
            
            // 触发导航开始事件
            this.dispatchNavigationEvent('navigationStarted', {
                destination: destination,
                totalDistance: this.totalDistance,
                estimatedTime: this.estimatedTime
            });
            
        } catch (error) {
            console.error('❌ 开始导航失败:', error);
            this.showNavigationError(`导航启动失败: ${error.message}`);
        }
    }

    // 停止导航
    stopNavigation() {
        try {
            console.log('⏹️ 停止导航...');
            
            this.isActive = false;
            this.navigationState.isNavigating = false;
            
            // 停止导航循环
            if (this.navigationTimer) {
                clearInterval(this.navigationTimer);
                this.navigationTimer = null;
            }
            
            // 语音播报导航结束
            this.speak('导航结束');
            
            // 清理导航界面
            this.clearNavigationUI();
            
            // 触发导航结束事件
            this.dispatchNavigationEvent('navigationStopped', {
                remainingDistance: this.remainingDistance
            });
            
            console.log('✅ 导航已停止');
            
        } catch (error) {
            console.error('❌ 停止导航失败:', error);
        }
    }

    // 切换语音
    toggleVoice() {
        this.voiceEnabled = !this.voiceEnabled;
        const voiceBtn = document.getElementById('toggle-voice');
        
        if (voiceBtn) {
            voiceBtn.textContent = this.voiceEnabled ? '🔊' : '🔇';
            voiceBtn.title = this.voiceEnabled ? '关闭语音' : '开启语音';
        }
        
        this.showToast(this.voiceEnabled ? '语音导航已开启' : '语音导航已关闭', 'info');
    }

    // 规划路线
    async planRoute(destination = null) {
        try {
            console.log('📍 规划导航路线...');
            
            // 获取当前位置
            const currentPosition = await this.getCurrentPosition();
            if (!currentPosition) {
                throw new Error('无法获取当前位置');
            }
            
            // 使用预配置路线或实时规划
            let route;
            if (destination) {
                // 实时路线规划
                route = await this.calculateRealTimeRoute(currentPosition, destination);
            } else {
                // 使用预配置的宁波-九江路线
                route = this.getPredefinedRoute(currentPosition);
            }
            
            // 调用AI优化路线
            const optimizedRoute = await this.optimizeRouteWithAI(route);
            
            console.log('✅ 路线规划完成');
            return optimizedRoute;
            
        } catch (error) {
            console.error('❌ 路线规划失败:', error);
            throw error;
        }
    }

    // 获取当前位置
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        });
                    },
                    error => reject(error),
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 1000
                    }
                );
            } else {
                reject(new Error('浏览器不支持地理定位'));
            }
        });
    }

    // 实时路线规划
    async calculateRealTimeRoute(start, destination) {
        // 这里可以集成天地图或高德地图的路径规划API
        // 目前使用简化的直线距离计算
        
        const distance = this.calculateDistance(start, destination);
        const estimatedTime = distance / 15; // 假设平均15km/h
        
        return {
            start: start,
            destination: destination,
            path: [start, destination],
            waypoints: [
                {
                    location: start,
                    instruction: '从当前位置出发',
                    distance: 0,
                    time: 0,
                    type: 'start'
                },
                {
                    location: destination,
                    instruction: '到达目的地',
                    distance: distance,
                    time: estimatedTime * 3600, // 转换为秒
                    type: 'end'
                }
            ],
            totalDistance: distance,
            estimatedTime: estimatedTime * 3600
        };
    }

    // 获取预定义路线
    getPredefinedRoute(currentPosition) {
        const route = CONFIG.ROUTE;
        
        // 根据当前位置找到最近的路线点
        const nearestPoint = this.findNearestRoutePoint(currentPosition);
        const startIndex = route.WAYPOINTS.findIndex(wp => 
            Math.abs(wp.distance - nearestPoint.distance) < 50
        );
        
        const remainingWaypoints = startIndex >= 0 ? 
            route.WAYPOINTS.slice(startIndex) : route.WAYPOINTS;
        
        // 构建路径点
        const waypoints = [
            {
                location: currentPosition,
                instruction: '从当前位置继续',
                distance: 0,
                time: 0,
                type: 'current'
            }
        ];
        
        remainingWaypoints.forEach((wp, index) => {
            const prevPoint = index === 0 ? currentPosition : remainingWaypoints[index - 1].coords;
            const distance = this.calculateDistance(prevPoint, wp.coords);
            const time = distance / 15 * 3600; // 转换为秒
            
            waypoints.push({
                location: wp.coords,
                instruction: `前往${wp.name}`,
                distance: distance,
                time: time,
                type: 'waypoint',
                name: wp.name
            });
        });
        
        // 添加终点
        const lastWaypoint = remainingWaypoints[remainingWaypoints.length - 1];
        const finalDistance = this.calculateDistance(lastWaypoint.coords, route.END.coords);
        waypoints.push({
            location: route.END.coords,
            instruction: `到达${route.END.name}`,
            distance: finalDistance,
            time: finalDistance / 15 * 3600,
            type: 'end',
            name: route.END.name
        });
        
        // 计算总距离和时间
        const totalDistance = waypoints.reduce((sum, wp) => sum + wp.distance, 0);
        const estimatedTime = waypoints.reduce((sum, wp) => sum + wp.time, 0);
        
        return {
            start: currentPosition,
            destination: route.END.coords,
            path: [currentPosition, ...waypoints.slice(1).map(wp => wp.location)],
            waypoints: waypoints,
            totalDistance: totalDistance,
            estimatedTime: estimatedTime
        };
    }

    // 找到最近的路线点
    findNearestRoutePoint(currentPosition) {
        let minDistance = Infinity;
        let nearestPoint = CONFIG.ROUTE.WAYPOINTS[0];
        
        CONFIG.ROUTE.WAYPOINTS.forEach(wp => {
            const distance = this.calculateDistance(currentPosition, wp.coords);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPoint = wp;
            }
        });
        
        return nearestPoint;
    }

    // 使用AI优化路线
    async optimizeRouteWithAI(route) {
        try {
            const prompt = `
                作为智能骑行助手，请优化这条骑行路线：
                
                起点: ${route.start.lat.toFixed(4)}, ${route.start.lng.toFixed(4)}
                终点: ${route.destination.lat.toFixed(4)}, ${route.destination.lng.toFixed(4)}
                总距离: ${Math.round(route.totalDistance)}km
                预计时间: ${Math.round(route.estimatedTime / 3600)}小时
                
                路线途经点:
                ${route.waypoints.map((wp, i) => `${i + 1}. ${wp.name || wp.instruction} - ${Math.round(wp.distance)}km`).join('\n')}
                
                请考虑以下因素优化：
                1. 骑行安全
                2. 路况质量
                3. 天气条件
                4. 体力消耗
                5. 休息点安排
                
                返回JSON格式的优化建议：
                {
                    "riskLevel": "low|medium|high",
                    "suggestions": ["建议1", "建议2"],
                    "optimizedWaypoints": [
                        {"index": 0, "restRecommended": false, "weatherWarning": ""},
                        ...
                    ],
                    "estimatedDifficulty": 1-10,
                    "recommendedDepartureTime": "HH:MM"
                }
            `;
            
            const response = await this.callDeepSeekAPI(prompt);
            const optimization = JSON.parse(response);
            
            // 应用优化建议到路线
            this.applyOptimizations(route, optimization);
            
            return route;
            
        } catch (error) {
            console.warn('AI路线优化失败，使用原始路线:', error);
            return route;
        }
    }

    // 应用AI优化
    applyOptimizations(route, optimization) {
        route.optimization = optimization;
        route.riskLevel = optimization.riskLevel;
        route.difficulty = optimization.estimatedDifficulty;
        
        // 应用个性化建议
        optimization.optimizedWaypoints.forEach((wp, index) => {
            if (index < route.waypoints.length) {
                route.waypoints[index].restRecommended = wp.restRecommended;
                route.waypoints[index].weatherWarning = wp.weatherWarning;
            }
        });
    }

    // 调用DeepSeek API
    async callDeepSeekAPI(prompt) {
        try {
            const response = await fetch(`${CONFIG.API.DEEPSEEK.BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.API.DEEPSEEK.API_KEY}`
                },
                body: JSON.stringify({
                    model: CONFIG.API.DEEPSEEK.MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的骑行导航助手，擅长路线规划和骑行指导。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: CONFIG.API.DEEPSEEK.MAX_TOKENS,
                    temperature: CONFIG.API.DEEPSEEK.TEMPERATURE
                })
            });
            
            const data = await response.json();
            return data.choices[0].message.content;
            
        } catch (error) {
            console.error('DeepSeek API调用失败:', error);
            throw error;
        }
    }

    // 启动导航更新循环
    startNavigationLoop() {
        if (this.navigationTimer) {
            clearInterval(this.navigationTimer);
        }
        
        this.navigationTimer = setInterval(() => {
            if (this.isActive) {
                this.updateNavigation();
            }
        }, 1000); // 每秒更新一次
    }

    // 更新导航
    async updateNavigation() {
        try {
            if (!this.isActive) return;
            
            // 获取当前位置
            const currentPosition = await this.getCurrentPosition();
            if (!currentPosition) return;
            
            // 更新导航状态
            this.updateNavigationState(currentPosition);
            
            // 检查转向提醒
            this.checkTurnInstructions(currentPosition);
            
            // 更新UI
            this.updateNavigationUI();
            
            // 检查是否到达目的地
            if (this.checkDestinationReached(currentPosition)) {
                this.onDestinationReached();
            }
            
        } catch (error) {
            console.error('导航更新失败:', error);
        }
    }

    // 更新导航状态
    updateNavigationState(currentPosition) {
        // 计算到下一个转向点的距离
        if (this.navigationState.currentStepIndex < this.waypoints.length) {
            const nextWaypoint = this.waypoints[this.navigationState.currentStepIndex];
            const distance = this.calculateDistance(currentPosition, nextWaypoint.location);
            
            this.navigationState.distanceToNextTurn = distance;
            this.navigationState.timeToNextTurn = distance / (this.currentSpeed || 15) * 3600; // 秒
            
            // 检查是否需要切换到下一个导航点
            if (distance < 20) { // 20米内认为到达
                this.navigationState.currentStepIndex++;
                if (this.navigationState.currentStepIndex < this.waypoints.length) {
                    const nextNextWaypoint = this.waypoints[this.navigationState.currentStepIndex];
                    this.navigationState.nextInstruction = nextNextWaypoint.instruction;
                }
            }
        }
        
        // 更新剩余距离
        this.remainingDistance = this.calculateRemainingDistance(currentPosition);
    }

    // 检查转向提醒
    checkTurnInstructions(currentPosition) {
        const { distanceToNextTurn, nextInstruction } = this.navigationState;
        const currentTime = Date.now();
        
        // 根据距离决定语音提醒时机
        let shouldSpeak = false;
        let message = '';
        
        if (distanceToNextTurn < 50 && distanceToNextTurn > 45) {
            message = '前方50米' + nextInstruction;
            shouldSpeak = true;
        } else if (distanceToNextTurn < 200 && distanceToNextTurn > 190 && currentTime - this.lastVoiceTime > 30000) {
            message = '前方200米' + nextInstruction;
            shouldSpeak = true;
        } else if (distanceToNextTurn < 500 && distanceToNextTurn > 490 && currentTime - this.lastVoiceTime > 60000) {
            message = '前方500米' + nextInstruction;
            shouldSpeak = true;
        }
        
        if (shouldSpeak && this.voiceEnabled) {
            this.speak(message);
            this.lastVoiceTime = currentTime;
        }
    }

    // 更新导航UI
    updateNavigationUI() {
        // 更新导航信息显示
        const navDistance = document.getElementById('nav-distance');
        const navTime = document.getElementById('nav-time');
        const navInstruction = document.getElementById('nav-instruction');
        const navSpeed = document.getElementById('nav-speed');
        
        if (navDistance) {
            navDistance.textContent = `${Math.round(this.remainingDistance)}km`;
        }
        
        if (navTime) {
            const hours = Math.floor(this.navigationState.timeToNextTurn / 3600);
            const minutes = Math.floor((this.navigationState.timeToNextTurn % 3600) / 60);
            navTime.textContent = hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;
        }
        
        if (navInstruction) {
            navInstruction.textContent = this.navigationState.nextInstruction || '继续前行';
        }
        
        if (navSpeed) {
            navSpeed.textContent = `${Math.round(this.currentSpeed)}km/h`;
        }
        
        // 更新地图上的导航箭头
        this.updateNavigationArrow();
    }

    // 更新导航箭头
    updateNavigationArrow() {
        if (!window.mapManager || !window.mapManager.map) return;
        
        // 在地图上显示当前转向箭头
        // 这里需要根据具体的地图API实现
    }

    // 检查是否到达目的地
    checkDestinationReached(currentPosition) {
        const destination = this.currentRoute?.destination;
        if (!destination) return false;
        
        const distance = this.calculateDistance(currentPosition, destination);
        return distance < 30; // 30米内认为到达
    }

    // 到达目的地
    onDestinationReached() {
        console.log('🎉 到达目的地');
        
        this.speak('恭喜您到达目的地');
        this.stopNavigation();
        
        // 显示到达提示
        this.showDestinationReachedDialog();
        
        // 触发事件
        this.dispatchNavigationEvent('destinationReached', {
            totalDistance: this.totalDistance,
            actualTime: Date.now() - this.navigationStartTime
        });
    }

    // 处理定位更新
    processLocationUpdate(event) {
        if (!this.isActive) return;
        
        const { position } = event.detail;
        this.currentSpeed = position.speed || 0;
        
        // 更新地图上的当前位置
        if (window.mapManager) {
            window.mapManager.updateCurrentLocation(position);
        }
    }

    // 语音播报
    speak(text) {
        if (!this.voiceEnabled || !this.speechSynthesis) return;
        
        try {
            // 取消当前播放
            this.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            
            if (this.chineseVoice) {
                utterance.voice = this.chineseVoice;
            }
            
            this.speechSynthesis.speak(utterance);
            console.log('🔊 语音播报:', text);
            
        } catch (error) {
            console.error('语音播报失败:', error);
        }
    }

    // 计算两点间距离
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

    // 计算剩余距离
    calculateRemainingDistance(currentPosition) {
        let remainingDistance = 0;
        
        // 从当前位置到下一个导航点
        if (this.navigationState.currentStepIndex < this.waypoints.length) {
            const nextWaypoint = this.waypoints[this.navigationState.currentStepIndex];
            remainingDistance += this.calculateDistance(currentPosition, nextWaypoint.location);
            
            // 从下一个导航点到终点的距离
            for (let i = this.navigationState.currentStepIndex + 1; i < this.waypoints.length; i++) {
                const current = this.waypoints[i - 1].location;
                const next = this.waypoints[i].location;
                remainingDistance += this.calculateDistance(current, next);
            }
        }
        
        return remainingDistance;
    }

    // 清除导航UI
    clearNavigationUI() {
        const navDistance = document.getElementById('nav-distance');
        const navTime = document.getElementById('nav-time');
        const navInstruction = document.getElementById('nav-instruction');
        const navSpeed = document.getElementById('nav-speed');
        
        if (navDistance) navDistance.textContent = '--km';
        if (navTime) navTime.textContent = '--:--';
        if (navInstruction) navInstruction.textContent = '未开始导航';
        if (navSpeed) navSpeed.textContent = '--km/h';
    }

    // 显示导航错误
    showNavigationError(message) {
        if (window.uiManager) {
            window.uiManager.showToast(message, 'error', 5000);
        } else {
            alert(message);
        }
    }

    // 显示到达提示
    showDestinationReachedDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'nav-completion-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>🎉 到达目的地</h2>
                <p>总距离: ${Math.round(this.totalDistance)}km</p>
                <p>实际用时: ${Math.round((Date.now() - this.navigationStartTime) / 60000)}分钟</p>
                <button onclick="this.parentElement.parentElement.remove()">确定</button>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    // 显示提示信息
    showToast(message, type = 'info') {
        if (window.uiManager) {
            window.uiManager.showToast(message, type, 3000);
        }
    }

    // 派发导航事件
    dispatchNavigationEvent(eventName, data) {
        const event = new CustomEvent(eventName, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    // 获取导航状态
    getNavigationStatus() {
        return {
            isActive: this.isActive,
            currentRoute: this.currentRoute,
            navigationState: this.navigationState,
            remainingDistance: this.remainingDistance,
            currentSpeed: this.currentSpeed,
            voiceEnabled: this.voiceEnabled
        };
    }

    // 销毁导航管理器
    destroy() {
        this.stopNavigation();
        
        // 清理定时器
        if (this.navigationTimer) {
            clearInterval(this.navigationTimer);
            this.navigationTimer = null;
        }
        
        // 清理语音
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
        
        // 移除事件监听器
        document.removeEventListener('locationUpdate', this.processLocationUpdate);
        
        console.log('导航管理器已销毁');
    }
}

// 创建导航管理器实例
const navigationManager = new NavigationManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.NavigationManager = NavigationManager;
    window.navigationManager = navigationManager;
}
// UI管理模块
class UIManager {
    constructor() {
        this.isFullscreen = false;
        this.visiblePanels = new Set();
        this.touchStartY = 0;
        this.touchStartX = 0;
        
        // 绑定方法
        this.init = this.init.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }

    // 初始化UI
    async init() {
        console.log('初始化UI管理器...');
        
        // 绑定事件监听器
        this.bindEventListeners();
        
        // 初始化UI状态
        this.initializeUIState();
        
        // 设置触摸手势支持
        this.setupTouchGestures();
        
        // 检查网络状态
        this.setupNetworkMonitoring();
        
        // 监听系统主题
        this.setupThemeMonitoring();
        
        console.log('UI管理器初始化完成');
    }

    // 绑定事件监听器
    bindEventListeners() {
        // 地图控制按钮
        this.bindMapControls();
        
        // 底部控制按钮
        this.bindBottomControls();
        
        // 面板控制
        this.bindPanelControls();
        
        // 系统事件
        this.bindSystemEvents();
        
        // 键盘快捷键
        this.bindKeyboardShortcuts();
    }

    // 绑定地图控制
    bindMapControls() {
        // 回到当前位置
        const currentLocationBtn = document.getElementById('current-location-btn');
        if (currentLocationBtn) {
            currentLocationBtn.addEventListener('click', () => {
                if (window.mapManager) {
                    window.mapManager.goToCurrentLocation();
                }
            });
        }

        // 切换路线显示
        const toggleRouteBtn = document.getElementById('toggle-route-btn');
        if (toggleRouteBtn) {
            toggleRouteBtn.addEventListener('click', () => {
                if (window.mapManager) {
                    window.mapManager.toggleRoute();
                }
            });
        }

        // 切换住宿显示
        const toggleAccommodationBtn = document.getElementById('toggle-accommodation-btn');
        if (toggleAccommodationBtn) {
            toggleAccommodationBtn.addEventListener('click', () => {
                if (window.mapManager) {
                    window.mapManager.toggleAccommodations();
                }
            });
        }

        // 全屏按钮
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
    }

    // 绑定底部控制
    bindBottomControls() {
        // 开始行程
        const startTripBtn = document.getElementById('start-trip');
        if (startTripBtn) {
            startTripBtn.addEventListener('click', () => {
                this.handleStartTrip();
            });
        }

        // 暂停行程
        const pauseTripBtn = document.getElementById('pause-trip');
        if (pauseTripBtn) {
            pauseTripBtn.addEventListener('click', () => {
                this.handlePauseTrip();
            });
        }

        // 休息
        const restStopBtn = document.getElementById('rest-stop');
        if (restStopBtn) {
            restStopBtn.addEventListener('click', () => {
                this.handleRestStop();
            });
        }

        // 设置
        const settingsBtn = document.getElementById('settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsPanel();
            });
        }

        // 历史
        const historyBtn = document.getElementById('history');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                this.showHistoryPanel();
            });
        }
    }

    // 绑定面板控制
    bindPanelControls() {
        // 关闭设置面板
        const closeSettingsBtn = document.getElementById('close-settings');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                this.hideSettingsPanel();
            });
        }

        // 保存设置
        const saveSettingsBtn = document.getElementById('save-settings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // 紧急求助
        const emergencyHelpBtn = document.getElementById('emergency-help');
        if (emergencyHelpBtn) {
            emergencyHelpBtn.addEventListener('click', () => {
                this.showEmergencyPanel();
            });
        }

        // 关闭紧急面板
        const closeEmergencyBtn = document.getElementById('close-emergency');
        if (closeEmergencyBtn) {
            closeEmergencyBtn.addEventListener('click', () => {
                this.hideEmergencyPanel();
            });
        }

        // 采纳AI建议
        const acceptSuggestionBtn = document.getElementById('accept-suggestion');
        if (acceptSuggestionBtn) {
            acceptSuggestionBtn.addEventListener('click', () => {
                this.acceptAISuggestion();
            });
        }

        // 修改AI建议
        const modifySuggestionBtn = document.getElementById('modify-suggestion');
        if (modifySuggestionBtn) {
            modifySuggestionBtn.addEventListener('click', () => {
                this.modifyAISuggestion();
            });
        }

        // 刷新天气
        const refreshWeatherBtn = document.getElementById('refresh-weather');
        if (refreshWeatherBtn) {
            refreshWeatherBtn.addEventListener('click', () => {
                if (window.weatherManager) {
                    window.weatherManager.refresh();
                }
            });
        }

        // 查找住宿
        const findAccommodationBtn = document.getElementById('find-accommodation');
        if (findAccommodationBtn) {
            findAccommodationBtn.addEventListener('click', () => {
                this.findNearbyAccommodation();
            });
        }
    }

    // 绑定系统事件
    bindSystemEvents() {
        // 监听位置更新
        document.addEventListener('positionUpdate', (event) => {
            this.updateProgressDisplay(event.detail.position);
        });

        // 监听地图加载完成
        document.addEventListener('mapLoaded', (event) => {
            this.onMapLoaded();
        });

        // 监听网络状态变化
        window.addEventListener('online', () => {
            this.showNetworkStatus('online');
        });

        window.addEventListener('offline', () => {
            this.showNetworkStatus('offline');
        });

        // 监听电量变化
        if ('getBattery' in navigator) {
            navigator.getBattery().then((battery) => {
                battery.addEventListener('levelchange', () => {
                    this.updateBatteryStatus(battery.level);
                });
                
                // 初始电量显示
                this.updateBatteryStatus(battery.level);
            });
        }
    }

    // 绑定键盘快捷键
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // 防止在输入框中触发快捷键
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (event.key) {
                case 'F11':
                    event.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'Escape':
                    this.hideAllPanels();
                    break;
                case 's':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        this.showSettingsPanel();
                    }
                    break;
                case 'h':
                    this.showHistoryPanel();
                    break;
                case 'e':
                    this.showEmergencyPanel();
                    break;
            }
        });
    }

    // 设置触摸手势
    setupTouchGestures() {
        document.addEventListener('touchstart', this.handleTouchStart, { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    }

    // 触摸开始
    handleTouchStart(event) {
        this.touchStartY = event.touches[0].clientY;
        this.touchStartX = event.touches[0].clientX;
    }

    // 触摸结束
    handleTouchEnd(event) {
        if (!this.touchStartY || !this.touchStartX) return;

        const touchEndY = event.changedTouches[0].clientY;
        const touchEndX = event.changedTouches[0].clientX;

        const deltaY = touchEndY - this.touchStartY;
        const deltaX = touchEndX - this.touchStartX;

        // 垂直滑动检测
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
            if (deltaY > 0) {
                // 向下滑动
                this.handleSwipeDown();
            } else {
                // 向上滑动
                this.handleSwipeUp();
            }
        }

        this.touchStartY = 0;
        this.touchStartX = 0;
    }

    // 处理向上滑动
    handleSwipeUp() {
        // 可以用来显示更多面板或执行其他操作
    }

    // 处理向下滑动
    handleSwipeDown() {
        // 可以用来隐藏面板或执行其他操作
    }

    // 设置网络监控
    setupNetworkMonitoring() {
        this.showNetworkStatus(navigator.onLine ? 'online' : 'offline');
    }

    // 设置主题监控
    setupThemeMonitoring() {
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            darkModeQuery.addListener((e) => {
                document.documentElement.classList.toggle('dark-mode', e.matches);
            });
            
            // 初始主题设置
            document.documentElement.classList.toggle('dark-mode', darkModeQuery.matches);
        }
    }

    // 初始化UI状态
    initializeUIState() {
        // 初始化按钮状态
        this.updateTripControlButtons(false);
        
        // 初始化进度显示
        this.updateProgressDisplay(null);
        
        // 初始化时间显示
        this.updateTimeDisplay();
        
        // 启动时间更新定时器
        setInterval(() => {
            this.updateTimeDisplay();
        }, 60000); // 每分钟更新一次
    }

    // 地图加载完成
    onMapLoaded() {
        console.log('地图加载完成，更新UI');
        // 可以在这里添加地图加载完成后的UI更新
    }

    // 处理开始行程
    async handleStartTrip() {
        try {
            if (window.dataManager && window.dataManager.tripManager) {
                await window.dataManager.tripManager.startTrip();
                this.updateTripControlButtons(true);
                this.showToast('行程已开始', 'success');
                
                // 开始定位跟踪
                if (window.locationManager) {
                    window.locationManager.startTracking();
                }
            }
        } catch (error) {
            console.error('开始行程失败:', error);
            this.showToast('开始行程失败', 'error');
        }
    }

    // 处理暂停行程
    async handlePauseTrip() {
        try {
            if (window.dataManager && window.dataManager.tripManager) {
                const trip = window.dataManager.tripManager.currentTrip;
                
                if (trip.status === CONFIG.TRIP_STATUS.ACTIVE) {
                    await window.dataManager.tripManager.pauseTrip();
                    this.updateTripControlButtons(false);
                    this.showToast('行程已暂停', 'info');
                } else if (trip.status === CONFIG.TRIP_STATUS.PAUSED) {
                    await window.dataManager.tripManager.resumeTrip();
                    this.updateTripControlButtons(true);
                    this.showToast('行程已继续', 'success');
                }
            }
        } catch (error) {
            console.error('暂停/继续行程失败:', error);
            this.showToast('操作失败', 'error');
        }
    }

    // 处理休息停止
    async handleRestStop() {
        try {
            if (window.dataManager && window.dataManager.tripManager) {
                const restStop = {
                    type: 'rest',
                    reason: 'manual',
                    duration: 0,
                    location: window.locationManager ? window.locationManager.getCurrentPositionData() : null
                };
                
                await window.dataManager.tripManager.addRestStop(restStop);
                this.showToast('休息记录已添加', 'success');
                
                // 显示休息面板（可选）
                this.showRestPanel();
            }
        } catch (error) {
            console.error('添加休息记录失败:', error);
            this.showToast('添加休息记录失败', 'error');
        }
    }

    // 显示设置面板
    showSettingsPanel() {
        const panel = document.getElementById('settings-panel');
        if (panel) {
            // 加载当前设置
            this.loadSettingsToForm();
            panel.style.display = 'flex';
            this.visiblePanels.add('settings');
        }
    }

    // 隐藏设置面板
    hideSettingsPanel() {
        const panel = document.getElementById('settings-panel');
        if (panel) {
            panel.style.display = 'none';
            this.visiblePanels.delete('settings');
        }
    }

    // 加载设置到表单
    loadSettingsToForm() {
        if (!window.dataManager || !window.dataManager.userManager) {
            return;
        }

        const config = window.dataManager.userManager.config;

        // 加载基础设置
        const dailyBudgetInput = document.getElementById('daily-budget');
        if (dailyBudgetInput) {
            dailyBudgetInput.value = config.dailyBudget || 100;
        }

        const startTimeInput = document.getElementById('preferred-start-time');
        if (startTimeInput) {
            startTimeInput.value = config.preferredStartTime || '08:00';
        }

        const styleSelect = document.getElementById('riding-style');
        if (styleSelect) {
            styleSelect.value = config.ridingStyle || 'balanced';
        }

        const accommodationSelect = document.getElementById('accommodation-type');
        if (accommodationSelect) {
            accommodationSelect.value = config.accommodationType || 'budget';
        }

        const autoAdjustmentCheckbox = document.getElementById('auto-adjustment');
        if (autoAdjustmentCheckbox) {
            autoAdjustmentCheckbox.checked = config.autoAdjustment !== false;
        }

        const emergencyContactInput = document.getElementById('emergency-contact');
        if (emergencyContactInput) {
            emergencyContactInput.value = config.emergencyContacts && config.emergencyContacts.length > 0 
                ? config.emergencyContacts[0].phone 
                : '';
        }
    }

    // 保存设置
    saveSettings() {
        try {
            if (!window.dataManager || !window.dataManager.userManager) {
                throw new Error('数据管理器未初始化');
            }

            const updates = {};

            // 获取表单数据
            const dailyBudgetInput = document.getElementById('daily-budget');
            if (dailyBudgetInput) {
                updates.dailyBudget = parseInt(dailyBudgetInput.value) || 100;
            }

            const startTimeInput = document.getElementById('preferred-start-time');
            if (startTimeInput) {
                updates.preferredStartTime = startTimeInput.value;
            }

            const styleSelect = document.getElementById('riding-style');
            if (styleSelect) {
                updates.ridingStyle = styleSelect.value;
            }

            const accommodationSelect = document.getElementById('accommodation-type');
            if (accommodationSelect) {
                updates.accommodationType = accommodationSelect.value;
            }

            const autoAdjustmentCheckbox = document.getElementById('auto-adjustment');
            if (autoAdjustmentCheckbox) {
                updates.autoAdjustment = autoAdjustmentCheckbox.checked;
            }

            // 保存设置
            window.dataManager.userManager.updateConfig(updates);
            
            this.hideSettingsPanel();
            this.showToast('设置已保存', 'success');

        } catch (error) {
            console.error('保存设置失败:', error);
            this.showToast('保存设置失败', 'error');
        }
    }

    // 显示历史面板
    showHistoryPanel() {
        // 实现历史面板显示逻辑
        this.showToast('历史功能开发中', 'info');
    }

    // 显示紧急面板
    showEmergencyPanel() {
        const panel = document.getElementById('emergency-panel');
        if (panel) {
            // 更新当前位置信息
            this.updateEmergencyLocation();
            panel.style.display = 'flex';
            this.visiblePanels.add('emergency');
        }
    }

    // 隐藏紧急面板
    hideEmergencyPanel() {
        const panel = document.getElementById('emergency-panel');
        if (panel) {
            panel.style.display = 'none';
            this.visiblePanels.delete('emergency');
        }
    }

    // 更新紧急位置信息
    updateEmergencyLocation() {
        const coordsElement = document.getElementById('emergency-coords');
        if (coordsElement && window.locationManager) {
            const position = window.locationManager.getCurrentPositionData();
            if (position) {
                coordsElement.textContent = `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
            } else {
                coordsElement.textContent = '位置获取中...';
            }
        }
    }

    // 显示休息面板
    showRestPanel() {
        // 实现休息面板显示逻辑
        this.showToast('休息功能开发中', 'info');
    }

    // 采纳AI建议
    acceptAISuggestion() {
        try {
            // 实现AI建议采纳逻辑
            this.showToast('AI建议已采纳', 'success');
        } catch (error) {
            console.error('采纳AI建议失败:', error);
            this.showToast('操作失败', 'error');
        }
    }

    // 修改AI建议
    modifyAISuggestion() {
        // 实现AI建议修改逻辑
        this.showToast('修改功能开发中', 'info');
    }

    // 查找附近住宿
    async findNearbyAccommodation() {
        try {
            this.showToast('正在搜索附近住宿...', 'info');
            // 实现住宿查找逻辑
        } catch (error) {
            console.error('查找住宿失败:', error);
            this.showToast('查找住宿失败', 'error');
        }
    }

    // 更新进度显示
    updateProgressDisplay(position) {
        if (!window.dataManager || !window.dataManager.tripManager) {
            return;
        }

        const trip = window.dataManager.tripManager.currentTrip;
        
        // 更新今日距离
        const todayDistanceElement = document.getElementById('today-distance');
        if (todayDistanceElement) {
            todayDistanceElement.textContent = Math.round(trip.todayDistance);
        }

        // 更新目标距离
        const targetDistanceElement = document.getElementById('target-distance');
        if (targetDistanceElement) {
            const userConfig = window.dataManager.userManager.config;
            targetDistanceElement.textContent = userConfig.ridingPreferences?.dailyDistance || 120;
        }

        // 更新进度条
        const progressFill = document.getElementById('distance-progress');
        if (progressFill) {
            const targetDistance = window.dataManager.userManager.getConfig('ridingPreferences')?.dailyDistance || 120;
            const percentage = Math.min((trip.todayDistance / targetDistance) * 100, 100);
            progressFill.style.width = `${percentage}%`;
        }

        // 更新平均速度
        const averageSpeedElement = document.getElementById('average-speed');
        if (averageSpeedElement && position && position.speed) {
            const speedKmh = (position.speed * 3.6).toFixed(1);
            averageSpeedElement.textContent = speedKmh;
        }

        // 更新预计到达时间
        this.updateETA(trip.todayDistance, trip.averageSpeed);
    }

    // 更新预计到达时间
    updateETA(currentDistance, averageSpeed) {
        const etaElement = document.getElementById('eta');
        if (!etaElement) return;

        if (!averageSpeed || averageSpeed <= 0) {
            etaElement.textContent = '--:--';
            return;
        }

        const userConfig = window.dataManager ? window.dataManager.userManager.config : null;
        const targetDistance = userConfig?.ridingPreferences?.dailyDistance || 120;
        const remainingDistance = Math.max(0, targetDistance - currentDistance);
        
        if (remainingDistance === 0) {
            etaElement.textContent = '已完成';
            return;
        }

        const remainingTime = remainingDistance / averageSpeed; // 小时
        const hours = Math.floor(remainingTime);
        const minutes = Math.round((remainingTime - hours) * 60);
        
        etaElement.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
    }

    // 更新行程控制按钮
    updateTripControlButtons(isActive) {
        const startBtn = document.getElementById('start-trip');
        const pauseBtn = document.getElementById('pause-trip');

        if (startBtn && pauseBtn) {
            if (isActive) {
                startBtn.style.display = 'none';
                pauseBtn.style.display = 'inline-flex';
                pauseBtn.textContent = '⏸️ 暂停';
            } else {
                startBtn.style.display = 'inline-flex';
                pauseBtn.style.display = 'none';
            }
        }
    }

    // 更新时间显示
    updateTimeDisplay() {
        const suggestionTimeElement = document.getElementById('suggestion-time');
        if (suggestionTimeElement) {
            const now = new Date();
            suggestionTimeElement.textContent = now.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    // 更新电量状态
    updateBatteryStatus(level) {
        const batteryElement = document.getElementById('battery-status');
        if (batteryElement) {
            const percentage = Math.round(level * 100);
            const batteryIcon = percentage > 20 ? '🔋' : '🪫';
            batteryElement.innerHTML = `${batteryIcon} <span class="status-text">${percentage}%</span>`;
        }
    }

    // 显示网络状态
    showNetworkStatus(status) {
        const message = status === 'online' ? '网络已连接' : '网络已断开';
        const type = status === 'online' ? 'success' : 'warning';
        this.showToast(message, type, 3000);
    }

    // 切换全屏
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                this.isFullscreen = true;
                document.body.classList.add('fullscreen');
            });
        } else {
            document.exitFullscreen().then(() => {
                this.isFullscreen = false;
                document.body.classList.remove('fullscreen');
            });
        }
    }

    // 隐藏所有面板
    hideAllPanels() {
        const panels = ['settings-panel', 'emergency-panel'];
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.display = 'none';
            }
        });
        this.visiblePanels.clear();
    }

    // 显示提示消息
    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };

        toast.innerHTML = `
            <div style="
                background: ${colors[type]}; 
                color: white; 
                padding: 12px 16px; 
                border-radius: 4px; 
                margin: 10px; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                max-width: 80%;
            ">
                ${message}
            </div>
        `;

        document.body.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, duration);
    }
}

// 创建UI管理器实例
const uiManager = new UIManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
    window.uiManager = uiManager;
}
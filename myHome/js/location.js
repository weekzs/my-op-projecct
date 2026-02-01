// 定位管理模块
class LocationManager {
    constructor() {
        this.watchId = null;
        this.currentPosition = null;
        this.lastPosition = null;
        this.accuracyHistory = [];
        this.isEnabled = false;
        this.isTracking = false;
        this.updateTimer = null;
        
        // 绑定方法
        this.onPositionSuccess = this.onPositionSuccess.bind(this);
        this.onPositionError = this.onPositionError.bind(this);
    }

    // 初始化定位服务
    async init() {
        try {
            if (!navigator.geolocation) {
                throw new Error('设备不支持GPS定位');
            }

            // 检查定位权限
            const permission = await this.checkLocationPermission();
            if (permission === 'denied') {
                throw new Error('定位权限被拒绝');
            }

            // 获取初始位置
            await this.getCurrentPosition();
            
            this.isEnabled = true;
            console.log('定位服务初始化成功');
            return true;

        } catch (error) {
            console.error('定位服务初始化失败:', error);
            this.handleError(error);
            return false;
        }
    }

    // 检查定位权限
    async checkLocationPermission() {
        if ('permissions' in navigator) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                return result.state;
            } catch (error) {
                console.warn('无法检查定位权限:', error);
            }
        }
        return 'prompt';
    }

    // 请求定位权限
    async requestLocationPermission() {
        try {
            await this.getCurrentPosition();
            return true;
        } catch (error) {
            if (error.code === error.PERMISSION_DENIED) {
                return false;
            }
            throw error;
        }
    }

    // 获取当前位置（单次）
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            const options = {
                enableHighAccuracy: CONFIG.LOCATION.ENABLE_HIGH_ACCURACY,
                timeout: CONFIG.LOCATION.TIMEOUT,
                maximumAge: CONFIG.LOCATION.MAX_AGE
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.onPositionSuccess(position);
                    resolve(this.formatPosition(position));
                },
                (error) => {
                    this.onPositionError(error);
                    reject(error);
                },
                options
            );
        });
    }

    // 开始持续定位
    startTracking() {
        if (!this.isEnabled) {
            console.warn('定位服务未启用');
            return false;
        }

        if (this.isTracking) {
            console.log('定位已在进行中');
            return true;
        }

        const options = {
            enableHighAccuracy: CONFIG.LOCATION.ENABLE_HIGH_ACCURACY,
            timeout: CONFIG.LOCATION.TIMEOUT,
            maximumAge: CONFIG.LOCATION.MAX_AGE
        };

        try {
            this.watchId = navigator.geolocation.watchPosition(
                this.onPositionSuccess,
                this.onPositionError,
                options
            );

            // 设置定时更新（备用机制）
            this.updateTimer = setInterval(() => {
                this.forceUpdate();
            }, CONFIG.LOCATION.UPDATE_INTERVAL);

            this.isTracking = true;
            console.log('开始持续定位');
            return true;

        } catch (error) {
            console.error('启动定位失败:', error);
            this.handleError(error);
            return false;
        }
    }

    // 停止定位
    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        if (this.updateTimer !== null) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }

        this.isTracking = false;
        console.log('停止定位');
    }

    // 强制更新位置
    async forceUpdate() {
        try {
            const position = await this.getCurrentPosition();
            return position;
        } catch (error) {
            console.warn('强制更新位置失败:', error);
            return null;
        }
    }

    // 定位成功回调
    onPositionSuccess(position) {
        try {
            const formattedPosition = this.formatPosition(position);
            
            // 验证位置精度
            if (!this.validateAccuracy(formattedPosition)) {
                console.warn('位置精度不足:', formattedPosition.accuracy);
                return;
            }

            // 检查位置变化
            if (this.hasSignificantChange(formattedPosition)) {
                this.lastPosition = this.currentPosition;
                this.currentPosition = formattedPosition;

                // 更新UI
                this.updateLocationUI(formattedPosition);

                // 保存到数据管理器
                this.savePosition(formattedPosition);

                // 触发位置更新事件
                this.firePositionUpdate(formattedPosition);
            }

            // 更新精度历史
            this.updateAccuracyHistory(formattedPosition.accuracy);

        } catch (error) {
            console.error('处理位置数据失败:', error);
        }
    }

    // 定位失败回调
    onPositionError(error) {
        console.error('定位失败:', error);
        this.handleError(error);
    }

    // 格式化位置数据
    formatPosition(position) {
        return {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || null,
            altitudeAccuracy: position.coords.altitudeAccuracy || null,
            heading: position.coords.heading || null,
            speed: position.coords.speed || null,
            timestamp: position.timestamp || Date.now()
        };
    }

    // 验证位置精度
    validateAccuracy(position) {
        if (position.accuracy > CONFIG.LOCATION.ACCURACY_THRESHOLD) {
            return false;
        }
        return true;
    }

    // 检查位置是否有显著变化
    hasSignificantChange(newPosition) {
        if (!this.lastPosition) {
            return true;
        }

        const distance = this.calculateDistance(
            this.lastPosition.lat,
            this.lastPosition.lng,
            newPosition.lat,
            newPosition.lng
        );

        // 移动超过20米认为有显著变化
        return distance > 20;
    }

    // 计算两点间距离（Haversine公式）
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // 地球半径（米）
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // 距离（米）
    }

    // 更新位置UI
    updateLocationUI(position) {
        try {
            // 更新当前位置显示
            const locationElement = document.getElementById('current-location');
            if (locationElement) {
                const coords = `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
                locationElement.innerHTML = `📍 <span class="status-text">${coords}</span>`;
            }

            // 更新速度显示
            if (position.speed !== null) {
                const speedElement = document.getElementById('average-speed');
                if (speedElement) {
                    const speedKmh = (position.speed * 3.6).toFixed(1);
                    speedElement.textContent = speedKmh;
                }
            }

            // 更新地图
            if (window.mapManager) {
                window.mapManager.updateCurrentLocation(position);
            }

        } catch (error) {
            console.error('更新位置UI失败:', error);
        }
    }

    // 保存位置到数据管理器
    savePosition(position) {
        try {
            if (window.dataManager && window.dataManager.tripManager) {
                window.dataManager.tripManager.updatePosition(position);
            }
        } catch (error) {
            console.error('保存位置失败:', error);
        }
    }

    // 更新精度历史
    updateAccuracyHistory(accuracy) {
        this.accuracyHistory.push({
            accuracy: accuracy,
            timestamp: Date.now()
        });

        // 限制历史记录数量
        if (this.accuracyHistory.length > 100) {
            this.accuracyHistory = this.accuracyHistory.slice(-50);
        }
    }

    // 触发位置更新事件
    firePositionUpdate(position) {
        const event = new CustomEvent('positionUpdate', {
            detail: { position, previousPosition: this.lastPosition }
        });
        document.dispatchEvent(event);
    }

    // 获取当前位置
    getCurrentPositionData() {
        return this.currentPosition;
    }

    // 获取位置精度统计
    getAccuracyStats() {
        if (this.accuracyHistory.length === 0) {
            return null;
        }

        const accuracies = this.accuracyHistory.map(item => item.accuracy);
        const sum = accuracies.reduce((a, b) => a + b, 0);
        const avg = sum / accuracies.length;
        const min = Math.min(...accuracies);
        const max = Math.max(...accuracies);

        return {
            average: avg,
            min: min,
            max: max,
            count: accuracies.length,
            latest: accuracies[accuracies.length - 1]
        };
    }

    // 获取信号强度
    getSignalStrength() {
        if (!this.currentPosition) {
            return 'unknown';
        }

        const accuracy = this.currentPosition.accuracy;
        if (accuracy <= 10) return 'excellent';
        if (accuracy <= 20) return 'good';
        if (accuracy <= 50) return 'fair';
        return 'poor';
    }

    // 处理错误
    handleError(error) {
        let message = '定位服务异常';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = '定位权限被拒绝，请在设置中允许定位';
                break;
            case error.POSITION_UNAVAILABLE:
                message = '定位信息不可用，请检查GPS设置';
                break;
            case error.TIMEOUT:
                message = '定位超时，请重试';
                break;
            default:
                message = `定位错误: ${error.message}`;
                break;
        }

        // 更新UI显示错误
        const locationElement = document.getElementById('current-location');
        if (locationElement) {
            locationElement.innerHTML = `📍 <span class="status-text" style="color: #F44336;">定位失败</span>`;
        }

        // 显示错误提示
        this.showErrorMessage(message);
    }

    // 显示错误消息
    showErrorMessage(message) {
        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = 'location-error-toast';
        toast.innerHTML = `
            <div style="background: #F44336; color: white; padding: 12px; border-radius: 4px; margin: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                <strong>⚠️ 定位错误</strong><br>
                ${message}
            </div>
        `;

        // 添加到页面
        document.body.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
    }

    // 计算今日骑行距离
    calculateTodayDistance() {
        // 这里需要根据历史位置数据计算
        // 暂时返回0，实际实现需要结合轨迹数据
        return 0;
    }

    // 计算到终点的距离
    calculateDistanceToDestination() {
        if (!this.currentPosition) {
            return null;
        }

        const destination = CONFIG.ROUTE.END.coords;
        return this.calculateDistance(
            this.currentPosition.lat,
            this.currentPosition.lng,
            destination.lat,
            destination.lng
        );
    }

    // 估算到达时间
    estimateTimeToDestination() {
        const distance = this.calculateDistanceToDestination();
        if (!distance || !this.currentPosition || !this.currentPosition.speed) {
            return null;
        }

        const speedMps = this.currentPosition.speed; // 米/秒
        const timeSeconds = distance / speedMps;
        const timeHours = timeSeconds / 3600;
        
        return {
            hours: Math.floor(timeHours),
            minutes: Math.round((timeHours - Math.floor(timeHours)) * 60),
            totalSeconds: timeSeconds
        };
    }

    // 电量优化模式
    enableBatterySavingMode() {
        if (this.isTracking) {
            // 降低定位精度
            CONFIG.LOCATION.ENABLE_HIGH_ACCURACY = false;
            CONFIG.LOCATION.UPDATE_INTERVAL = 10 * 60 * 1000; // 10分钟更新一次
            
            // 重新启动定位
            this.stopTracking();
            this.startTracking();
            
            console.log('启用电量优化模式');
        }
    }

    // 正常模式
    enableNormalMode() {
        CONFIG.LOCATION.ENABLE_HIGH_ACCURACY = true;
        CONFIG.LOCATION.UPDATE_INTERVAL = 5 * 60 * 1000; // 5分钟更新一次
        
        if (this.isTracking) {
            this.stopTracking();
            this.startTracking();
        }
        
        console.log('启用正常模式');
    }

    // 销毁定位管理器
    destroy() {
        this.stopTracking();
        this.currentPosition = null;
        this.lastPosition = null;
        this.accuracyHistory = [];
        this.isEnabled = false;
    }
}

// 创建定位管理器实例
const locationManager = new LocationManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocationManager;
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.LocationManager = LocationManager;
    window.locationManager = locationManager;
}
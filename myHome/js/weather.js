// 天气服务模块
class WeatherManager {
    constructor() {
        this.currentWeather = null;
        this.weatherForecast = [];
        this.lastUpdateTime = null;
        this.updateTimer = null;
        this.isUpdating = false;
        this.cache = new Map();
    }

    // 初始化天气服务
    async init() {
        try {
            console.log('初始化天气服务...');
            
            // 获取初始天气数据
            await this.updateWeatherData();
            
            // 设置定时更新
            this.startAutoUpdate();
            
            console.log('天气服务初始化完成');
            return true;

        } catch (error) {
            console.error('天气服务初始化失败:', error);
            return false;
        }
    }

    // 开始自动更新
    startAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        this.updateTimer = setInterval(() => {
            this.updateWeatherData();
        }, CONFIG.WEATHER.UPDATE_INTERVAL);
    }

    // 停止自动更新
    stopAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    // 更新天气数据
    async updateWeatherData() {
        if (this.isUpdating) {
            return;
        }

        this.isUpdating = true;

        try {
            // 获取当前位置
            const position = this.getCurrentPosition();
            if (!position) {
                console.warn('无法获取当前位置，跳过天气更新');
                return;
            }

            // 获取当前天气
            const currentWeather = await this.getCurrentWeather(position);
            if (currentWeather) {
                this.currentWeather = currentWeather;
            }

            // 获取天气预报
            const forecast = await this.getWeatherForecast(position);
            if (forecast && forecast.length > 0) {
                this.weatherForecast = forecast;
            }

            this.lastUpdateTime = new Date();

            // 更新UI
            this.updateWeatherUI();

            // 保存数据
            this.saveWeatherData();

            // 检查天气预警
            this.checkWeatherWarnings();

        } catch (error) {
            console.error('更新天气数据失败:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    // 获取当前位置
    getCurrentPosition() {
        // 尝试从定位管理器获取
        if (window.locationManager && window.locationManager.getCurrentPositionData) {
            return window.locationManager.getCurrentPositionData();
        }

        // 尝试从行程管理器获取
        if (window.dataManager && window.dataManager.tripManager) {
            const trip = window.dataManager.tripManager.currentTrip;
            return trip.currentPosition;
        }

        return null;
    }

    // 获取当前天气
    async getCurrentWeather(position) {
        try {
            const cacheKey = `weather_${position.lat}_${position.lng}_${Math.floor(Date.now() / (30 * 60 * 1000))}`;
            
            // 检查缓存
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // 构建API请求URL
            const url = `${CONFIG.API.TIANDITU.BASE_URL}/weather/v2/getWeather?key=${CONFIG.API.TIANDITU.WEATHER_KEY}&lon=${position.lng}&lat=${position.lat}&type=realtime`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`天气API请求失败: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status === '0' && data.data) {
                const weatherData = this.parseCurrentWeather(data.data);
                
                // 缓存结果
                this.cache.set(cacheKey, weatherData);
                
                return weatherData;
            } else {
                throw new Error(data.message || '获取天气数据失败');
            }

        } catch (error) {
            console.error('获取当前天气失败:', error);
            return this.getOfflineWeather(position);
        }
    }

    // 获取天气预报
    async getWeatherForecast(position) {
        try {
            const cacheKey = `forecast_${position.lat}_${position.lng}_${Math.floor(Date.now() / (60 * 60 * 1000))}`;
            
            // 检查缓存
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // 构建API请求URL
            const url = `${CONFIG.API.TIANDITU.BASE_URL}/weather/v2/getWeather?key=${CONFIG.API.TIANDITU.WEATHER_KEY}&lon=${position.lng}&lat=${position.lat}&type=forecast`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`天气预报API请求失败: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status === '0' && data.data) {
                const forecastData = this.parseForecast(data.data);
                
                // 缓存结果
                this.cache.set(cacheKey, forecastData);
                
                return forecastData;
            } else {
                throw new Error(data.message || '获取天气预报失败');
            }

        } catch (error) {
            console.error('获取天气预报失败:', error);
            return [];
        }
    }

    // 解析当前天气数据
    parseCurrentWeather(data) {
        return {
            location: data.city || '当前位置',
            temperature: parseFloat(data.temperature) || null,
            humidity: parseFloat(data.humidity) || null,
            windSpeed: parseFloat(data.windSpeed) || null,
            windDirection: data.windDirection || null,
            weather: data.weather || '未知',
            weatherCode: data.weatherCode || null,
            visibility: parseFloat(data.visibility) || null,
            pressure: parseFloat(data.pressure) || null,
            updateTime: data.updateTime || new Date().toISOString(),
            icon: this.getWeatherIcon(data.weather, data.weatherCode)
        };
    }

    // 解析预报数据
    parseForecast(data) {
        const forecasts = [];
        
        if (Array.isArray(data) && data.length > 0) {
            data.forEach(item => {
                forecasts.push({
                    date: item.date || new Date().toISOString().split('T')[0],
                    temperatureMax: parseFloat(item.temperatureMax) || null,
                    temperatureMin: parseFloat(item.temperatureMin) || null,
                    weather: item.weather || '未知',
                    weatherCode: item.weatherCode || null,
                    windSpeed: parseFloat(item.windSpeed) || null,
                    humidity: parseFloat(item.humidity) || null,
                    icon: this.getWeatherIcon(item.weather, item.weatherCode)
                });
            });
        }

        return forecasts.slice(0, 5); // 只取5天预报
    }

    // 获取天气图标
    getWeatherIcon(weather, weatherCode) {
        // 根据天气状况返回对应的emoji或图标
        const weatherIcons = {
            '晴': '☀️',
            '多云': '⛅',
            '阴': '☁️',
            '小雨': '🌦️',
            '中雨': '🌧️',
            '大雨': '⛈️',
            '暴雨': '🌩️',
            '雷阵雨': '⛈️',
            '雪': '❄️',
            '雾': '🌫️',
            '霾': '😷'
        };

        return weatherIcons[weather] || '🌤️';
    }

    // 获取离线天气数据（备用）
    getOfflineWeather(position) {
        return {
            location: '当前位置',
            temperature: 20,
            humidity: 60,
            windSpeed: 5,
            windDirection: '北',
            weather: '多云',
            weatherCode: null,
            visibility: 10,
            pressure: 1013,
            updateTime: new Date().toISOString(),
            icon: '⛅',
            isOffline: true
        };
    }

    // 更新天气UI
    updateWeatherUI() {
        if (!this.currentWeather) {
            return;
        }

        try {
            // 更新当前天气显示
            const weatherElement = document.getElementById('current-weather');
            if (weatherElement) {
                weatherElement.innerHTML = `
                    <div class="weather-status">${this.currentWeather.icon} ${this.currentWeather.weather}</div>
                    <div class="weather-temp">${this.currentWeather.temperature}°C</div>
                    <div class="weather-details">
                        <span>💧${this.currentWeather.humidity}%</span>
                        <span>💨${this.currentWeather.windSpeed}m/s</span>
                    </div>
                    ${this.currentWeather.isOffline ? '<div style="color: #FF9800; font-size: 12px;">离线数据</div>' : ''}
                `;
            }

            // 更新天气最后更新时间
            const lastUpdateElement = document.getElementById('weather-last-update');
            if (lastUpdateElement && this.lastUpdateTime) {
                lastUpdateElement.textContent = this.formatUpdateTime(this.lastUpdateTime);
            }

        } catch (error) {
            console.error('更新天气UI失败:', error);
        }
    }

    // 格式化更新时间
    formatUpdateTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / (1000 * 60));
        
        if (minutes < 1) {
            return '刚刚';
        } else if (minutes < 60) {
            return `${minutes}分钟前`;
        } else {
            const hours = Math.floor(minutes / 60);
            return `${hours}小时前`;
        }
    }

    // 保存天气数据
    saveWeatherData() {
        try {
            if (window.dataManager && window.dataManager.tripManager) {
                window.dataManager.tripManager.addWeatherLog({
                    current: this.currentWeather,
                    forecast: this.weatherForecast,
                    updateTime: this.lastUpdateTime
                });
            }
        } catch (error) {
            console.error('保存天气数据失败:', error);
        }
    }

    // 检查天气预警
    checkWeatherWarnings() {
        if (!this.currentWeather) {
            return;
        }

        const warnings = [];

        // 检查恶劣天气
        if (CONFIG.WEATHER.WARNING_CONDITIONS.includes(this.currentWeather.weather)) {
            warnings.push({
                type: 'bad_weather',
                message: `当前天气${this.currentWeather.weather}，请注意安全！`,
                level: 'high'
            });
        }

        // 检查温度
        const temp = this.currentWeather.temperature;
        if (temp < CONFIG.WEATHER.TEMPERATURE_RANGES.WARNING.min) {
            warnings.push({
                type: 'low_temperature',
                message: `气温较低(${temp}°C)，注意保暖！`,
                level: 'medium'
            });
        } else if (temp > CONFIG.WEATHER.TEMPERATURE_RANGES.WARNING.max) {
            warnings.push({
                type: 'high_temperature',
                message: `气温较高(${temp}°C)，注意防暑！`,
                level: 'high'
            });
        }

        // 检查风速
        if (this.currentWeather.windSpeed > 10) {
            warnings.push({
                type: 'high_wind',
                message: `风速较大(${this.currentWeather.windSpeed}m/s)，注意安全！`,
                level: 'medium'
            });
        }

        // 检查能见度
        if (this.currentWeather.visibility && this.currentWeather.visibility < 1) {
            warnings.push({
                type: 'low_visibility',
                message: `能见度较低(${this.currentWeather.visibility}km)，请谨慎骑行！`,
                level: 'high'
            });
        }

        // 发送预警
        if (warnings.length > 0) {
            this.sendWeatherWarnings(warnings);
        }

        // 检查未来预警
        this.checkFutureWarnings();
    }

    // 检查未来预警
    checkFutureWarnings() {
        if (!this.weatherForecast || this.weatherForecast.length === 0) {
            return;
        }

        const warnings = [];
        
        // 检查未来3小时的天气
        for (let i = 0; i < Math.min(3, this.weatherForecast.length); i++) {
            const forecast = this.weatherForecast[i];
            const date = new Date(forecast.date);
            const isToday = date.toDateString() === new Date().toDateString();

            if (isToday && CONFIG.WEATHER.WARNING_CONDITIONS.includes(forecast.weather)) {
                warnings.push({
                    type: 'future_bad_weather',
                    message: `今日晚些时候可能${forecast.weather}，请注意安排！`,
                    level: 'medium',
                    forecastDate: forecast.date
                });
            }
        }

        if (warnings.length > 0) {
            this.sendWeatherWarnings(warnings);
        }
    }

    // 发送天气预警
    sendWeatherWarnings(warnings) {
        // 创建预警通知
        warnings.forEach(warning => {
            this.showWeatherWarning(warning);
            
            // 添加到AI建议
            if (window.dataManager && window.dataManager.tripManager) {
                window.dataManager.tripManager.addAISuggestion({
                    type: CONFIG.AI_SUGGESTION_TYPES.WEATHER_WARNING,
                    title: '天气预警',
                    content: warning.message,
                    level: warning.level,
                    autoAction: this.getWeatherAutoAction(warning),
                    priority: warning.level === 'high' ? 'high' : 'medium'
                });
            }
        });
    }

    // 显示天气预警
    showWeatherWarning(warning) {
        const levelColors = {
            high: '#F44336',
            medium: '#FF9800',
            low: '#FFC107'
        };

        const toast = document.createElement('div');
        toast.className = 'weather-warning-toast';
        toast.innerHTML = `
            <div style="background: ${levelColors[warning.level]}; color: white; padding: 12px; border-radius: 4px; margin: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                <strong>🌤️ 天气预警</strong><br>
                ${warning.message}
            </div>
        `;

        document.body.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 8000);
    }

    // 获取天气自动行动建议
    getWeatherAutoAction(warning) {
        const actions = {
            'bad_weather': {
                suggestion: '建议寻找避难所或推迟行程',
                autoExecute: false
            },
            'low_temperature': {
                suggestion: '建议增加衣物或缩短行程',
                autoExecute: false
            },
            'high_temperature': {
                suggestion: '建议增加休息频率，补充水分',
                autoExecute: true
            },
            'high_wind': {
                suggestion: '建议降低速度，注意安全',
                autoExecute: true
            },
            'low_visibility': {
                suggestion: '建议开启车灯，降低速度',
                autoExecute: false
            }
        };

        return actions[warning.type] || null;
    }

    // 获取当前天气数据
    getCurrentWeatherData() {
        return this.currentWeather;
    }

    // 获取天气预报
    getForecastData() {
        return this.weatherForecast;
    }

    // 判断是否适合骑行
    isGoodForRiding() {
        if (!this.currentWeather) {
            return true; // 默认适合
        }

        const weather = this.currentWeather.weather;
        const temp = this.currentWeather.temperature;
        const windSpeed = this.currentWeather.windSpeed;

        // 检查天气状况
        if (!CONFIG.WEATHER.PERFECT_CONDITIONS.includes(weather)) {
            return false;
        }

        // 检查温度
        if (temp < CONFIG.WEATHER.TEMPERATURE_RANGES.PERFECT.min || 
            temp > CONFIG.WEATHER.TEMPERATURE_RANGES.PERFECT.max) {
            return false;
        }

        // 检查风速
        if (windSpeed > 8) {
            return false;
        }

        return true;
    }

    // 获取骑行建议
    getRidingAdvice() {
        if (!this.currentWeather) {
            return '天气信息不可用';
        }

        const advice = [];

        // 温度建议
        const temp = this.currentWeather.temperature;
        if (temp < 10) {
            advice.push('气温较低，建议穿戴保暖装备');
        } else if (temp > 30) {
            advice.push('气温较高，建议多补充水分，避免中暑');
        }

        // 天气建议
        const weather = this.currentWeather.weather;
        if (weather.includes('雨')) {
            advice.push('有雨，建议穿戴雨具，注意路面湿滑');
        } else if (weather.includes('雪')) {
            advice.push('有雪，路面可能结冰，建议谨慎骑行');
        }

        // 风速建议
        const windSpeed = this.currentWeather.windSpeed;
        if (windSpeed > 6) {
            advice.push('风速较大，建议降低速度，注意安全');
        }

        // 能见度建议
        if (this.currentWeather.visibility && this.currentWeather.visibility < 2) {
            advice.push('能见度较低，建议开启车灯，谨慎骑行');
        }

        return advice.length > 0 ? advice.join('；') : '天气条件良好，适合骑行';
    }

    // 刷新天气
    async refresh() {
        this.updateWeatherData();
    }

    // 清理缓存
    cleanup() {
        this.cache.clear();
    }

    // 销毁天气管理器
    destroy() {
        this.stopAutoUpdate();
        this.cleanup();
        this.currentWeather = null;
        this.weatherForecast = [];
        this.lastUpdateTime = null;
    }
}

// 创建天气管理器实例
const weatherManager = new WeatherManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherManager;
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.WeatherManager = WeatherManager;
    window.weatherManager = weatherManager;
}
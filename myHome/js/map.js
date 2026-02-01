// 地图管理模块 - 天地图API集成
class MapManager {
    constructor() {
        this.map = null;
        this.isLoaded = false;
        this.currentLocation = null;
        this.routeLayer = null;
        this.locationLayer = null;
        this.accommodationLayer = null;
        this.waypointLayer = null;
        this.trackLine = null;
        this.markers = {};
        
        // 绑定方法
        this.init = this.init.bind(this);
        this.onMapClick = this.onMapClick.bind(this);
    }

    // 初始化地图
    async init() {
        try {
            // 检查天地图API是否加载
            if (typeof T === 'undefined') {
                throw new Error('天地图API未加载，请检查网络连接');
            }

            console.log('🗺️ 初始化天地图...');
            console.log('API版本:', T.VERSION || '4.0');
            console.log('API密钥状态:', CONFIG.API.TIANDITU.MAP_KEY ? '已配置' : '未配置');
            
            // 隐藏加载状态
            this.hideLoading();

            // 创建地图实例 - 使用更多配置选项
            this.map = new T.Map('tianditu-map', {
                projection: 'EPSG:4326'
            });
            
            // 设置地图中心点和缩放级别
            const center = new T.LngLat(CONFIG.ROUTE.START.coords.lng, CONFIG.ROUTE.START.coords.lat);
            console.log('设置地图中心点:', center);
            
            this.map.centerAndZoom(center, 10);
            console.log('✓ 地图中心设置成功');

            // 添加地图控件
            this.addMapControls();
            
            // 添加地图图层
            this.addMapLayers();

            // 绑定事件
            this.bindEvents();

            // 添加路线
            await this.addRoute();

            // 添加起点和终点标记
            this.addStartEndMarkers();

            this.isLoaded = true;
            console.log('✅ 地图初始化完成');
            
            // 触发地图加载完成事件
            this.onMapLoaded();

        } catch (error) {
            console.error('❌ 地图初始化失败:', error);
            this.showError(`地图加载失败: ${error.message}。请检查网络连接和API密钥是否有效`);
        }
    }

    // 添加地图控件
    addMapControls() {
        // 添加缩放控件
        this.map.addControl(new T.Control.Zoom());

        // 添加比例尺控件
        this.map.addControl(new T.Control.Scale());

        // 添加鹰眼控件
        this.map.addControl(new T.Control.OverviewMap());

        // 如果移动端，移除一些控件
        if (this.isMobile()) {
            // 移动端可能不需要某些控件
        }
    }

    // 添加地图图层
    addMapLayers() {
        try {
            // 添加矢量地图图层 - 使用正确的加载方式
            const vecLayer = new T.TileLayer.wmts({
                layer: 'vec',  // 矢量底图
                style: 'default',
                format: 'tiles',
                matrixSet: 'w',
                projection: 'EPSG:3857'
            });
            this.map.addLayer(vecLayer);
            console.log('✓ 矢量底图加载成功');

            // 添加注记图层
            const cvaLayer = new T.TileLayer.wmts({
                layer: 'cva',  // 矢量注记
                style: 'default',
                format: 'tiles',
                matrixSet: 'w',
                projection: 'EPSG:3857'
            });
            this.map.addLayer(cvaLayer);
            console.log('✓ 注记图层加载成功');

            // 创建图层组
            this.routeLayer = new T.OverlayGroup();
            this.locationLayer = new T.OverlayGroup();
            this.accommodationLayer = new T.OverlayGroup();
            this.waypointLayer = new T.OverlayGroup();

            this.map.addLayer(this.routeLayer);
            this.map.addLayer(this.locationLayer);
            this.map.addLayer(this.accommodationLayer);
            this.map.addLayer(this.waypointLayer);
            console.log('✓ 图层组创建成功');

        } catch (error) {
            console.error('图层加载失败:', error);
            // 尝试使用简化的图层加载方式
            try {
                const simpleLayer = new T.TileLayer.wmts();
                this.map.addLayer(simpleLayer);
                console.log('✓ 使用简化方式加载图层成功');
            } catch (simpleError) {
                console.error('简化图层加载也失败:', simpleError);
                throw new Error('地图图层加载失败，请检查API密钥和网络连接');
            }
        }
    }

    // 绑定事件
    bindEvents() {
        // 地图点击事件
        this.map.addEventListener('click', this.onMapClick);

        // 地图缩放事件
        this.map.addEventListener('zoomend', () => {
            this.onZoomChanged();
        });

        // 地图移动事件
        this.map.addEventListener('moveend', () => {
            this.onMapMoved();
        });
    }

    // 添加路线
    async addRoute() {
        try {
            const routeCoords = this.getRouteCoordinates();
            
            // 创建折线
            this.trackLine = new T.Polyline(routeCoords, {
                color: "#2196F3",
                weight: 4,
                opacity: 0.8,
                lineStyle: "solid"
            });

            this.routeLayer.addOverLay(this.trackLine);

            // 添加途经点
            this.addWaypoints();

            console.log('路线添加完成');

        } catch (error) {
            console.error('添加路线失败:', error);
        }
    }

    // 获取路线坐标
    getRouteCoordinates() {
        const coords = [];
        
        // 起点
        coords.push(new T.LngLat(CONFIG.ROUTE.START.coords.lng, CONFIG.ROUTE.START.coords.lat));
        
        // 途经点
        CONFIG.ROUTE.WAYPOINTS.forEach(waypoint => {
            coords.push(new T.LngLat(waypoint.coords.lng, waypoint.coords.lat));
        });
        
        // 终点
        coords.push(new T.LngLat(CONFIG.ROUTE.END.coords.lng, CONFIG.ROUTE.END.coords.lat));
        
        return coords;
    }

    // 添加途经点
    addWaypoints() {
        CONFIG.ROUTE.WAYPOINTS.forEach((waypoint, index) => {
            const marker = new T.Marker(
                new T.LngLat(waypoint.coords.lng, waypoint.coords.lat),
                {
                    icon: new T.Icon({
                        iconUrl: this.getWaypointIcon(index + 1),
                        iconSize: new T.Point(32, 32),
                        iconAnchor: new T.Point(16, 32)
                    })
                }
            );

            // 添加信息窗口
            const infoWindow = new T.InfoWindow();
            infoWindow.setContent(this.createWaypointInfo(waypoint, index + 1));
            
            marker.addEventListener('click', () => {
                marker.openInfoWindow(infoWindow);
            });

            this.waypointLayer.addOverLay(marker);
            this.markers[`waypoint_${index}`] = marker;
        });
    }

    // 获取途经点图标
    getWaypointIcon(number) {
        // 使用天地图默认图标或自定义图标
        const iconColors = ['#FF9800', '#4CAF50', '#2196F3', '#9C27B0', '#F44336'];
        const color = iconColors[number % iconColors.length];
        
        // 这里应该返回实际的图标URL，暂时返回默认图标
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
                <text x="16" y="21" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${number}</text>
            </svg>
        `)}`;
    }

    // 创建途经点信息窗口内容
    createWaypointInfo(waypoint, number) {
        return `
            <div style="padding: 10px; min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: #333;">途经点 ${number}: ${waypoint.name}</h4>
                <p style="margin: 4px 0; font-size: 14px;">累计距离: ${waypoint.distance}km</p>
                <p style="margin: 4px 0; font-size: 14px;">预计用时: ${Math.round(waypoint.distance / 15)}小时</p>
                <button onclick="mapManager.centerOnLocation(${waypoint.coords.lng}, ${waypoint.coords.lat})" 
                        style="margin-top: 8px; padding: 4px 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    定位到此点
                </button>
            </div>
        `;
    }

    // 添加起点和终点标记
    addStartEndMarkers() {
        // 起点标记
        const startMarker = new T.Marker(
            new T.LngLat(CONFIG.ROUTE.START.coords.lng, CONFIG.ROUTE.START.coords.lat),
            {
                icon: new T.Icon({
                    iconUrl: 'https://api.tianditu.gov.cn/images/bus/start.png',
                    iconSize: new T.Point(32, 32),
                    iconAnchor: new T.Point(16, 32)
                })
            }
        );

        const startInfo = new T.InfoWindow();
        startInfo.setContent(`
            <div style="padding: 10px;">
                <h4 style="margin: 0; color: #4CAF50;">起点: ${CONFIG.ROUTE.START.name}</h4>
                <p style="margin: 4px 0; font-size: 14px;">从这里开始您的骑行之旅！</p>
            </div>
        `);

        startMarker.addEventListener('click', () => {
            startMarker.openInfoWindow(startInfo);
        });

        this.locationLayer.addOverLay(startMarker);
        this.markers.start = startMarker;

        // 终点标记
        const endMarker = new T.Marker(
            new T.LngLat(CONFIG.ROUTE.END.coords.lng, CONFIG.ROUTE.END.coords.lat),
            {
                icon: new T.Icon({
                    iconUrl: 'https://api.tianditu.gov.cn/images/bus/end.png',
                    iconSize: new T.Point(32, 32),
                    iconAnchor: new T.Point(16, 32)
                })
            }
        );

        const endInfo = new T.InfoWindow();
        endInfo.setContent(`
            <div style="padding: 10px;">
                <h4 style="margin: 0; color: #F44336;">终点: ${CONFIG.ROUTE.END.name}</h4>
                <p style="margin: 4px 0; font-size: 14px;">总距离: ${CONFIG.ROUTE.TOTAL_DISTANCE}km</p>
                <p style="margin: 4px 0; font-size: 14px;">预计用时: ${CONFIG.ROUTE.ESTIMATED_DAYS}天</p>
            </div>
        `);

        endMarker.addEventListener('click', () => {
            endMarker.openInfoWindow(endInfo);
        });

        this.locationLayer.addOverLay(endMarker);
        this.markers.end = endMarker;
    }

    // 更新当前位置
    updateCurrentLocation(position) {
        if (!this.isLoaded || !position) return;

        const lngLat = new T.LngLat(position.lng, position.lat);
        
        // 移除旧的位置标记
        if (this.markers.currentLocation) {
            this.locationLayer.removeOverLay(this.markers.currentLocation);
        }

        // 创建新的位置标记
        const locationIcon = new T.Icon({
            iconUrl: this.getCurrentLocationIcon(),
            iconSize: new T.Point(24, 24),
            iconAnchor: new T.Point(12, 12)
        });

        const marker = new T.Marker(lngLat, {
            icon: locationIcon
        });

        this.locationLayer.addOverLay(marker);
        this.markers.currentLocation = marker;
        this.currentLocation = position;

        // 添加到轨迹
        this.addToTrack(position);

        // 如果是第一次定位，将地图中心移动到当前位置
        if (Object.keys(this.markers).length === 3) { // 只有起点、终点和当前位置
            this.centerOnLocation(position.lng, position.lat, 14);
        }
    }

    // 获取当前位置图标
    getCurrentLocationIcon() {
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#2196F3" stroke="white" stroke-width="2">
                    <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
        `)}`;
    }

    // 添加到轨迹
    addToTrack(position) {
        // 这里可以实现轨迹记录和显示
        // 暂时简化处理
    }

    // 显示住宿点
    showAccommodations(accommodations) {
        // 清除现有住宿标记
        this.accommodationLayer.clearOverLays();

        accommodations.forEach((accommodation, index) => {
            const marker = new T.Marker(
                new T.LngLat(accommodation.lng, accommodation.lat),
                {
                    icon: new T.Icon({
                        iconUrl: this.getAccommodationIcon(accommodation.type),
                        iconSize: new T.Point(24, 24),
                        iconAnchor: new T.Point(12, 24)
                    })
                }
            );

            // 添加信息窗口
            const infoWindow = new T.InfoWindow();
            infoWindow.setContent(this.createAccommodationInfo(accommodation));

            marker.addEventListener('click', () => {
                marker.openInfoWindow(infoWindow);
            });

            this.accommodationLayer.addOverLay(marker);
            this.markers[`accommodation_${index}`] = marker;
        });
    }

    // 获取住宿图标
    getAccommodationIcon(type) {
        const icons = {
            budget: '🏠',
            economy: '🏨',
            comfort: '🏢'
        };
        
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <text x="12" y="18" text-anchor="middle" font-size="16">${icons[type] || '🏨'}</text>
            </svg>
        `)}`;
    }

    // 创建住宿信息窗口
    createAccommodationInfo(accommodation) {
        return `
            <div style="padding: 10px; min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: #333;">${accommodation.name}</h4>
                <p style="margin: 4px 0; font-size: 14px;">价格: ¥${accommodation.price}/晚</p>
                <p style="margin: 4px 0; font-size: 14px;">距离: ${accommodation.distance}km</p>
                <p style="margin: 4px 0; font-size: 14px;">评分: ${accommodation.rating || 'N/A'}</p>
                <button onclick="mapManager.callAccommodation('${accommodation.phone}')" 
                        style="margin-top: 8px; padding: 4px 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    联系住宿
                </button>
            </div>
        `;
    }

    // 联系住宿
    callAccommodation(phone) {
        if (phone) {
            window.location.href = `tel:${phone}`;
        }
    }

    // 中心定位到指定位置
    centerOnLocation(lng, lat, zoom = null) {
        const lngLat = new T.LngLat(lng, lat);
        if (zoom !== null) {
            this.map.centerAndZoom(lngLat, zoom);
        } else {
            this.map.setCenter(lngLat);
        }
    }

    // 回到当前位置
    goToCurrentLocation() {
        if (this.currentLocation) {
            this.centerOnLocation(this.currentLocation.lng, this.currentLocation.lat, 15);
        } else {
            console.warn('当前位置未知');
        }
    }

    // 切换路线显示
    toggleRoute() {
        if (this.routeLayer.getVisible()) {
            this.routeLayer.setVisible(false);
        } else {
            this.routeLayer.setVisible(true);
        }
    }

    // 切换住宿显示
    toggleAccommodations() {
        if (this.accommodationLayer.getVisible()) {
            this.accommodationLayer.setVisible(false);
        } else {
            this.accommodationLayer.setVisible(true);
        }
    }

    // 进入全屏模式
    enterFullscreen() {
        const mapContainer = document.getElementById('map-container');
        if (mapContainer.requestFullscreen) {
            mapContainer.requestFullscreen();
        } else if (mapContainer.webkitRequestFullscreen) {
            mapContainer.webkitRequestFullscreen();
        } else if (mapContainer.msRequestFullscreen) {
            mapContainer.msRequestFullscreen();
        }
        
        document.body.classList.add('fullscreen');
        
        // 调整地图大小
        setTimeout(() => {
            this.map.checkResize();
        }, 100);
    }

    // 退出全屏模式
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        document.body.classList.remove('fullscreen');
        
        // 调整地图大小
        setTimeout(() => {
            this.map.checkResize();
        }, 100);
    }

    // 事件处理
    onMapClick(event) {
        // 处理地图点击事件
        console.log('地图被点击:', event);
    }

    onZoomChanged() {
        // 处理缩放事件
        console.log('地图缩放级别变化:', this.map.getZoom());
    }

    onMapMoved() {
        // 处理地图移动事件
        console.log('地图中心变化:', this.map.getCenter());
    }

    onMapLoaded() {
        // 地图加载完成事件
        const event = new CustomEvent('mapLoaded', {
            detail: { map: this.map }
        });
        document.dispatchEvent(event);
    }

    // 工具方法
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    hideLoading() {
        const loadingElement = document.getElementById('map-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    showError(message) {
        const loadingElement = document.getElementById('map-loading');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div style="text-align: center; color: #F44336;">
                    <p style="font-size: 18px;">❌</p>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        重新加载
                    </button>
                </div>
            `;
            loadingElement.style.display = 'block';
        }
    }

    // 销毁地图
    destroy() {
        if (this.map) {
            this.map.destroy();
            this.map = null;
        }
    }
}

// 创建地图管理器实例
const mapManager = new MapManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapManager;
}

// 全局暴露
if (typeof window !== 'undefined') {
    window.MapManager = MapManager;
    window.mapManager = mapManager;
}
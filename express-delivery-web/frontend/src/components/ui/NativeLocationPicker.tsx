'use client';

import { useEffect, useState } from 'react';
import { Button } from './Button';

interface NativeLocationPickerProps {
  onSelect: (address: string, lat: number, lng: number) => void;
  onClose: () => void;
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
}

export function NativeLocationPicker({ onSelect, onClose, initialAddress, initialLat, initialLng }: NativeLocationPickerProps) {
  const [address, setAddress] = useState(initialAddress || '');
  const [lat, setLat] = useState<number | null>(initialLat || null);
  const [lng, setLng] = useState<number | null>(initialLng || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 使用浏览器原生定位API获取当前位置
  const getCurrentLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('您的浏览器不支持地理定位功能');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        setLat(latitude);
        setLng(longitude);

        // 使用免费的逆地理编码服务获取地址
        await getAddressFromCoordinates(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        console.error('定位失败:', err);
        let errorMsg = '定位失败，请检查浏览器权限设置';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = '定位权限被拒绝，请在浏览器设置中允许位置访问';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg = '位置信息不可用';
            break;
          case err.TIMEOUT:
            errorMsg = '定位请求超时';
            break;
        }
        
        setError(errorMsg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true, // 启用高精度定位
        timeout: 10000, // 10秒超时
        maximumAge: 0 // 不使用缓存
      }
    );
  };

  // 使用免费的逆地理编码API（Nominatim - OpenStreetMap）
  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      // 使用 Nominatim (OpenStreetMap) 免费服务
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ExpressDeliveryApp/1.0' // 必须设置User-Agent
          }
        }
      );

      if (!response.ok) {
        throw new Error('地址查询失败');
      }

      const data = await response.json();
      
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error('获取地址失败:', error);
      // 如果逆地理编码失败，至少显示坐标
      setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    }
  };

  // 搜索地址（使用Nominatim搜索）
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      setError('请输入搜索关键词');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchKeyword)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ExpressDeliveryApp/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('搜索失败');
      }

      const results = await response.json();
      
      if (results && results.length > 0) {
        const firstResult = results[0];
        const latitude = parseFloat(firstResult.lat);
        const longitude = parseFloat(firstResult.lon);
        
        setLat(latitude);
        setLng(longitude);
        setAddress(firstResult.display_name || firstResult.name);
        setSearchKeyword('');
      } else {
        setError('未找到相关地址');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setError('搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 确认选择
  const handleConfirm = () => {
    if (!lat || !lng) {
      setError('请先获取位置信息');
      return;
    }

    if (!address) {
      setError('请先获取地址信息');
      return;
    }

    onSelect(address, lat, lng);
  };

  // 手动输入坐标
  const handleManualInput = () => {
    const latInput = prompt('请输入纬度（例如：39.9042）:');
    const lngInput = prompt('请输入经度（例如：116.4074）:');

    if (latInput && lngInput) {
      const latitude = parseFloat(latInput);
      const longitude = parseFloat(lngInput);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        setLat(latitude);
        setLng(longitude);
        getAddressFromCoordinates(latitude, longitude);
      } else {
        setError('请输入有效的坐标值');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">选择地址（原生定位）</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* 获取当前位置按钮 */}
          <div>
            <Button
              onClick={getCurrentLocation}
              disabled={loading}
              className="w-full"
            >
              {loading ? '定位中...' : '📍 获取当前位置'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              需要允许浏览器访问您的位置权限
            </p>
          </div>

          {/* 搜索框 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              搜索地址
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="输入地址关键词..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <Button onClick={handleSearch} disabled={loading}>
                搜索
              </Button>
            </div>
          </div>

          {/* 手动输入坐标 */}
          <div>
            <Button
              onClick={handleManualInput}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              📍 手动输入坐标
            </Button>
          </div>

          {/* 位置信息显示 */}
          {(lat !== null && lng !== null) && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">坐标</label>
                  <p className="text-sm text-gray-600">
                    纬度: {lat.toFixed(6)}, 经度: {lng.toFixed(6)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">地址</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="地址信息"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
            <p className="font-medium mb-1">💡 使用说明：</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>点击"获取当前位置"使用浏览器原生定位</li>
              <li>搜索地址使用免费的OpenStreetMap服务</li>
              <li>可以手动输入坐标或编辑地址</li>
              <li>完全免费，无需API Key</li>
            </ul>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t flex gap-2">
          <Button onClick={handleConfirm} className="flex-1" disabled={!lat || !lng || !address}>
            确认选择
          </Button>
          <Button onClick={onClose} variant="outline">
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { stationApi, orderApi, addressApi } from '@/utils/api';
import { DeliveryStation, ServiceType, OrderForm, Address } from '@/types';
import { NativeLocationPicker } from '@/components/ui/NativeLocationPicker';
import { AddressSelector } from '@/components/ui/AddressSelector';
import { BackButton } from '@/components/ui/BackButton';

export default function OrderPage() {
  const [stations, setStations] = useState<DeliveryStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [addressHistory, setAddressHistory] = useState<Address[]>([]);
  const router = useRouter();

  const [formData, setFormData] = useState<OrderForm>({
    deliveryStationId: '',
    recipientName: '',
    recipientPhone: '',
    pickupCode: '',
    deliveryAddress: '',
    deliveryLat: undefined,
    deliveryLng: undefined,
    serviceType: 'STANDARD',
    isUrgent: false,
    remarks: '',
  });

  const [pricing, setPricing] = useState({
    basePrice: 8,
    distance: 0,
    distancePrice: 0,
    urgentFee: 0,
    totalPrice: 8,
  });

  // 加载快递站列表和地址历史
  useEffect(() => {
    const loadData = async () => {
      // 加载快递站
      const stationResponse = await stationApi.getStations();
      if (stationResponse.success && stationResponse.data) {
        const data = stationResponse.data as { stations?: DeliveryStation[] };
        setStations(data.stations || []);
      }

      // 加载地址历史（需要登录）
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const addressResponse = await addressApi.getAddresses();
            if (addressResponse.success && addressResponse.data) {
              const addressData = addressResponse.data as { addresses?: Address[] };
              setAddressHistory(addressData.addresses || []);
              
              // 如果有默认地址，自动填充
              const defaultAddress = addressData.addresses?.find(addr => addr.isDefault);
              if (defaultAddress) {
                setFormData(prev => ({
                  ...prev,
                  recipientName: defaultAddress.name,
                  recipientPhone: defaultAddress.phone,
                  deliveryAddress: `${defaultAddress.province}${defaultAddress.city}${defaultAddress.district}${defaultAddress.address}`,
                  deliveryLat: defaultAddress.latitude,
                  deliveryLng: defaultAddress.longitude,
                }));
              }
            }
          } catch (error) {
            console.error('加载地址历史失败:', error);
          }
        }
      }
    };

    loadData();
  }, []);

  // 计算价格
  const calculatePrice = async () => {
    if (!formData.deliveryLat || !formData.deliveryLng || !formData.deliveryStationId) {
      return;
    }

    setCalculating(true);

    try {
      // 查找选中的快递站
      const selectedStation = stations.find(s => s.id === formData.deliveryStationId);
      if (!selectedStation) return;

      // 计算距离 (简化版，实际应该使用地图API)
      const distance = Math.sqrt(
        Math.pow(formData.deliveryLat - selectedStation.latitude, 2) +
        Math.pow(formData.deliveryLng - selectedStation.longitude, 2)
      ) * 111; // 粗略转换为公里

      // 基础价格
      const basePrice = formData.serviceType === 'STANDARD' ? 8 :
                       formData.serviceType === 'EXPRESS' ? 12 : 15;

      // 距离费用 (每公里0.5元)
      const distancePrice = Math.max(0, (distance - 1) * 0.5);

      // 加急费用
      const urgentFee = formData.isUrgent ? 3 : 0;

      // 总价
      const totalPrice = basePrice + distancePrice + urgentFee;

      setPricing({
        basePrice,
        distance: Math.round(distance * 10) / 10,
        distancePrice: Math.round(distancePrice * 10) / 10,
        urgentFee,
        totalPrice: Math.round(totalPrice * 10) / 10,
      });
    } catch (error) {
      console.error('价格计算失败:', error);
    } finally {
      setCalculating(false);
    }
  };

  // 当表单数据改变时重新计算价格
  useEffect(() => {
    calculatePrice();
  }, [formData.deliveryLat, formData.deliveryLng, formData.deliveryStationId, formData.serviceType, formData.isUrgent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleMapSelect = () => {
    setShowMapPicker(true);
  };

  const handleAddressSelect = async (address: string, lat: number, lng: number) => {
    setFormData({
      ...formData,
      deliveryAddress: address,
      deliveryLat: lat,
      deliveryLng: lng,
    });
    setShowMapPicker(false);
    
    // 保存地址到历史记录（如果已登录且有收件人信息）
    if (formData.recipientName && formData.recipientPhone) {
      await saveAddressToHistory(address, lat, lng);
    }
  };

  const handleHistoryAddressSelect = (address: Address) => {
    setFormData({
      ...formData,
      recipientName: address.name,
      recipientPhone: address.phone,
      deliveryAddress: `${address.province}${address.city}${address.district}${address.address}`,
      deliveryLat: address.latitude,
      deliveryLng: address.longitude,
    });
    setShowAddressSelector(false);
  };

  const saveAddressToHistory = async (address: string, lat: number, lng: number) => {
    // 检查是否已登录
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // 检查是否已存在相同地址（通过经纬度判断，允许0.001度的误差）
      const existingAddress = addressHistory.find(addr => 
        addr.latitude && 
        addr.longitude &&
        Math.abs((addr.latitude - lat)) < 0.001 &&
        Math.abs((addr.longitude - lng)) < 0.001
      );

      if (existingAddress) {
        // 地址已存在，不重复保存
        return;
      }

      // 解析地址（简单解析，实际应该使用地理编码API）
      // 尝试从地址中提取省市区信息
      let province = '';
      let city = '';
      let district = '';
      let detailAddress = address;

      // 匹配省市区
      const provinceMatch = address.match(/(.*?省|.*?自治区|.*?特别行政区|.*?市)/);
      if (provinceMatch) {
        province = provinceMatch[1];
        const remaining = address.substring(province.length);
        const cityMatch = remaining.match(/(.*?市|.*?自治州|.*?地区)/);
        if (cityMatch) {
          city = cityMatch[1];
          const remaining2 = remaining.substring(city.length);
          const districtMatch = remaining2.match(/(.*?区|.*?县|.*?市)/);
          if (districtMatch) {
            district = districtMatch[1];
            detailAddress = remaining2.substring(district.length).trim();
          } else {
            detailAddress = remaining2.trim();
          }
        } else {
          detailAddress = remaining.trim();
        }
      }

      // 如果解析失败，使用默认值
      if (!province) {
        province = '未知省份';
        city = '未知城市';
        district = '未知区县';
        detailAddress = address;
      }

      // 创建新地址
      const response = await addressApi.createAddress({
        name: formData.recipientName,
        phone: formData.recipientPhone,
        province,
        city,
        district,
        address: detailAddress,
        latitude: lat,
        longitude: lng,
        isDefault: addressHistory.length === 0, // 第一个地址设为默认
      });

      if (response.success) {
        // 重新加载地址列表
        const addressResponse = await addressApi.getAddresses();
        if (addressResponse.success && addressResponse.data) {
          const data = addressResponse.data as { addresses?: Address[] };
          setAddressHistory(data.addresses || []);
        }
      }
    } catch (error) {
      console.error('保存地址到历史记录失败:', error);
      // 不显示错误提示，避免影响用户体验
    }
  };

      const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查是否已登录
    if (typeof window === 'undefined') {
      alert('请在浏览器中操作');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录后再提交订单');
      router.push('/auth/login');
      return;
    }

    setLoading(true);

    // 验证必填字段
    const errors: string[] = [];
    
    if (!formData.deliveryStationId) {
      errors.push('请选择快递站');
    }

    if (!formData.recipientName) {
      errors.push('请填写收件人姓名');
    }

    if (!formData.recipientPhone) {
      errors.push('请填写收件人电话');
    }

    if (!formData.deliveryAddress) {
      errors.push('请选择送达地址');
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
      setLoading(false);
      return;
    }

    try {
      // 如果地址还没有保存到历史记录，尝试保存
      if (formData.deliveryLat && formData.deliveryLng) {
        await saveAddressToHistory(formData.deliveryAddress, formData.deliveryLat, formData.deliveryLng);
      }

      // 准备提交数据，确保所有字段都有值
      const submitData: any = {
        deliveryStationId: formData.deliveryStationId.trim(),
        recipientName: formData.recipientName.trim(),
        recipientPhone: formData.recipientPhone.trim(),
        deliveryAddress: formData.deliveryAddress.trim(),
        serviceType: formData.serviceType,
        isUrgent: formData.isUrgent,
      };

      // 可选字段
      if (formData.pickupCode && formData.pickupCode.trim()) {
        submitData.pickupCode = formData.pickupCode.trim();
      }

      if (formData.deliveryLat !== undefined && formData.deliveryLng !== undefined) {
        submitData.deliveryLat = formData.deliveryLat;
        submitData.deliveryLng = formData.deliveryLng;
      }

      if (formData.remarks && formData.remarks.trim()) {
        submitData.remarks = formData.remarks.trim();
      }

      const response = await orderApi.createOrder(submitData);

      if (response.success && response.data) {
        // 跳转到订单详情页面
        const data = response.data as { order: { id: string } };
        if (data.order && data.order.id) {
          router.push(`/orders/${data.order.id}`);
        } else {
          alert('订单创建成功，但无法获取订单ID');
        }
      } else {
        const errorMsg = response.error || '创建订单失败';
        
        // 如果是认证相关错误，跳转到登录页
        if (errorMsg.includes('登录') || 
            errorMsg.includes('认证') || 
            errorMsg.includes('令牌') ||
            errorMsg.includes('访问令牌缺失') ||
            errorMsg.includes('请先登录')) {
          alert('登录已过期，请重新登录');
          // 清除可能无效的token
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
          router.push('/auth/login');
        } else {
          alert(errorMsg);
        }
      }
    } catch (error: any) {
      console.error('提交订单失败:', error);
      alert(error?.message || '创建订单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton href="/" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">创建订单</h1>
          <p className="mt-2 text-gray-600">填写订单信息，快速下单</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 订单表单 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">订单信息</h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 快递站选择 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择快递站
                    </label>
                    <select
                      name="deliveryStationId"
                      value={formData.deliveryStationId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">请选择快递站</option>
                      {stations.map(station => (
                        <option key={station.id} value={station.id}>
                          {station.name} - {station.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 收件人信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="收件人姓名"
                      name="recipientName"
                      placeholder="请输入收件人姓名"
                      value={formData.recipientName}
                      onChange={handleChange}
                      required
                    />

                    <Input
                      label="收件人电话"
                      name="recipientPhone"
                      type="tel"
                      placeholder="请输入收件人电话"
                      value={formData.recipientPhone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* 取件码 */}
                  <Input
                    label="取件码（可选）"
                    name="pickupCode"
                    placeholder="请输入快递取件码"
                    value={formData.pickupCode}
                    onChange={handleChange}
                  />

                  {/* 送达地址 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      送达地址
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        name="deliveryAddress"
                        placeholder="请选择送达地址"
                        value={formData.deliveryAddress}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        readOnly
                      />
                      {addressHistory.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddressSelector(true)}
                        >
                          历史地址
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleMapSelect}
                      >
                        选择地址
                      </Button>
                    </div>
                    {addressHistory.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        已保存 {addressHistory.length} 个地址，可从历史记录中选择
                      </p>
                    )}
                  </div>

                  {/* 服务类型 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      服务类型
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <label className="relative">
                        <input
                          type="radio"
                          name="serviceType"
                          value="STANDARD"
                          checked={formData.serviceType === 'STANDARD'}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className={`p-4 border rounded-lg cursor-pointer ${
                          formData.serviceType === 'STANDARD'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}>
                          <div className="font-medium">标准快递</div>
                          <div className="text-sm text-gray-600">常规时效</div>
                        </div>
                      </label>

                      <label className="relative">
                        <input
                          type="radio"
                          name="serviceType"
                          value="EXPRESS"
                          checked={formData.serviceType === 'EXPRESS'}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className={`p-4 border rounded-lg cursor-pointer ${
                          formData.serviceType === 'EXPRESS'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}>
                          <div className="font-medium">加急快递</div>
                          <div className="text-sm text-gray-600">快速送达</div>
                        </div>
                      </label>

                      <label className="relative">
                        <input
                          type="radio"
                          name="serviceType"
                          value="PREMIUM"
                          checked={formData.serviceType === 'PREMIUM'}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className={`p-4 border rounded-lg cursor-pointer ${
                          formData.serviceType === 'PREMIUM'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}>
                          <div className="font-medium">特快专递</div>
                          <div className="text-sm text-gray-600">最快时效</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* 加急服务 */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isUrgent"
                      checked={formData.isUrgent}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      加急服务 (+¥3)
                    </label>
                  </div>

                  {/* 备注 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      备注（可选）
                    </label>
                    <textarea
                      name="remarks"
                      rows={3}
                      placeholder="请输入备注信息"
                      value={formData.remarks}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? '提交中...' : '提交订单'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 价格明细 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">价格明细</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>基础费用</span>
                    <span>¥{pricing.basePrice}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>距离费用 ({pricing.distance}km)</span>
                    <span>¥{pricing.distancePrice}</span>
                  </div>

                  {pricing.urgentFee > 0 && (
                    <div className="flex justify-between">
                      <span>加急费用</span>
                      <span>¥{pricing.urgentFee}</span>
                    </div>
                  )}

                  <hr className="my-3" />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>总计</span>
                    <span className="text-blue-600">¥{pricing.totalPrice}</span>
                  </div>

                  {calculating && (
                    <div className="text-center text-sm text-gray-500">
                      计算中...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 地址选择器 */}
      {showMapPicker && (
        <NativeLocationPicker
          onSelect={handleAddressSelect}
          onClose={() => setShowMapPicker(false)}
          initialAddress={formData.deliveryAddress}
          initialLat={formData.deliveryLat}
          initialLng={formData.deliveryLng}
        />
      )}

      {/* 地址历史选择器 */}
      {showAddressSelector && (
        <AddressSelector
          onSelect={handleHistoryAddressSelect}
          onClose={() => setShowAddressSelector(false)}
        />
      )}
    </div>
  );
}
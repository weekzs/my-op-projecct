'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Address } from '@/types';
import { addressApi } from '@/utils/api';
import { BackButton } from '@/components/ui/BackButton';

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    loadAddresses();
  }, [router]);

  // 加载地址列表
  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await addressApi.getAddresses();
      if (response.success && response.data) {
        const data = response.data as { addresses?: Address[] };
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error('加载地址失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 打开添加表单
  const handleAddClick = () => {
    setEditingAddress(null);
    setFormData({
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      address: '',
    });
    setErrors({});
    setShowForm(true);
  };

  // 打开编辑表单
  const handleEditClick = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      address: address.address,
    });
    setErrors({});
    setShowForm(true);
  };

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '收件人姓名不能为空';
    if (!formData.phone.trim()) newErrors.phone = '联系电话不能为空';
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) newErrors.phone = '请输入正确的手机号码';
    if (!formData.province.trim()) newErrors.province = '省份不能为空';
    if (!formData.city.trim()) newErrors.city = '城市不能为空';
    if (!formData.district.trim()) newErrors.district = '区县不能为空';
    if (!formData.address.trim()) newErrors.address = '详细地址不能为空';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingAddress) {
        // 更新地址
        const response = await addressApi.updateAddress(editingAddress.id, formData);
        if (response.success) {
          await loadAddresses();
          setShowForm(false);
          setEditingAddress(null);
        } else {
          alert(response.error || '更新地址失败');
        }
      } else {
        // 创建地址
        const response = await addressApi.createAddress(formData);
        if (response.success) {
          await loadAddresses();
          setShowForm(false);
          setFormData({
            name: '',
            phone: '',
            province: '',
            city: '',
            district: '',
            address: '',
          });
        } else {
          alert(response.error || '创建地址失败');
        }
      }
    } catch (error) {
      console.error('提交地址失败:', error);
      alert('操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除地址
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个地址吗？')) return;

    try {
      const response = await addressApi.deleteAddress(id);
      if (response.success) {
        await loadAddresses();
      } else {
        alert(response.error || '删除地址失败');
      }
    } catch (error) {
      console.error('删除地址失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 设置默认地址
  const handleSetDefault = async (id: string) => {
    try {
      const response = await addressApi.setDefaultAddress(id);
      if (response.success) {
        await loadAddresses();
      } else {
        alert(response.error || '设置默认地址失败');
      }
    } catch (error) {
      console.error('设置默认地址失败:', error);
      alert('设置失败，请重试');
    }
  };

  // 格式化地址
  const formatAddress = (address: Address) => {
    return `${address.province}${address.city}${address.district}${address.address}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">📍 地址管理</h1>
        </div>

        {/* 地址列表 */}
        <div className="space-y-4 mb-6">
          {addresses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <p className="text-lg">暂无地址</p>
                <p className="text-sm mt-2">点击下方按钮添加地址</p>
              </CardContent>
            </Card>
          ) : (
            addresses.map((address) => (
              <Card key={address.id} className={address.isDefault ? 'border-blue-500 border-2' : ''}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-lg">{address.name}</span>
                        <span className="text-gray-600">{address.phone}</span>
                        {address.isDefault && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            默认
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700">{formatAddress(address)}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!address.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                        >
                          设默认
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(address)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 添加/编辑表单 */}
        {showForm ? (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">
                {editingAddress ? '编辑地址' : '添加新地址'}
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="收件人姓名 *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={errors.name}
                    required
                  />
                  <Input
                    label="联系电话 *"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    error={errors.phone}
                    placeholder="11位手机号码"
                    required
                  />
                  <Input
                    label="省份 *"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    error={errors.province}
                    required
                  />
                  <Input
                    label="城市 *"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    error={errors.city}
                    required
                  />
                  <Input
                    label="区县 *"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    error={errors.district}
                    required
                  />
                  <div></div>
                </div>
                <Input
                  label="详细地址 *"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  error={errors.address}
                  placeholder="街道、门牌号等"
                  required
                />
                <div className="flex gap-4 mt-6">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? '提交中...' : editingAddress ? '更新地址' : '添加地址'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAddress(null);
                      setErrors({});
                    }}
                  >
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Button onClick={handleAddClick} className="w-full">
            ➕ 添加新地址
          </Button>
        )}
      </div>
    </div>
  );
}

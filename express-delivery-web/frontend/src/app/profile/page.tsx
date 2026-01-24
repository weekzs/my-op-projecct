'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { User } from '@/types';
import { orderApi } from '@/utils/api';
import { BackButton } from '@/components/ui/BackButton';

interface OrderStats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
  totalSpent: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<OrderStats | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // 从localStorage获取用户信息
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const userInfo = JSON.parse(userData);
          setUser(userInfo);
          setFormData({
            nickname: userInfo.nickname || '',
          });
        } catch (error) {
          console.error('解析用户信息失败:', error);
        }
      }

      // 加载订单统计
      try {
        const response = await orderApi.getOrderStats();
        if (response.success) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    };

    loadData();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // 这里应该调用API更新用户信息
      console.log('更新用户信息:', formData);

      // 更新本地存储
      if (user) {
        const updatedUser = { ...user, nickname: formData.nickname };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      setEditing(false);
    } catch (error) {
      console.error('更新失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nickname: user?.nickname || '',
    });
    setEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">请先登录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton href="/" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">个人中心</h1>
          <p className="mt-2 text-gray-600">管理您的账户信息</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 基本信息 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">基本信息</h2>
                  {!editing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      编辑
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-4">
                    <Input
                      label="手机号"
                      value={user.phone}
                      disabled
                    />

                    <Input
                      label="昵称"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder="请输入昵称"
                    />

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        disabled={loading}
                      >
                        {loading ? '保存中...' : '保存'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">手机号</label>
                      <p className="mt-1 text-gray-900">{user.phone}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">昵称</label>
                      <p className="mt-1 text-gray-900">{user.nickname || '未设置'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">注册时间</label>
                      <p className="mt-1 text-gray-900">
                        {new Date(user.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 统计信息 */}
          <div>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">统计信息</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats?.total || 0}</div>
                    <div className="text-sm text-gray-600">总订单数</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">¥{stats?.totalSpent?.toFixed(2) || '0.00'}</div>
                    <div className="text-sm text-gray-600">累计消费</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{stats?.completed || 0}</div>
                    <div className="text-sm text-gray-600">完成订单</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快捷操作 */}
            <Card className="mt-6">
              <CardHeader>
                <h2 className="text-xl font-semibold">快捷操作</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href="/addresses">
                    <Button variant="outline" className="w-full justify-start">
                      📍 地址管理
                    </Button>
                  </Link>
                  <Link href="/payments">
                    <Button variant="outline" className="w-full justify-start">
                      💳 支付记录
                    </Button>
                  </Link>
                  <Link href="/reviews">
                    <Button variant="outline" className="w-full justify-start">
                      ⭐ 我的评价
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start">
                    📞 联系客服
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Order, OrderStatus } from '@/types';
import { orderApi } from '@/utils/api';
import { BackButton } from '@/components/ui/BackButton';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');

  // 加载订单数据
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await orderApi.getOrders();
        if (response.success) {
          setOrders(response.data.orders || []);
        }
      } catch (error) {
        console.error('加载订单失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const getStatusText = (status: OrderStatus) => {
    const statusMap = {
      PENDING: '待处理',
      CONFIRMED: '已确认',
      PICKING_UP: '取件中',
      IN_TRANSIT: '配送中',
      DELIVERED: '已送达',
      COMPLETED: '已完成',
      CANCELLED: '已取消'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: OrderStatus) => {
    const colorMap = {
      PENDING: 'text-yellow-600 bg-yellow-100',
      CONFIRMED: 'text-blue-600 bg-blue-100',
      PICKING_UP: 'text-orange-600 bg-orange-100',
      IN_TRANSIT: 'text-purple-600 bg-purple-100',
      DELIVERED: 'text-green-600 bg-green-100',
      COMPLETED: 'text-gray-600 bg-gray-100',
      CANCELLED: 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  const filteredOrders = filter === 'ALL'
    ? orders
    : orders.filter(order => order.status === filter);

  // 重新加载订单
  const reloadOrders = async () => {
    try {
      const response = await orderApi.getOrders(filter !== 'ALL' ? filter : undefined);
      if (response.success) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('重新加载订单失败:', error);
    }
  };

  // 处理状态更新
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await orderApi.updateOrderStatus(orderId, newStatus);
      if (response.success) {
        await reloadOrders(); // 重新加载订单
      } else {
        alert(response.error || '更新状态失败');
      }
    } catch (error) {
      console.error('更新订单状态失败:', error);
      alert('更新状态失败');
    }
  };

  // 处理取消订单
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('确定要取消这个订单吗？')) return;

    try {
      const response = await orderApi.cancelOrder(orderId);
      if (response.success) {
        await reloadOrders();
      } else {
        alert(response.error || '取消订单失败');
      }
    } catch (error) {
      console.error('取消订单失败:', error);
      alert('取消订单失败');
    }
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton href="/" />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">我的订单</h1>
              <p className="mt-2 text-gray-600">查看和管理您的快递订单</p>
            </div>
            <Link href="/order">
              <Button>创建新订单</Button>
            </Link>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'ALL', label: '全部' },
              { value: 'PENDING', label: '待处理' },
              { value: 'CONFIRMED', label: '已确认' },
              { value: 'PICKING_UP', label: '取件中' },
              { value: 'IN_TRANSIT', label: '配送中' },
              { value: 'DELIVERED', label: '已送达' },
              { value: 'COMPLETED', label: '已完成' },
              { value: 'CANCELLED', label: '已取消' }
            ].map(item => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value as OrderStatus | 'ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === item.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 订单列表 */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">暂无订单</p>
                <Link href="/order" className="mt-4 inline-block">
                  <Button variant="outline">创建第一个订单</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map(order => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        订单 #{order.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">快递站</p>
                      <p className="font-medium">{order.deliveryStation?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">收件人</p>
                      <p className="font-medium">{order.recipientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">服务类型</p>
                      <p className="font-medium">
                        {order.serviceType === 'STANDARD' ? '标准快递' :
                         order.serviceType === 'EXPRESS' ? '加急快递' : '特快专递'}
                        {order.isUrgent && ' (加急)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">总价</p>
                      <p className="font-medium text-blue-600">¥{order.totalPrice}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      送达地址：{order.deliveryAddress}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          查看详情
                        </Button>
                      </Link>
                      {order.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          取消订单
                        </Button>
                      )}
                      {order.paymentStatus === 'UNPAID' && (
                        <Link href={`/orders/${order.id}`}>
                          <Button size="sm">
                            立即支付
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
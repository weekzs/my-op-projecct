'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Payment, PaymentStatus } from '@/types';
import { paymentApi } from '@/utils/api';
import { BackButton } from '@/components/ui/BackButton';

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PaymentStatus | 'ALL'>('ALL');

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    loadPayments();
  }, [router]);

  // 加载支付记录
  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentApi.getPaymentHistory();
      if (response.success && response.data) {
        const data = response.data as { payments?: Payment[] };
        // 按创建时间倒序排列
        const sortedPayments = (data.payments || []).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPayments(sortedPayments);
      }
    } catch (error) {
      console.error('加载支付记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取状态文本
  const getStatusText = (status: PaymentStatus) => {
    const statusMap = {
      UNPAID: '未支付',
      PENDING: '支付中',
      PAID: '已支付',
      REFUNDED: '已退款',
      FAILED: '支付失败'
    };
    return statusMap[status] || status;
  };

  // 获取状态颜色
  const getStatusColor = (status: PaymentStatus) => {
    const colorMap = {
      UNPAID: 'text-yellow-600 bg-yellow-100',
      PENDING: 'text-blue-600 bg-blue-100',
      PAID: 'text-green-600 bg-green-100',
      REFUNDED: 'text-gray-600 bg-gray-100',
      FAILED: 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  // 获取支付方式文本
  const getPaymentMethodText = (method: string) => {
    const methodMap: Record<string, string> = {
      wechat: '微信支付',
      alipay: '支付宝',
      mock: '模拟支付',
      card: '银行卡'
    };
    return methodMap[method] || method;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化金额
  const formatAmount = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  const filteredPayments = filter === 'ALL'
    ? payments
    : payments.filter(payment => payment.status === filter);

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
          <h1 className="text-3xl font-bold text-gray-900 mt-4">💳 支付记录</h1>
        </div>

        {/* 筛选器 */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            全部
          </button>
          {(['UNPAID', 'PENDING', 'PAID', 'REFUNDED', 'FAILED'] as PaymentStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {getStatusText(status)}
            </button>
          ))}
        </div>

        {/* 支付记录列表 */}
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <p className="text-lg">暂无支付记录</p>
                <p className="text-sm mt-2">
                  {filter === 'ALL' 
                    ? '您还没有任何支付记录' 
                    : `没有${getStatusText(filter)}的记录`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPayments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </span>
                        <span className="text-gray-600 text-sm">
                          {getPaymentMethodText(payment.paymentMethod)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatAmount(payment.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          订单号: <Link href={`/orders/${payment.orderId}`} className="text-blue-600 hover:underline">
                            {payment.orderId}
                          </Link>
                        </p>
                        {payment.transactionId && (
                          <p className="text-sm text-gray-600">
                            交易号: {payment.transactionId}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          创建时间: {formatDate(payment.createdAt)}
                        </p>
                        {payment.paidAt && (
                          <p className="text-sm text-gray-500">
                            支付时间: {formatDate(payment.paidAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Link href={`/orders/${payment.orderId}`}>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          查看订单
                        </button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 统计信息 */}
        {payments.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">总记录数</p>
                  <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">已支付</p>
                  <p className="text-2xl font-bold text-green-600">
                    {payments.filter(p => p.status === 'PAID').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">总金额</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatAmount(
                      payments
                        .filter(p => p.status === 'PAID')
                        .reduce((sum, p) => sum + p.amount, 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">待支付</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {payments.filter(p => p.status === 'UNPAID' || p.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

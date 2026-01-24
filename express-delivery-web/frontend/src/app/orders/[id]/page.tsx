'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { PaymentModal } from '@/components/ui/PaymentModal';
import { orderApi, paymentApi, reviewApi } from '@/utils/api';
import { Order, OrderStatus, Payment } from '@/types';
import { BackButton } from '@/components/ui/BackButton';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'mock'>('mock');

  const orderId = params.id as string;

  // 加载订单详情
  useEffect(() => {
    const loadOrderDetail = async () => {
      try {
        const [orderResponse, paymentResponse] = await Promise.all([
          orderApi.getOrder(orderId),
          paymentApi.getPaymentHistory()
        ]);

        if (orderResponse.success && orderResponse.data) {
          const orderData = orderResponse.data as { order: Order };
          setOrder(orderData.order);
        }

        if (paymentResponse.success && paymentResponse.data) {
          // 找到对应的支付记录
          const paymentData = paymentResponse.data as { payments?: Payment[] };
          const paymentRecord = paymentData.payments?.find(
            (p: Payment) => p.orderId === orderId
          );
          setPayment(paymentRecord || null);
        }
      } catch (error) {
        console.error('加载订单详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrderDetail();
    }
  }, [orderId]);

  // 处理支付
  const handlePayment = async () => {
    if (!order) return;

    setActionLoading(true);
    try {
      // 检测环境，决定使用哪种支付方式
      const isWeChat = typeof window !== 'undefined' && 
        (/micromessenger/i.test(navigator.userAgent) || (window as any).wx);
      
      const method = isWeChat ? 'wechat' : 'mock';
      setPaymentMethod(method);

      const response = await paymentApi.createPayment({ 
        orderId: order.id,
        paymentMethod: method
      });

      if (response.success && response.data) {
        const paymentData = response.data;
        
        // 更新支付记录
        if (paymentData.payment) {
          setPayment(paymentData.payment);
        }

        // 如果是模拟支付，显示支付确认弹窗
        if (method === 'mock' || paymentData.paymentMethod === 'mock') {
          setShowPaymentModal(true);
          setActionLoading(false);
          return;
        }

        // 微信支付流程
        if (paymentData.wechatParams) {
          const params = paymentData.wechatParams;
          const paymentId = paymentData.payment?.id;

          if (isWeChat && (window as any).wx) {
            // 微信环境，使用 wx.requestPayment
            (window as any).wx.ready(() => {
              (window as any).wx.requestPayment({
                appId: params.appId || params.appid,
                timeStamp: params.timeStamp,
                nonceStr: params.nonceStr,
                package: params.package,
                signType: params.signType || 'RSA',
                paySign: params.paySign,
                success: async (res: any) => {
                  if (paymentId) {
                    await pollPaymentStatus(paymentId);
                  } else {
                    alert('支付成功！');
                    window.location.reload();
                  }
                },
                fail: (res: any) => {
                  if (res.errMsg && res.errMsg.includes('cancel')) {
                    alert('支付已取消');
                  } else {
                    alert('支付失败：' + (res.errMsg || JSON.stringify(res)));
                  }
                  setActionLoading(false);
                },
                cancel: () => {
                  alert('支付已取消');
                  setActionLoading(false);
                }
              });
            });
          } else {
            alert('请在微信中打开进行支付');
            setActionLoading(false);
          }
        } else {
          alert(response.error || '创建支付失败');
          setActionLoading(false);
        }
      } else {
        alert(response.error || '创建支付失败');
        setActionLoading(false);
      }
    } catch (error) {
      console.error('支付失败:', error);
      alert('支付失败，请重试');
      setActionLoading(false);
    }
  };

  // 支付成功回调
  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    window.location.reload();
  };

  // 取消支付
  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setActionLoading(false);
  };

  // 轮询支付状态
  const pollPaymentStatus = async (paymentId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 最多轮询30次（约30秒）

    const poll = async () => {
      try {
        const response = await paymentApi.queryPaymentStatus(paymentId);
        if (response.success && response.data) {
          const paymentData = response.data as Payment;
          
          if (paymentData.status === 'PAID') {
            // 支付成功
            setPayment(paymentData);
            if (order) {
              setOrder({ ...order, paymentStatus: 'PAID' });
            }
            alert('支付成功！');
            window.location.reload();
            return;
          } else if (paymentData.status === 'FAILED') {
            alert('支付失败');
            setActionLoading(false);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          // 继续轮询
          setTimeout(poll, 1000);
        } else {
          // 超时，提示用户手动刷新
          alert('支付处理中，请稍后刷新页面查看支付状态');
          setActionLoading(false);
        }
      } catch (error) {
        console.error('查询支付状态失败:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          alert('查询支付状态失败，请手动刷新页面');
          setActionLoading(false);
        }
      }
    };

    // 开始轮询
    poll();
  };

  // 处理取消订单
  const handleCancelOrder = async () => {
    if (!confirm('确定要取消这个订单吗？')) return;

    setActionLoading(true);
    try {
      const response = await orderApi.cancelOrder(orderId);
      if (response.success) {
        setOrder({ ...order!, status: 'CANCELLED' });
      } else {
        alert(response.error || '取消订单失败');
      }
    } catch (error) {
      console.error('取消订单失败:', error);
      alert('取消订单失败');
    } finally {
      setActionLoading(false);
    }
  };

  // 处理确认收货
  const handleConfirmDelivery = async () => {
    if (!confirm('确认已收到快递吗？')) return;

    setActionLoading(true);
    try {
      const response = await orderApi.updateOrderStatus(orderId, 'COMPLETED');
      if (response.success) {
        setOrder({ ...order!, status: 'COMPLETED' });
      } else {
        alert(response.error || '确认收货失败');
      }
    } catch (error) {
      console.error('确认收货失败:', error);
      alert('确认收货失败');
    } finally {
      setActionLoading(false);
    }
  };

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

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">订单不存在</p>
          <Link href="/orders" className="mt-4 inline-block">
            <Button variant="outline">返回订单列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton href="/orders" label="返回订单列表" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            订单详情 #{order.id.slice(-8)}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 订单信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">订单信息</h2>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">快递站信息</h3>
                    <p className="text-gray-600">{order.deliveryStation?.name}</p>
                    <p className="text-gray-600">{order.deliveryStation?.address}</p>
                    <p className="text-gray-600">{order.deliveryStation?.phone}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">收件人信息</h3>
                    <p className="text-gray-600">{order.recipientName}</p>
                    <p className="text-gray-600">{order.recipientPhone}</p>
                    {order.pickupCode && (
                      <p className="text-gray-600">取件码: {order.pickupCode}</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">服务信息</h3>
                    <p className="text-gray-600">
                      服务类型: {
                        order.serviceType === 'STANDARD' ? '标准快递' :
                        order.serviceType === 'EXPRESS' ? '加急快递' : '特快专递'
                      }
                    </p>
                    {order.isUrgent && (
                      <p className="text-gray-600">加急服务: 是 (+¥3)</p>
                    )}
                    <p className="text-gray-600">距离: {order.distance}km</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">时间信息</h3>
                    <p className="text-gray-600">下单时间: {new Date(order.createdAt).toLocaleString('zh-CN')}</p>
                    {order.completedAt && (
                      <p className="text-gray-600">完成时间: {new Date(order.completedAt).toLocaleString('zh-CN')}</p>
                    )}
                  </div>
                </div>

                {order.remarks && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-2">备注</h3>
                    <p className="text-gray-600">{order.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 送达地址 */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">送达地址</h2>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900">{order.deliveryAddress}</p>
              </CardContent>
            </Card>

            {/* 评价信息 */}
            {order.review && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">订单评价</h2>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${star <= order.review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="ml-2 text-gray-600">
                      {new Date(order.review.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  {order.review.content && (
                    <p className="text-gray-700">{order.review.content}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 操作面板 */}
          <div className="space-y-6">
            {/* 价格明细 */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">价格明细</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>基础费用</span>
                    <span>¥{order.basePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>距离费用 ({order.distance}km)</span>
                    <span>¥{order.distancePrice}</span>
                  </div>
                  {order.urgentFee > 0 && (
                    <div className="flex justify-between">
                      <span>加急费用</span>
                      <span>¥{order.urgentFee}</span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>总计</span>
                    <span className="text-blue-600">¥{order.totalPrice}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 支付信息 */}
            {payment && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">支付信息</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>支付状态</span>
                      <span className={`font-medium ${
                        payment.status === 'PAID' ? 'text-green-600' :
                        payment.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {payment.status === 'PAID' ? '已支付' :
                         payment.status === 'PENDING' ? '支付中' : '未支付'}
                      </span>
                    </div>
                    {payment.paidAt && (
                      <div className="flex justify-between">
                        <span>支付时间</span>
                        <span>{new Date(payment.paidAt).toLocaleString('zh-CN')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 操作按钮 */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">操作</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.paymentStatus === 'UNPAID' && order.status !== 'CANCELLED' && (
                    <Button
                      className="w-full"
                      onClick={handlePayment}
                      disabled={actionLoading}
                    >
                      {actionLoading ? '处理中...' : '立即支付'}
                    </Button>
                  )}

                  {order.status === 'PENDING' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleCancelOrder}
                      disabled={actionLoading}
                    >
                      取消订单
                    </Button>
                  )}

                  {order.status === 'DELIVERED' && (
                    <Button
                      className="w-full"
                      onClick={handleConfirmDelivery}
                      disabled={actionLoading}
                    >
                      确认收货
                    </Button>
                  )}

                  {order.status === 'COMPLETED' && !order.review && (
                    <Link href={`/orders/${order.id}/review`}>
                      <Button variant="outline" className="w-full">
                        评价订单
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 支付确认弹窗 */}
      {showPaymentModal && order && payment && (
        <PaymentModal
          orderId={order.id}
          amount={order.totalPrice}
          paymentId={payment.id}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
}
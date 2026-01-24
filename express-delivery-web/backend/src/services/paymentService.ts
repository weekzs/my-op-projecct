import { prisma } from '../server';
import { wechatPayService } from './wechatPayService';
import { mockPaymentService } from './mockPaymentService';

// 支付方式类型
export type PaymentMethod = 'wechat' | 'mock' | 'alipay' | 'stripe';

export class PaymentService {
  // 创建支付订单
  async createPayment(
    orderId: string, 
    amount: number, 
    description: string, 
    paymentMethod: PaymentMethod = 'mock',
    openid?: string
  ) {
    try {
      // 根据支付方式选择不同的服务
      switch (paymentMethod) {
        case 'wechat':
          return await wechatPayService.createPayment(orderId, amount, description, openid);
        
        case 'mock':
          return await mockPaymentService.createPayment(orderId, amount, description);
        
        // 可以扩展其他支付方式
        case 'alipay':
          // TODO: 实现支付宝支付
          throw new Error('支付宝支付暂未实现');
        
        case 'stripe':
          // TODO: 实现Stripe支付
          throw new Error('Stripe支付暂未实现');
        
        default:
          throw new Error(`不支持的支付方式: ${paymentMethod}`);
      }
    } catch (error) {
      console.error('创建支付订单失败:', error);
      throw error;
    }
  }

  // 查询支付状态
  async queryPaymentStatus(paymentId: string) {
    try {
      // 先查询支付记录，确定支付方式
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new Error('支付记录不存在');
      }

      // 根据支付方式查询状态
      switch (payment.paymentMethod) {
        case 'wechat':
          return await wechatPayService.queryPaymentStatus(paymentId);
        
        case 'mock':
          return await mockPaymentService.queryPaymentStatus(paymentId);
        
        default:
          // 默认查询数据库状态
          return {
            paymentId: payment.id,
            status: payment.status,
            amount: payment.amount,
            paidAt: payment.paidAt
          };
      }
    } catch (error) {
      console.error('查询支付状态失败:', error);
      throw error;
    }
  }

  // 处理支付回调
  async handlePaymentCallback(callbackData: any, paymentMethod: PaymentMethod = 'wechat') {
    try {
      switch (paymentMethod) {
        case 'wechat':
          return await wechatPayService.handlePaymentCallback(callbackData);
        
        case 'mock':
          // 模拟支付不需要回调
          return { success: false, message: '模拟支付不需要回调' };
        
        default:
          throw new Error(`不支持的支付方式: ${paymentMethod}`);
      }
    } catch (error) {
      console.error('处理支付回调失败:', error);
      throw error;
    }
  }

  // 确认支付（用于模拟支付）
  async confirmPayment(paymentId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new Error('支付记录不存在');
      }

      if (payment.paymentMethod === 'mock') {
        return await mockPaymentService.confirmPayment(paymentId);
      }

      throw new Error('只有模拟支付可以使用此方法');
    } catch (error) {
      console.error('确认支付失败:', error);
      throw error;
    }
  }

  // 取消支付
  async cancelPayment(paymentId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new Error('支付记录不存在');
      }

      if (payment.paymentMethod === 'mock') {
        return await mockPaymentService.cancelPayment(paymentId);
      }

      throw new Error('只有模拟支付可以使用此方法');
    } catch (error) {
      console.error('取消支付失败:', error);
      throw error;
    }
  }

  // 申请退款
  async refundPayment(paymentId: string, amount: number, reason: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true }
      });

      if (!payment) {
        throw new Error('支付记录不存在');
      }

      if (payment.status !== 'PAID') {
        throw new Error('订单未支付，无法退款');
      }

      // 目前只有微信支付支持退款
      if (payment.paymentMethod === 'wechat') {
        return await wechatPayService.refundPayment(paymentId, amount, reason);
      }

      // 模拟支付直接更新状态
      if (payment.paymentMethod === 'mock') {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'REFUNDED' }
        });

        await prisma.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: 'REFUNDED' }
        });

        return {
          refundId: `refund_${Date.now()}`,
          status: 'SUCCESS',
          message: '退款成功（模拟）'
        };
      }

      throw new Error(`不支持${payment.paymentMethod}支付的退款`);
    } catch (error) {
      console.error('申请退款失败:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();

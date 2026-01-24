import { prisma } from '../server';

/**
 * 模拟支付服务
 * 用于开发和测试环境，不依赖第三方支付平台
 */
export class MockPaymentService {
  // 创建支付订单
  async createPayment(orderId: string, amount: number, description: string) {
    try {
      // 检查订单是否存在
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.paymentStatus !== 'UNPAID') {
        throw new Error('订单已支付或状态异常');
      }

      // 检查是否已存在支付记录
      let payment = await prisma.payment.findUnique({
        where: { orderId }
      });

      if (payment) {
        if (payment.status === 'PAID') {
          throw new Error('该订单已支付');
        }
        // 更新现有支付记录
        payment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            amount,
            status: 'PENDING',
            paymentMethod: 'mock'
          }
        });
      } else {
        // 创建新的支付记录
        payment = await prisma.payment.create({
          data: {
            orderId,
            amount,
            paymentMethod: 'mock',
            status: 'PENDING'
          }
        });
      }

      // 生成支付链接（模拟）
      const paymentUrl = `/payment/mock/${payment.id}`;

      return {
        payment,
        paymentUrl,
        qrCode: `data:image/svg+xml;base64,${Buffer.from(`
          <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
            <rect width="200" height="200" fill="#f0f0f0"/>
            <text x="100" y="100" text-anchor="middle" font-size="14">模拟支付</text>
            <text x="100" y="120" text-anchor="middle" font-size="12">¥${amount}</text>
          </svg>
        `).toString('base64')}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30分钟过期
      };
    } catch (error: any) {
      console.error('创建模拟支付订单失败:', error);
      throw new Error(error.message || '创建支付订单失败');
    }
  }

  // 查询支付状态
  async queryPaymentStatus(paymentId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true }
      });

      if (!payment) {
        throw new Error('支付记录不存在');
      }

      return {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        paidAt: payment.paidAt
      };
    } catch (error: any) {
      console.error('查询支付状态失败:', error);
      throw new Error(error.message || '查询支付状态失败');
    }
  }

  // 确认支付（模拟）
  async confirmPayment(paymentId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true }
      });

      if (!payment) {
        throw new Error('支付记录不存在');
      }

      if (payment.status === 'PAID') {
        return { success: true, message: '订单已支付' };
      }

      // 更新支付状态
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          transactionId: `MOCK_${Date.now()}`
        }
      });

      // 更新订单状态
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
          status: payment.order.status === 'PENDING' ? 'CONFIRMED' : payment.order.status
        }
      });

      return {
        success: true,
        message: '支付成功',
        paymentId: payment.id
      };
    } catch (error: any) {
      console.error('确认支付失败:', error);
      throw new Error(error.message || '确认支付失败');
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

      if (payment.status === 'PAID') {
        throw new Error('订单已支付，无法取消');
      }

      // 更新支付状态为失败
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED'
        }
      });

      return {
        success: true,
        message: '支付已取消'
      };
    } catch (error: any) {
      console.error('取消支付失败:', error);
      throw new Error(error.message || '取消支付失败');
    }
  }
}

export const mockPaymentService = new MockPaymentService();

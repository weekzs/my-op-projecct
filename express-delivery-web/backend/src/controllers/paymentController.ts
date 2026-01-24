import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { prisma } from '../server';
import { authenticateToken } from '../middleware/auth';

export class PaymentController {
  // 创建支付订单
  async createPayment(req: Request & { user?: any }, res: Response) {
    try {
      const { orderId, paymentMethod = 'mock' } = req.body;

      if (!orderId) {
        return res.status(400).json({ message: '订单ID不能为空' });
      }

      // 获取订单信息
      const order = await prisma.order.findUnique({
        where: { id: orderId, userId: req.user!.id },
        include: { deliveryStation: true }
      });

      if (!order) {
        return res.status(404).json({ message: '订单不存在' });
      }

      if (order.paymentStatus !== 'UNPAID') {
        return res.status(400).json({ message: '订单已支付或状态异常' });
      }

      const description = `快递服务 - ${order.deliveryStation?.name}`;

      const result = await paymentService.createPayment(
        orderId,
        order.totalPrice,
        description,
        paymentMethod
      );

      // 构建响应对象，根据支付方式返回不同的参数
      const response: any = {
        success: true,
        payment: result.payment,
        paymentMethod
      };

      // 微信支付返回 wechatParams
      if ('wechatParams' in result) {
        response.wechatParams = result.wechatParams;
      }

      // 模拟支付返回 paymentUrl, qrCode, expiresAt
      if ('paymentUrl' in result) {
        response.paymentUrl = result.paymentUrl;
        response.qrCode = result.qrCode;
        response.expiresAt = result.expiresAt;
      }

      res.json(response);
    } catch (error: any) {
      console.error('创建支付订单失败:', error);
      res.status(500).json({ message: error.message || '创建支付订单失败' });
    }
  }

  // 确认支付（用于模拟支付）
  async confirmPayment(req: Request & { user?: any }, res: Response) {
    try {
      const { paymentId } = req.body;

      if (!paymentId) {
        return res.status(400).json({ message: '支付ID不能为空' });
      }

      // 验证支付记录归属
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true }
      });

      if (!payment || payment.order.userId !== req.user!.id) {
        return res.status(404).json({ message: '支付记录不存在' });
      }

      const result = await paymentService.confirmPayment(paymentId);

      res.json({
        ...result,
        success: true
      });
    } catch (error: any) {
      console.error('确认支付失败:', error);
      res.status(500).json({ message: error.message || '确认支付失败' });
    }
  }

  // 取消支付
  async cancelPayment(req: Request & { user?: any }, res: Response) {
    try {
      const { paymentId } = req.body;

      if (!paymentId) {
        return res.status(400).json({ message: '支付ID不能为空' });
      }

      // 验证支付记录归属
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true }
      });

      if (!payment || payment.order.userId !== req.user!.id) {
        return res.status(404).json({ message: '支付记录不存在' });
      }

      const result = await paymentService.cancelPayment(paymentId);

      res.json({
        ...result,
        success: true
      });
    } catch (error: any) {
      console.error('取消支付失败:', error);
      res.status(500).json({ message: error.message || '取消支付失败' });
    }
  }

  // 查询支付状态
  async queryPaymentStatus(req: Request & { user?: any }, res: Response) {
    try {
      const { paymentId } = req.params as { paymentId: string };

      const result = await paymentService.queryPaymentStatus(paymentId);

      res.json({
        ...result,
        success: true
      });
    } catch (error: any) {
      console.error('查询支付状态失败:', error);
      res.status(500).json({ message: error.message || '查询支付状态失败' });
    }
  }

  // 支付回调
  async paymentCallback(req: Request, res: Response) {
    try {
      const callbackData = req.body;

      const result = await paymentService.handlePaymentCallback(callbackData);

      // 返回微信要求的响应格式
      res.json({
        code: 'SUCCESS',
        message: result.message
      });
    } catch (error: any) {
      console.error('处理支付回调失败:', error);
      res.status(500).json({
        code: 'FAIL',
        message: error.message || '处理支付回调失败'
      });
    }
  }

  // 申请退款
  async refundPayment(req: Request & { user?: any }, res: Response) {
    try {
      const { paymentId, amount, reason } = req.body;

      if (!paymentId || !amount) {
        return res.status(400).json({ message: '支付ID和退款金额不能为空' });
      }

      // 检查支付记录归属
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true }
      });

      if (!payment || payment.order.userId !== req.user!.id) {
        return res.status(404).json({ message: '支付记录不存在' });
      }

      const result = await paymentService.refundPayment(
        paymentId,
        amount,
        reason || '用户申请退款'
      );

      res.json({
        ...result,
        success: true
      });
    } catch (error: any) {
      console.error('申请退款失败:', error);
      res.status(500).json({ message: error.message || '申请退款失败' });
    }
  }

  // 获取支付记录列表
  async getPaymentHistory(req: Request & { user?: any }, res: Response) {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          order: {
            userId: req.user!.id
          }
        },
        include: {
          order: {
            include: {
              deliveryStation: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ payments });
    } catch (error: any) {
      console.error('获取支付记录失败:', error);
      res.status(500).json({ message: '获取支付记录失败' });
    }
  }
}

export const paymentController = new PaymentController();
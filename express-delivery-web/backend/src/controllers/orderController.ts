import { Request, Response } from 'express';
import { orderService } from '../services/orderService';
import { authenticateToken } from '../middleware/auth';
import { OrderStatus } from '@prisma/client';

export class OrderController {
  // 创建订单
  async createOrder(req: Request & { user?: any }, res: Response) {
    try {
      console.log('收到创建订单请求:', {
        body: req.body,
        user: req.user,
        headers: req.headers
      });

      const orderData = req.body;

      // 验证请求体是否存在
      if (!orderData || typeof orderData !== 'object') {
        console.error('订单数据无效:', orderData);
        return res.status(400).json({ message: '请求数据不能为空' });
      }

      // 验证用户是否已登录
      if (!req.user || !req.user.id) {
        console.error('用户未登录');
        return res.status(401).json({ message: '请先登录' });
      }

      // 验证必填字段
      const requiredFields = [
        'deliveryStationId',
        'recipientName',
        'recipientPhone',
        'deliveryAddress'
      ];

      for (const field of requiredFields) {
        if (!orderData[field]) {
          console.error(`缺少必填字段: ${field}`, orderData);
          return res.status(400).json({ message: `${field}不能为空` });
        }
      }

      console.log('开始创建订单，用户ID:', req.user.id, '订单数据:', orderData);
      const order = await orderService.createOrder(req.user.id, orderData);

      res.status(201).json({
        success: true,
        order
      });
    } catch (error: any) {
      console.error('创建订单失败:', error);
      console.error('错误堆栈:', error.stack);
      console.error('错误详情:', {
        name: error.name,
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      
      // 返回更详细的错误信息
      let errorMessage = '创建订单失败';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        errorMessage = `数据库错误: ${error.code}`;
      }
      
      res.status(500).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // 获取用户订单列表
  async getUserOrders(req: Request & { user?: any }, res: Response) {
    try {
      const status = req.query.status as string | undefined;
      const orders = await orderService.getUserOrders(
        req.user!.id,
        status as OrderStatus | undefined
      );

      res.json({ orders });
    } catch (error: any) {
      console.error('获取订单列表失败:', error);
      res.status(500).json({ message: '获取订单列表失败' });
    }
  }

  // 获取订单详情
  async getOrderById(req: Request & { user?: any }, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const order = await orderService.getOrderById(id, req.user!.id);

      if (!order) {
        return res.status(404).json({ message: '订单不存在' });
      }

      res.json({ order });
    } catch (error: any) {
      console.error('获取订单详情失败:', error);
      res.status(500).json({ message: '获取订单详情失败' });
    }
  }

  // 更新订单状态
  async updateOrderStatus(req: Request & { user?: any }, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const { status } = req.body;

      if (!status || !Object.values(OrderStatus).includes(status)) {
        return res.status(400).json({ message: '无效的订单状态' });
      }

      const order = await orderService.updateOrderStatus(id, status, req.user!.id);

      res.json({
        success: true,
        order
      });
    } catch (error: any) {
      console.error('更新订单状态失败:', error);
      res.status(500).json({ message: error.message || '更新订单状态失败' });
    }
  }

  // 取消订单
  async cancelOrder(req: Request & { user?: any }, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const order = await orderService.cancelOrder(id, req.user!.id);

      res.json({
        success: true,
        order
      });
    } catch (error: any) {
      console.error('取消订单失败:', error);
      res.status(500).json({ message: error.message || '取消订单失败' });
    }
  }

  // 获取订单统计
  async getOrderStats(req: Request & { user?: any }, res: Response) {
    try {
      const stats = await orderService.getOrderStats(req.user!.id);

      res.json({ stats });
    } catch (error: any) {
      console.error('获取订单统计失败:', error);
      res.status(500).json({ message: '获取订单统计失败' });
    }
  }
}

export const orderController = new OrderController();
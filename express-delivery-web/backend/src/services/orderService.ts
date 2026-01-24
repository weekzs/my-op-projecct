import { prisma } from '../server';
import { Order, OrderStatus, PaymentStatus } from '@prisma/client';

export class OrderService {
  // 创建订单
  async createOrder(userId: string, orderData: any) {
    try {
      console.log('开始创建订单，参数:', { userId, orderData });

      // 验证 orderData 是否存在
      if (!orderData || typeof orderData !== 'object') {
        throw new Error('订单数据不能为空');
      }

      // 验证必填字段
      if (!orderData.deliveryStationId) {
        throw new Error('快递站ID不能为空');
      }
      if (!orderData.recipientName) {
        throw new Error('收件人姓名不能为空');
      }
      if (!orderData.recipientPhone) {
        throw new Error('收件人电话不能为空');
      }
      if (!orderData.deliveryAddress) {
        throw new Error('送达地址不能为空');
      }

      const {
        deliveryStationId,
        recipientName,
        recipientPhone,
        pickupCode,
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        serviceType = 'STANDARD',
        isUrgent = false,
        remarks
      } = orderData;

      console.log('获取快递站信息，ID:', deliveryStationId);

      // 获取快递站信息
      const station = await prisma.deliveryStation.findUnique({
        where: { id: deliveryStationId }
      });

      if (!station) {
        throw new Error('快递站不存在');
      }

      console.log('快递站信息:', station);

      // 计算价格
      const pricing = this.calculatePrice(serviceType, deliveryLat, deliveryLng, station, isUrgent);

      console.log('价格计算结果:', pricing);

      // 确保所有必需字段都有值
      const createOrderData: any = {
        userId,
        deliveryStationId,
        recipientName,
        recipientPhone,
        deliveryAddress,
        serviceType: serviceType || 'STANDARD',
        isUrgent: isUrgent || false,
        basePrice: pricing.basePrice,
        distance: pricing.distance,
        distancePrice: pricing.distancePrice,
        urgentFee: pricing.urgentFee,
        totalPrice: pricing.totalPrice,
      };

      // 可选字段
      if (pickupCode) {
        createOrderData.pickupCode = pickupCode;
      }
      if (deliveryLat !== undefined && deliveryLat !== null) {
        createOrderData.deliveryLat = deliveryLat;
      }
      if (deliveryLng !== undefined && deliveryLng !== null) {
        createOrderData.deliveryLng = deliveryLng;
      }
      if (remarks) {
        createOrderData.remarks = remarks;
      }

      console.log('准备创建的订单数据:', createOrderData);

      // 创建订单
      const order = await prisma.order.create({
        data: createOrderData,
        include: {
          deliveryStation: true,
          user: {
            select: {
              id: true,
              phone: true,
              nickname: true
            }
          }
        }
      });

      return order;
    } catch (error) {
      console.error('创建订单失败:', error);
      throw error;
    }
  }

  // 计算价格
  private calculatePrice(serviceType: string, lat?: number, lng?: number, station?: any, isUrgent?: boolean) {
    try {
      // 基础价格
      let basePrice = 8;
      if (serviceType === 'EXPRESS') {
        basePrice = 12;
      } else if (serviceType === 'PREMIUM') {
        basePrice = 15;
      }

      // 计算距离 (简化版)
      let distance = 0;
      let distancePrice = 0;

      if (lat !== undefined && lat !== null && 
          lng !== undefined && lng !== null && 
          station && 
          station.latitude !== undefined && 
          station.longitude !== undefined) {
        distance = Math.sqrt(
          Math.pow(lat - station.latitude, 2) +
          Math.pow(lng - station.longitude, 2)
        ) * 111; // 粗略转换为公里

        // 距离费用：超过1公里，每公里0.5元
        distancePrice = Math.max(0, (distance - 1) * 0.5);
      }

      // 加急费用
      const urgentFee = isUrgent ? 3 : 0;

      // 总价
      const totalPrice = basePrice + distancePrice + urgentFee;

      const result = {
        basePrice: Number((Math.round(basePrice * 100) / 100).toFixed(2)),
        distance: Number((Math.round(distance * 100) / 100).toFixed(2)),
        distancePrice: Number((Math.round(distancePrice * 100) / 100).toFixed(2)),
        urgentFee: Number(urgentFee.toFixed(2)),
        totalPrice: Number((Math.round(totalPrice * 100) / 100).toFixed(2))
      };

      // 确保所有值都是有效的数字
      if (isNaN(result.basePrice) || isNaN(result.distance) || isNaN(result.distancePrice) || 
          isNaN(result.urgentFee) || isNaN(result.totalPrice)) {
        throw new Error('价格计算错误：包含无效的数值');
      }

      return result;
    } catch (error) {
      console.error('计算价格时出错:', error);
      // 返回默认价格
      return {
        basePrice: 8,
        distance: 0,
        distancePrice: 0,
        urgentFee: 0,
        totalPrice: 8
      };
    }
  }

  // 获取用户订单列表
  async getUserOrders(userId: string, status?: OrderStatus) {
    try {
      const where: any = { userId };
      if (status) {
        where.status = status;
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          deliveryStation: true,
          payment: true,
          review: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return orders;
    } catch (error) {
      console.error('获取用户订单失败:', error);
      throw error;
    }
  }

  // 获取订单详情
  async getOrderById(orderId: string, userId?: string) {
    try {
      const where: any = { id: orderId };
      if (userId) {
        where.userId = userId;
      }

      const order = await prisma.order.findFirst({
        where,
        include: {
          deliveryStation: true,
          payment: true,
          review: true,
          user: {
            select: {
              id: true,
              phone: true,
              nickname: true
            }
          }
        }
      });

      return order;
    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  }

  // 更新订单状态
  async updateOrderStatus(orderId: string, status: OrderStatus, userId?: string) {
    try {
      const where: any = { id: orderId };
      if (userId) {
        where.userId = userId;
      }

      // 检查订单是否存在
      const order = await prisma.order.findFirst({ where });
      if (!order) {
        throw new Error('订单不存在');
      }

      // 状态转换验证
      if (!this.canTransitionStatus(order.status, status)) {
        throw new Error('订单状态不能转换为此状态');
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(status === 'COMPLETED' && { completedAt: new Date() })
        },
        include: {
          deliveryStation: true,
          payment: true
        }
      });

      return updatedOrder;
    } catch (error) {
      console.error('更新订单状态失败:', error);
      throw error;
    }
  }

  // 取消订单
  async cancelOrder(orderId: string, userId: string) {
    try {
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId }
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      // 只有待处理和已确认的订单可以取消
      if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new Error('此订单状态不能取消');
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      });

      return updatedOrder;
    } catch (error) {
      console.error('取消订单失败:', error);
      throw error;
    }
  }

  // 验证状态转换
  private canTransitionStatus(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PICKING_UP', 'CANCELLED'],
      PICKING_UP: ['IN_TRANSIT'],
      IN_TRANSIT: ['DELIVERED'],
      DELIVERED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: []
    };

    return transitions[currentStatus]?.includes(newStatus) || false;
  }

  // 获取订单统计
  async getOrderStats(userId: string) {
    try {
      const orders = await prisma.order.findMany({
        where: { userId },
        select: {
          status: true,
          totalPrice: true,
          paymentStatus: true
        }
      });

      const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'PENDING').length,
        completed: orders.filter(o => o.status === 'COMPLETED').length,
        cancelled: orders.filter(o => o.status === 'CANCELLED').length,
        totalSpent: orders
          .filter(o => o.paymentStatus === 'PAID')
          .reduce((sum, o) => sum + o.totalPrice, 0)
      };

      return stats;
    } catch (error) {
      console.error('获取订单统计失败:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService();
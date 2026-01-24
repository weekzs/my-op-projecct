import express from 'express';
import { orderController } from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 创建订单
router.post('/', authenticateToken, orderController.createOrder.bind(orderController));

// 获取用户订单列表
router.get('/', authenticateToken, orderController.getUserOrders.bind(orderController));

// 获取订单详情
router.get('/:id', authenticateToken, orderController.getOrderById.bind(orderController));

// 更新订单状态
router.put('/:id/status', authenticateToken, orderController.updateOrderStatus.bind(orderController));

// 取消订单
router.put('/:id/cancel', authenticateToken, orderController.cancelOrder.bind(orderController));

// 获取订单统计
router.get('/stats/summary', authenticateToken, orderController.getOrderStats.bind(orderController));

export default router;
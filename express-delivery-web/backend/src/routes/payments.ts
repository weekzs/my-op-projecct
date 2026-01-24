import express from 'express';
import { paymentController } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 创建支付订单
router.post('/create', authenticateToken, paymentController.createPayment.bind(paymentController));

// 确认支付（用于模拟支付）
router.post('/confirm', authenticateToken, paymentController.confirmPayment.bind(paymentController));

// 取消支付
router.post('/cancel', authenticateToken, paymentController.cancelPayment.bind(paymentController));

// 查询支付状态
router.get('/:paymentId/status', authenticateToken, paymentController.queryPaymentStatus.bind(paymentController));

// 支付回调 (不需要认证)
router.post('/notify', paymentController.paymentCallback.bind(paymentController));

// 申请退款
router.post('/refund', authenticateToken, paymentController.refundPayment.bind(paymentController));

// 获取支付记录
router.get('/history', authenticateToken, paymentController.getPaymentHistory.bind(paymentController));

export default router;
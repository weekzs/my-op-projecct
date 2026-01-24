import express from 'express';
import { reviewController } from '../controllers/reviewController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 创建评价
router.post('/orders/:orderId', authenticateToken, reviewController.createReview.bind(reviewController));

// 获取订单评价
router.get('/orders/:orderId', authenticateToken, reviewController.getOrderReview.bind(reviewController));

// 获取用户评价列表
router.get('/', authenticateToken, reviewController.getUserReviews.bind(reviewController));

// 更新评价
router.put('/:id', authenticateToken, reviewController.updateReview.bind(reviewController));

// 删除评价
router.delete('/:id', authenticateToken, reviewController.deleteReview.bind(reviewController));

// 获取评价统计
router.get('/stats/overview', reviewController.getReviewStats.bind(reviewController));

export default router;
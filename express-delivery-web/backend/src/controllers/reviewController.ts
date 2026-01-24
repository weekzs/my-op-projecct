import { Request, Response } from 'express';
import { reviewService } from '../services/reviewService';
import { authenticateToken } from '../middleware/auth';

export class ReviewController {
  // 创建评价
  async createReview(req: Request & { user?: any }, res: Response) {
    try {
      const { orderId } = req.params as { orderId: string };
      const { rating, content } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: '评分必须在1-5之间' });
      }

      const review = await reviewService.createReview(orderId, req.user!.id, {
        rating,
        content
      });

      res.status(201).json({
        success: true,
        review
      });
    } catch (error: any) {
      console.error('创建评价失败:', error);
      res.status(500).json({ message: error.message || '创建评价失败' });
    }
  }

  // 获取订单评价
  async getOrderReview(req: Request & { user?: any }, res: Response) {
    try {
      const { orderId } = req.params as { orderId: string };
      const review = await reviewService.getOrderReview(orderId, req.user!.id);

      res.json({ review });
    } catch (error: any) {
      console.error('获取订单评价失败:', error);
      res.status(500).json({ message: '获取订单评价失败' });
    }
  }

  // 获取用户评价列表
  async getUserReviews(req: Request & { user?: any }, res: Response) {
    try {
      const reviews = await reviewService.getUserReviews(req.user!.id);
      res.json({ reviews });
    } catch (error: any) {
      console.error('获取用户评价失败:', error);
      res.status(500).json({ message: '获取用户评价失败' });
    }
  }

  // 更新评价
  async updateReview(req: Request & { user?: any }, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const { rating, content } = req.body;

      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({ message: '评分必须在1-5之间' });
      }

      const review = await reviewService.updateReview(id, req.user!.id, {
        rating,
        content
      });

      res.json({
        success: true,
        review
      });
    } catch (error: any) {
      console.error('更新评价失败:', error);
      res.status(500).json({ message: error.message || '更新评价失败' });
    }
  }

  // 删除评价
  async deleteReview(req: Request & { user?: any }, res: Response) {
    try {
      const { id } = req.params as { id: string };
      await reviewService.deleteReview(id, req.user!.id);

      res.json({ success: true, message: '评价删除成功' });
    } catch (error: any) {
      console.error('删除评价失败:', error);
      res.status(500).json({ message: error.message || '删除评价失败' });
    }
  }

  // 获取评价统计
  async getReviewStats(req: Request, res: Response) {
    try {
      const stats = await reviewService.getReviewStats();
      res.json({ stats });
    } catch (error: any) {
      console.error('获取评价统计失败:', error);
      res.status(500).json({ message: '获取评价统计失败' });
    }
  }
}

export const reviewController = new ReviewController();
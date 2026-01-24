import { prisma } from '../server';

export class ReviewService {
  // 创建评价
  async createReview(orderId: string, userId: string, reviewData: any) {
    try {
      const { rating, content } = reviewData;

      // 检查订单是否存在且属于用户
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId }
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      // 检查订单状态（只有已完成的订单可以评价）
      if (order.status !== 'COMPLETED') {
        throw new Error('只有已完成的订单可以评价');
      }

      // 检查是否已经评价过
      const existingReview = await prisma.review.findUnique({
        where: { orderId }
      });

      if (existingReview) {
        throw new Error('该订单已评价过');
      }

      // 创建评价
      const review = await prisma.review.create({
        data: {
          orderId,
          userId,
          rating,
          content
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          }
        }
      });

      return review;
    } catch (error) {
      console.error('创建评价失败:', error);
      throw error;
    }
  }

  // 获取订单评价
  async getOrderReview(orderId: string, userId?: string) {
    try {
      const where: any = { orderId };
      if (userId) {
        where.userId = userId;
      }

      const review = await prisma.review.findFirst({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          },
          order: {
            include: {
              deliveryStation: true
            }
          }
        }
      });

      return review;
    } catch (error) {
      console.error('获取订单评价失败:', error);
      throw error;
    }
  }

  // 获取用户评价列表
  async getUserReviews(userId: string) {
    try {
      const reviews = await prisma.review.findMany({
        where: { userId },
        include: {
          order: {
            include: {
              deliveryStation: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return reviews;
    } catch (error) {
      console.error('获取用户评价失败:', error);
      throw error;
    }
  }

  // 更新评价
  async updateReview(reviewId: string, userId: string, reviewData: any) {
    try {
      // 检查评价是否存在且属于用户
      const existingReview = await prisma.review.findFirst({
        where: { id: reviewId, userId }
      });

      if (!existingReview) {
        throw new Error('评价不存在');
      }

      const { rating, content } = reviewData;

      const review = await prisma.review.update({
        where: { id: reviewId },
        data: {
          rating,
          content
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          }
        }
      });

      return review;
    } catch (error) {
      console.error('更新评价失败:', error);
      throw error;
    }
  }

  // 删除评价
  async deleteReview(reviewId: string, userId: string) {
    try {
      // 检查评价是否存在且属于用户
      const review = await prisma.review.findFirst({
        where: { id: reviewId, userId }
      });

      if (!review) {
        throw new Error('评价不存在');
      }

      await prisma.review.delete({
        where: { id: reviewId }
      });

      return { success: true };
    } catch (error) {
      console.error('删除评价失败:', error);
      throw error;
    }
  }

  // 获取评价统计
  async getReviewStats() {
    try {
      const reviews = await prisma.review.findMany({
        select: { rating: true }
      });

      const total = reviews.length;
      const average = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;

      const distribution = {
        1: reviews.filter(r => r.rating === 1).length,
        2: reviews.filter(r => r.rating === 2).length,
        3: reviews.filter(r => r.rating === 3).length,
        4: reviews.filter(r => r.rating === 4).length,
        5: reviews.filter(r => r.rating === 5).length
      };

      return {
        total,
        average: Math.round(average * 10) / 10,
        distribution
      };
    } catch (error) {
      console.error('获取评价统计失败:', error);
      throw error;
    }
  }
}

export const reviewService = new ReviewService();
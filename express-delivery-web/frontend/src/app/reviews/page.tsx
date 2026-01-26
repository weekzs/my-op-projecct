'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Review } from '@/types';
import { reviewApi } from '@/utils/api';
import { BackButton } from '@/components/ui/BackButton';

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [formData, setFormData] = useState({
    rating: 5,
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<{
    total: number;
    average: number;
    distribution: Record<number, number>;
  } | null>(null);

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    loadReviews();
    loadStats();
  }, [router]);

  // 加载评价列表
  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewApi.getUserReviews();
      if (response.success && response.data) {
        const data = response.data as { reviews?: Review[] };
        // 按创建时间倒序排列
        const sortedReviews = (data.reviews || []).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setReviews(sortedReviews);
      }
    } catch (error) {
      console.error('加载评价失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response = await reviewApi.getReviewStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  };

  // 打开编辑表单
  const handleEditClick = (review: Review) => {
    setEditingReview(review);
    setFormData({
      rating: review.rating,
      content: review.content || '',
    });
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingReview(null);
    setFormData({
      rating: 5,
      content: '',
    });
  };

  // 提交编辑
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;

    setSubmitting(true);
    try {
      const response = await reviewApi.updateReview(editingReview.id, formData);
      if (response.success) {
        await loadReviews();
        await loadStats();
        handleCancelEdit();
      } else {
        alert(response.error || '更新评价失败');
      }
    } catch (error) {
      console.error('更新评价失败:', error);
      alert('更新失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除评价
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个评价吗？删除后无法恢复。')) return;

    try {
      const response = await reviewApi.deleteReview(id);
      if (response.success) {
        await loadReviews();
        await loadStats();
      } else {
        alert(response.error || '删除评价失败');
      }
    } catch (error) {
      console.error('删除评价失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 渲染星级
  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive && onChange ? () => onChange(star) : undefined}
            className={`text-2xl ${
              star <= rating
                ? 'text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-500 transition-colors' : ''}`}
            disabled={!interactive}
          >
            ⭐
          </button>
        ))}
      </div>
    );
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">⭐ 我的评价</h1>
        </div>

        {/* 统计信息 */}
        {stats && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">总评价数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">平均评分</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.average ? stats.average.toFixed(1) : '0.0'} ⭐
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">5星评价</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.distribution?.[5] || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">4星评价</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {stats.distribution?.[4] || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 评价列表 */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <p className="text-lg">暂无评价</p>
                <p className="text-sm mt-2">您还没有对任何订单进行评价</p>
                <Link href="/orders">
                  <Button className="mt-4">查看订单</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  {editingReview?.id === review.id ? (
                    // 编辑表单
                    <form onSubmit={handleUpdate}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            评分 *
                          </label>
                          {renderStars(formData.rating, true, (rating) =>
                            setFormData({ ...formData, rating })
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            评价内容
                          </label>
                          <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            rows={4}
                            placeholder="分享您的使用体验..."
                          />
                        </div>
                        <div className="flex gap-4">
                          <Button type="submit" disabled={submitting} className="flex-1">
                            {submitting ? '保存中...' : '保存'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            取消
                          </Button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    // 显示评价
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-500">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            订单号: <Link href={`/orders/${review.orderId}`} className="text-blue-600 hover:underline">
                              {review.orderId}
                            </Link>
                          </p>
                          {review.content && (
                            <p className="text-gray-700 mt-2">{review.content}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(review)}
                          >
                            编辑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(review.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

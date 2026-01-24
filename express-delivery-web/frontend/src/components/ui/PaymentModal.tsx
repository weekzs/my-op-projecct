'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { paymentApi } from '@/utils/api';

interface PaymentModalProps {
  orderId: string;
  amount: number;
  paymentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentModal({ orderId, amount, paymentId, onSuccess, onCancel }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'confirm' | 'processing' | 'success'>('confirm');

  const handleConfirm = async () => {
    setLoading(true);
    setStep('processing');

    try {
      const response = await paymentApi.confirmPayment({ paymentId });

      if (response.success) {
        setStep('success');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        alert(response.error || '支付失败');
        setStep('confirm');
        setLoading(false);
      }
    } catch (error) {
      console.error('支付失败:', error);
      alert('支付失败，请重试');
      setStep('confirm');
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await paymentApi.cancelPayment({ paymentId });
    } catch (error) {
      console.error('取消支付失败:', error);
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          {step === 'confirm' && (
            <>
              <h2 className="text-2xl font-bold mb-4">确认支付</h2>
              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">订单号</span>
                    <span className="font-mono text-sm">{orderId.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">支付金额</span>
                    <span className="text-2xl font-bold text-blue-600">¥{amount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>模拟支付模式</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    这是测试环境，点击确认后将模拟支付成功
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  取消
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading ? '处理中...' : '确认支付'}
                </Button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">正在处理支付...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">支付成功！</h3>
              <p className="text-gray-600">订单已支付成功，正在跳转...</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/utils/api';
import { LoginForm, AuthResponse } from '@/types';

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginForm>({
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login(formData);

      if (response.success && response.data) {
        const authData = response.data as AuthResponse;
        // 保存token到localStorage
        localStorage.setItem('token', authData.token);
        localStorage.setItem('user', JSON.stringify(authData.user));

        // 跳转到首页
        router.push('/');
      } else {
        setError(response.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl space-y-8 p-8 border border-gray-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">登录</h2>
          <p className="mt-2 text-gray-600">欢迎回来，请登录您的账户</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5 bg-gray-50 p-6 rounded-lg border border-gray-100">
            <Input
              label="手机号"
              name="phone"
              type="tel"
              placeholder="请输入手机号"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            <Input
              label="密码"
              name="password"
              type="password"
              placeholder="请输入密码"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </Button>

          <div className="text-center">
            <span className="text-gray-600">还没有账户？</span>
            <Link
              href="/auth/register"
              className="text-blue-600 hover:text-blue-500 ml-1"
            >
              立即注册
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
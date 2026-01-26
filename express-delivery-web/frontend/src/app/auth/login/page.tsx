'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/utils/api';
import { LoginForm, AuthResponse } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<LoginForm>({
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 处理 URL 查询参数（自动填充表单）
  useEffect(() => {
    const phone = searchParams.get('phone');
    const password = searchParams.get('password');
    
    if (phone && password) {
      setFormData({
        phone: phone,
        password: password,
      });
      
      // 如果 URL 中有参数，自动尝试登录
      handleAutoLogin(phone, password);
    }
  }, [searchParams]);

  // 自动登录（当 URL 中有参数时）
  const handleAutoLogin = async (phone: string, password: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login({ phone, password });

      if (response.success && response.data) {
        const authData = response.data as AuthResponse;
        localStorage.setItem('token', authData.token);
        localStorage.setItem('user', JSON.stringify(authData.user));
        
        // 清除 URL 参数并跳转
        router.replace('/');
      } else {
        setError(response.error || '登录失败');
        setLoading(false);
      }
    } catch (err) {
      setError('网络错误，请重试');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 如果已经在自动登录中，不重复提交
    if (loading) return;
    
    setLoading(true);
    setError('');

    try {
      // 添加超时处理
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('请求超时，请检查网络连接')), 10000);
      });

      const loginPromise = authApi.login(formData);
      const response = await Promise.race([loginPromise, timeoutPromise]);

      if (response.success && response.data) {
        const authData = response.data as AuthResponse;
        // 保存token到localStorage
        localStorage.setItem('token', authData.token);
        localStorage.setItem('user', JSON.stringify(authData.user));

        // 清除 URL 参数并跳转到首页
        router.replace('/');
      } else {
        setError(response.error || '登录失败，请检查手机号和密码');
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '网络错误，请重试';
      setError(errorMessage);
      setLoading(false);
      console.error('登录错误:', err);
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
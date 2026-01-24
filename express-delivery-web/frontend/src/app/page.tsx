'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { User } from '@/types';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 检查本地存储的用户信息
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('解析用户信息失败:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">快递服务</h1>
            </div>
             <nav className="flex space-x-8">
               <Link href="/" className="text-gray-700 hover:text-blue-600">首页</Link>
               <Link href="/order" className="text-gray-700 hover:text-blue-600">下单</Link>
               <Link href="/orders" className="text-gray-700 hover:text-blue-600">订单</Link>
               <Link href="/profile" className="text-gray-700 hover:text-blue-600">我的</Link>
               <Link href="/diagnostics" className="text-gray-700 hover:text-blue-600">🔧 诊断</Link>
             </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">欢迎，{user.nickname || user.phone}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                  >
                    退出登录
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm">
                      登录
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm">
                      注册
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 欢迎区域 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            专业的快递代取服务
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            为您提供安全、快捷的快递寄送服务！支持地图精准定位，微信支付便捷安全。
          </p>
        </div>

        {/* 服务类型 */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">标准快递</h3>
            <p className="text-gray-600 mb-4">常规时效，经济实惠</p>
            <p className="text-2xl font-bold text-blue-600">¥8.00起</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center border-2 border-orange-300">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">加急快递</h3>
            <p className="text-gray-600 mb-4">快速送达，加急服务</p>
            <p className="text-2xl font-bold text-orange-600">¥11.00起</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">特快专递</h3>
            <p className="text-gray-600 mb-4">最快时效，尊贵服务</p>
            <p className="text-2xl font-bold text-purple-600">¥15.00起</p>
          </div>
        </div>

        {/* 开始使用按钮 */}
        <div className="text-center">
          {user ? (
            <Link href="/order">
              <Button size="lg" className="px-8 py-3 text-lg">
                立即下单
              </Button>
            </Link>
          ) : (
            <Link href="/auth/login">
              <Button size="lg" className="px-8 py-3 text-lg">
                登录后下单
              </Button>
            </Link>
          )}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>&copy; 2024 快递服务. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

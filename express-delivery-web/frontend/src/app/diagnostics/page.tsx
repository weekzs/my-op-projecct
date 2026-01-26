'use client';

import { useState, useEffect } from 'react';
import { apiDiagnostics } from '@/utils/api';
import { BackButton } from '@/components/ui/BackButton';

export default function DiagnosticsPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        const results = await apiDiagnostics.getSystemStatus();
        setStatus(results);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        setStatus({ error: errorMessage });
      } finally {
        setLoading(false);
      }
    };

    runDiagnostics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在诊断系统状态...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🔧 系统诊断
          </h1>

          {status?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-red-800 font-semibold">诊断错误</h3>
              <p className="text-red-600 mt-1">{status.error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* 后端状态 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">
                🚀 后端服务器 (端口 3000)
              </h3>
              <div className="space-y-2">
                <p className="text-blue-800">
                  <span className="font-medium">状态:</span>{' '}
                  {status?.backendHealth ? (
                    <span className="text-green-600">✅ 正常</span>
                  ) : (
                    <span className="text-red-600">❌ 离线</span>
                  )}
                </p>
                <p className="text-blue-800">
                  <span className="font-medium">健康检查:</span>{' '}
                  {status?.backendHealth?.status || '未知'}
                </p>
              </div>
            </div>

            {/* 前端状态 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-green-900 mb-4">
                💻 前端服务器 (端口 {status?.frontendPort || '未知'})
              </h3>
              <div className="space-y-2">
                <p className="text-green-800">
                  <span className="font-medium">重写状态:</span>{' '}
                  {status?.rewriteStatus === 404 ? (
                    <span className="text-yellow-600">⚠️ 需要检查</span>
                  ) : status?.rewriteStatus === 'error' ? (
                    <span className="text-red-600">❌ 错误</span>
                  ) : (
                    <span className="text-green-600">✅ 正常</span>
                  )}
                </p>
                <p className="text-green-800">
                  <span className="font-medium">时间戳:</span> {status?.timestamp}
                </p>
              </div>
            </div>
          </div>

          {/* 故障排除建议 */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-900 mb-4">
              🛠️ 故障排除建议
            </h3>
            <ul className="space-y-2 text-yellow-800">
              <li>• 确保后端服务器在端口 3000 上运行</li>
              <li>• 检查前端服务器是否在正确的端口上运行</li>
              <li>• 验证 Next.js 重写规则是否正确配置</li>
              <li>• 检查防火墙和网络连接</li>
              <li>• 查看浏览器开发者工具的网络选项卡</li>
            </ul>
          </div>

          {/* 测试按钮 */}
          <div className="mt-8 text-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 重新运行诊断
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
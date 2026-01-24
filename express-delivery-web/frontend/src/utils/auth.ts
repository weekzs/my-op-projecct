// API请求中间件，自动添加认证头
export const apiMiddleware = (request: RequestInit): RequestInit => {
  const token = localStorage.getItem('token');

  if (token) {
    return {
      ...request,
      headers: {
        ...request.headers,
        'Authorization': `Bearer ${token}`,
      },
    };
  }

  return request;
};

// 用户认证工具函数
export const authUtils = {
  // 获取当前用户信息
  getCurrentUser: (): any => {
    if (typeof window === 'undefined') return null;

    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  },

  // 检查是否已登录
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('token');
    return !!token;
  },

  // 登出
  logout: (): void => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth(redirectToLogin = false) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    const isAuth = !!token;
    
    setIsAuthenticated(isAuth);
    setLoading(false);

    // 如果未登录且需要重定向，则跳转到登录页
    if (!isAuth && redirectToLogin) {
      router.push('/auth/login');
    }
  }, [redirectToLogin, router]);

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      router.push('/auth/login');
    }
  };

  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  };

  const getUser = () => {
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
  };

  return {
    isAuthenticated,
    loading,
    logout,
    getToken,
    getUser,
  };
}

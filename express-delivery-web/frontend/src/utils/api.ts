// API工具函数

// 使用相对路径，让Next.js代理处理API请求
const API_BASE_URL = '';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // 添加超时处理（10秒）- 在函数作用域顶层声明
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      const url = `${this.baseURL}${endpoint}`;

      // 构建请求头
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // 在客户端自动添加认证头
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          // 如果是需要认证的请求，检查token
          if (endpoint.includes('/auth/') === false) {
            console.warn('未找到token，可能需要登录');
          }
        }
      }

      // 合并用户自定义的headers
      if (options.headers) {
        Object.assign(headers, options.headers);
      }

      // 确保请求体是字符串（如果是对象）
      let body = options.body;
      if (body && typeof body === 'object' && !(body instanceof FormData)) {
        body = JSON.stringify(body);
      }

      console.log('API Request:', {
        url,
        method: options.method || 'GET',
        hasAuth: 'Authorization' in headers,
        token: typeof window !== 'undefined' ? (localStorage.getItem('token') ? '存在' : '不存在') : 'N/A',
        body: body ? (typeof body === 'string' ? JSON.parse(body) : body) : undefined
      });

      // 设置超时
      timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        ...options,
        method: options.method || 'GET',
        headers,
        body,
        signal: controller.signal,
      });
      
      // 清除超时
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        contentType: response.headers.get('content-type')
      });

      // 处理401未授权错误
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // 可以在这里触发登录跳转
          console.warn('认证失败，请重新登录');
        }
        return {
          success: false,
          error: '请先登录',
        };
      }

      // 检查响应是否为JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.message || `请求失败: ${response.status} ${response.statusText}`,
          };
        }

        return {
          success: true,
          data,
        };
      } else {
        // 非JSON响应，可能是HTML错误页面
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        return {
          success: false,
          error: `服务器返回非JSON响应: ${response.status} ${response.statusText}`,
        };
      }
    } catch (error) {
      // 清除超时
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      console.error('API Request failed:', error);
      
      // 处理超时错误
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: '请求超时，请检查网络连接或稍后重试',
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误，请检查网络连接',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

// 快递站相关API
export const stationApi = {
  getStations: () => apiClient.get('/api/stations'),
  getStation: (id: string) => apiClient.get(`/api/stations/${id}`),
};

// 导入类型
import type { AuthResponse, User, Order, Payment } from '@/types';

// 认证相关API
export const authApi = {
  login: (data: { phone: string; password: string }) =>
    apiClient.post<AuthResponse>('/api/auth/login', data),
  register: (data: { phone: string; password: string; nickname?: string }) =>
    apiClient.post<AuthResponse>('/api/auth/register', data),
  getProfile: () => apiClient.get<User>('/api/auth/profile'),
  updateProfile: (data: { nickname?: string; avatar?: string }) =>
    apiClient.put<User>('/api/auth/profile', data),
};

// 订单相关API
export const orderApi = {
  createOrder: (data: any) => apiClient.post<Order>('/api/orders', data),
  getOrders: (status?: string) => apiClient.get<Order[]>(`/api/orders${status ? `?status=${status}` : ''}`),
  getOrder: (id: string) => apiClient.get<{ order: Order }>(`/api/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    apiClient.put<Order>(`/api/orders/${id}/status`, { status }),
  cancelOrder: (id: string) => apiClient.put<Order>(`/api/orders/${id}/cancel`),
  getOrderStats: () => apiClient.get('/api/orders/stats/summary'),
};

// 支付相关API

export const paymentApi = {
  createPayment: (data: { orderId: string; paymentMethod?: string }) =>
    apiClient.post<{ 
      payment?: Payment; 
      wechatParams?: any;
      paymentUrl?: string;
      qrCode?: string;
      expiresAt?: string;
      paymentMethod?: string;
    }>('/api/payments/create', data),
  confirmPayment: (data: { paymentId: string }) =>
    apiClient.post('/api/payments/confirm', data),
  cancelPayment: (data: { paymentId: string }) =>
    apiClient.post('/api/payments/cancel', data),
  queryPaymentStatus: (paymentId: string) =>
    apiClient.get<Payment>(`/api/payments/${paymentId}/status`),
  refundPayment: (data: { paymentId: string; amount: number; reason: string }) =>
    apiClient.post('/api/payments/refund', data),
  getPaymentHistory: () => apiClient.get<{ payments?: Payment[] }>('/api/payments/history'),
};

// 地址相关API
export const addressApi = {
  getAddresses: () => apiClient.get('/api/addresses'),
  createAddress: (data: any) => apiClient.post('/api/addresses', data),
  updateAddress: (id: string, data: any) => apiClient.put(`/api/addresses/${id}`, data),
  deleteAddress: (id: string) => apiClient.delete(`/api/addresses/${id}`),
  setDefaultAddress: (id: string) => apiClient.put(`/api/addresses/${id}/default`),
  getDefaultAddress: () => apiClient.get('/api/addresses/default'),
};

// 评价相关API
export const reviewApi = {
  createReview: (orderId: string, data: { rating: number; content?: string }) =>
    apiClient.post(`/api/reviews/orders/${orderId}`, data),
  getOrderReview: (orderId: string) => apiClient.get(`/api/reviews/orders/${orderId}`),
  getUserReviews: () => apiClient.get('/api/reviews'),
  updateReview: (id: string, data: { rating?: number; content?: string }) =>
    apiClient.put(`/api/reviews/${id}`, data),
  deleteReview: (id: string) => apiClient.delete(`/api/reviews/${id}`),
  getReviewStats: () => apiClient.get('/api/reviews/stats/overview'),
};

// 诊断相关API
export const apiDiagnostics = {
  getSystemStatus: () => apiClient.get('/health'),
};

// 用户相关类型
export interface User {
  id: string;
  phone: string;
  nickname?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// 快递站相关类型
export interface DeliveryStation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 地址相关类型
export interface Address {
  id: string;
  userId: string;
  name: string; // 收件人姓名
  phone: string; // 收件人电话
  province: string;
  city: string;
  district: string;
  address: string; // 详细地址
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
}

// 订单相关类型
export type ServiceType = 'STANDARD' | 'EXPRESS' | 'PREMIUM';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PICKING_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

export interface Order {
  id: string;
  userId: string;
  deliveryStationId: string;

  // 收件信息
  recipientName: string;
  recipientPhone: string;
  pickupCode?: string;

  // 送达地址
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;

  // 服务类型
  serviceType: ServiceType;
  isUrgent: boolean;

  // 价格信息
  basePrice: number;
  distance: number;
  distancePrice: number;
  urgentFee: number;
  totalPrice: number;

  // 订单状态
  status: OrderStatus;
  paymentStatus: PaymentStatus;

  // 时间信息
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  completedAt?: string;

  // 备注
  remarks?: string;

  // 关联数据
  deliveryStation?: DeliveryStation;
  payment?: Payment;
  review?: Review;
}

// 支付相关类型
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
}

// 评价相关类型
export interface Review {
  id: string;
  orderId: string;
  userId: string;
  rating: number; // 1-5星
  content?: string;
  createdAt: string;

  // 关联数据
  user?: User;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 表单类型
export interface LoginForm {
  phone: string;
  password: string;
}

export interface RegisterForm {
  phone: string;
  password: string;
  confirmPassword: string;
  nickname?: string;
}

export interface OrderForm {
  deliveryStationId: string;
  recipientName: string;
  recipientPhone: string;
  pickupCode?: string;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  serviceType: ServiceType;
  isUrgent: boolean;
  remarks?: string;
}

// 认证响应类型
export interface AuthResponse {
  token: string;
  user: User;
}
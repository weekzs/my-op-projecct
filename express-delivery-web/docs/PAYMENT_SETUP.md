# 支付系统配置说明

## 概述

本项目支持多种支付方式，包括：
- **模拟支付（Mock Payment）**：用于开发和测试，无需第三方支付平台
- **微信支付（WeChat Pay）**：用于生产环境，需要微信支付商户号

## 支付方式选择

系统会根据运行环境自动选择支付方式：
- **非微信环境**：默认使用模拟支付
- **微信环境**：使用微信支付（如果已配置）

## 模拟支付配置

模拟支付**无需任何配置**，可以直接使用。这是默认的支付方式，适用于：
- 本地开发测试
- 演示环境
- 非微信环境

### 使用流程

1. 用户点击"立即支付"
2. 系统创建支付订单
3. 弹出支付确认对话框
4. 用户点击"确认支付"
5. 系统模拟支付成功，更新订单状态

### 特点

- ✅ 无需第三方支付平台
- ✅ 无需配置证书和密钥
- ✅ 适合开发和测试
- ✅ 支付流程完整，可以测试整个订单流程

## 微信支付配置

如果需要使用微信支付，需要配置以下环境变量（在 `backend/.env` 文件中）：

```env
# 微信支付配置
WECHAT_APP_ID=你的微信AppID
WECHAT_MCH_ID=你的商户号
WECHAT_API_V3_KEY=你的API v3密钥（32字符）
WECHAT_API_V2_KEY=你的API v2密钥（32字符）
WECHAT_SERIAL_NO=你的证书序列号
WECHAT_NOTIFY_URL=http://your-domain.com/api/payments/notify
WECHAT_CERT_PATH=证书文件路径（可选）
```

### 微信支付证书

将微信支付证书放在项目根目录的 `1738582376_20260121_cert` 文件夹中，包含：
- `apiclient_key.pem` - 私钥文件
- `apiclient_cert.pem` - 证书文件

## 支付流程

### 模拟支付流程

```
用户点击支付
  ↓
创建支付订单（paymentMethod: 'mock'）
  ↓
显示支付确认对话框
  ↓
用户确认支付
  ↓
调用 /api/payments/confirm
  ↓
更新订单状态为已支付
  ↓
刷新页面显示最新状态
```

### 微信支付流程

```
用户点击支付
  ↓
创建支付订单（paymentMethod: 'wechat'）
  ↓
获取微信支付参数
  ↓
调用微信支付SDK
  ↓
用户完成支付
  ↓
微信回调 /api/payments/notify
  ↓
更新订单状态
  ↓
前端轮询支付状态
```

## API 接口

### 创建支付订单

```http
POST /api/payments/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": "订单ID",
  "paymentMethod": "mock" | "wechat"
}
```

**响应：**
```json
{
  "success": true,
  "payment": {
    "id": "支付ID",
    "orderId": "订单ID",
    "amount": 100.00,
    "paymentMethod": "mock",
    "status": "PENDING"
  },
  "paymentMethod": "mock",
  "paymentUrl": "/payment/mock/{paymentId}",
  "qrCode": "base64编码的二维码图片"
}
```

### 确认支付（模拟支付）

```http
POST /api/payments/confirm
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentId": "支付ID"
}
```

### 取消支付

```http
POST /api/payments/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentId": "支付ID"
}
```

### 查询支付状态

```http
GET /api/payments/{paymentId}/status
Authorization: Bearer {token}
```

## 前端使用

### 基本用法

```typescript
import { paymentApi } from '@/utils/api';

// 创建支付
const response = await paymentApi.createPayment({
  orderId: '订单ID',
  paymentMethod: 'mock' // 或 'wechat'
});

// 确认支付（模拟支付）
if (response.data?.paymentMethod === 'mock') {
  await paymentApi.confirmPayment({
    paymentId: response.data.payment.id
  });
}
```

### 支付组件

使用 `PaymentModal` 组件显示支付确认对话框：

```tsx
import { PaymentModal } from '@/components/ui/PaymentModal';

<PaymentModal
  orderId={order.id}
  amount={order.totalPrice}
  paymentId={payment.id}
  onSuccess={() => window.location.reload()}
  onCancel={() => setShowModal(false)}
/>
```

## 扩展其他支付方式

系统设计支持扩展其他支付方式，如支付宝、Stripe等。在 `backend/src/services/paymentService.ts` 中添加新的支付方式：

```typescript
case 'alipay':
  return await alipayService.createPayment(orderId, amount, description);

case 'stripe':
  return await stripeService.createPayment(orderId, amount, description);
```

然后实现对应的支付服务类。

## 注意事项

1. **模拟支付仅用于测试**：生产环境应使用真实的支付方式
2. **支付安全**：所有支付接口都需要用户认证（JWT Token）
3. **支付超时**：模拟支付订单30分钟后过期
4. **支付状态**：系统会自动更新订单状态，无需手动处理

## 常见问题

### Q: 为什么默认使用模拟支付？

A: 模拟支付无需配置，适合开发和测试。生产环境可以切换到微信支付或其他支付方式。

### Q: 如何切换到微信支付？

A: 配置微信支付环境变量，系统会自动检测微信环境并使用微信支付。

### Q: 可以同时支持多种支付方式吗？

A: 可以，系统支持根据用户选择或环境自动选择支付方式。

### Q: 模拟支付会真的扣款吗？

A: 不会，模拟支付只是模拟支付流程，不会产生真实的资金交易。

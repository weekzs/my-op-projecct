# 快递服务系统

一个基于 Next.js + Express.js 的全栈快递代取服务应用。

## 🚀 功能特性

### 核心功能
- ✅ 用户注册登录（JWT认证）
- ✅ 快递站选择和管理
- ✅ 订单创建和价格计算
- ✅ 订单状态跟踪
- ✅ 个人中心和统计
- ✅ 响应式设计
- ✅ 中文界面

### 支付功能
- ✅ **模拟支付**：无需第三方平台，适合开发和测试
- ✅ **微信支付**：支持微信环境支付（可选）
- ✅ 支付状态实时查询
- ✅ 支付成功自动更新订单状态

### 地址管理
- ✅ 地址历史记录保存
- ✅ 历史地址快速选择
- ✅ 默认地址自动填充
- ✅ 智能地址解析（省市区）

### 地图定位
- ✅ 浏览器原生定位
- ✅ OpenStreetMap 地图集成
- ✅ 地址搜索功能
- ✅ 无需API Key

## 🏗️ 技术栈

### 前端
- **Next.js 14** - React全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 实用优先的CSS框架
- **React Hooks** - 状态管理
- **原生定位API** - 地理位置服务

### 后端
- **Node.js + Express.js** - 服务端框架
- **TypeScript** - 类型安全
- **Prisma** - ORM和数据库管理
- **MySQL** - 关系型数据库
- **JWT** - 用户认证
- **bcryptjs** - 密码加密

## 📁 项目结构

```
express-delivery-web/
├── frontend/                      # Next.js前端应用
│   ├── src/
│   │   ├── app/                  # Next.js App Router页面
│   │   │   ├── auth/            # 认证页面（登录/注册）
│   │   │   ├── order/           # 订单创建页面
│   │   │   ├── orders/           # 订单列表和详情
│   │   │   └── profile/         # 个人中心页面
│   │   ├── components/          # 可复用组件
│   │   │   ├── ui/              # UI组件
│   │   │   │   ├── AddressSelector.tsx    # 地址选择器
│   │   │   │   ├── PaymentModal.tsx       # 支付弹窗
│   │   │   │   ├── NativeLocationPicker.tsx # 地图选择器
│   │   │   │   └── ...
│   │   │   └── layout/          # 布局组件
│   │   ├── hooks/               # React Hooks
│   │   ├── types/               # TypeScript类型定义
│   │   └── utils/               # 工具函数和API客户端
│   └── public/                  # 静态资源
├── backend/                      # Express.js后端服务
│   ├── src/
│   │   ├── controllers/         # 路由处理器
│   │   │   ├── addressController.ts
│   │   │   ├── orderController.ts
│   │   │   ├── paymentController.ts
│   │   │   └── reviewController.ts
│   │   ├── routes/              # API路由
│   │   ├── services/            # 业务逻辑服务
│   │   │   ├── addressService.ts
│   │   │   ├── mockPaymentService.ts      # 模拟支付服务
│   │   │   ├── paymentService.ts          # 通用支付服务
│   │   │   ├── wechatPayService.ts        # 微信支付服务
│   │   │   └── ...
│   │   ├── middleware/          # 中间件
│   │   └── utils/              # 工具函数
│   ├── prisma/                  # 数据库模式和种子数据
│   │   ├── schema.prisma       # 数据库模型
│   │   └── seed.ts             # 种子数据
│   └── uploads/                 # 文件上传目录
├── 1738582376_20260121_cert/    # 微信支付证书（可选）
├── docs/                         # 文档目录
│   ├── PAYMENT_SETUP.md         # 支付系统配置
│   └── WECHAT_PAY_SETUP.md      # 微信支付配置
└── README.md                     # 项目说明（本文件）
```

## 🛠️ 快速开始

### 环境要求
- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <repository-url>
cd express-delivery-web
```

### 2. 安装依赖

#### 后端
```bash
cd backend
npm install
```

#### 前端
```bash
cd frontend
npm install
```

### 3. 数据库设置

#### 配置环境变量
复制并编辑后端环境文件：
```bash
cd backend
cp ../env.example .env
```

编辑 `backend/.env` 文件：
```env
# 数据库配置
DATABASE_URL="mysql://root:你的MySQL密码@localhost:3306/express_delivery"

# JWT配置
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# 服务器配置
PORT=3001
NODE_ENV="development"

# 微信支付配置（可选，仅在使用微信支付时需要）
# WECHAT_APP_ID=你的微信AppID
# WECHAT_MCH_ID=1738582376
# WECHAT_API_V3_KEY=你的API v3密钥
# WECHAT_API_V2_KEY=你的API v2密钥
# WECHAT_SERIAL_NO=你的证书序列号
# WECHAT_NOTIFY_URL=http://localhost:3001/api/payments/notify
```

#### 初始化数据库
```bash
cd backend

# 生成Prisma客户端
npm run db:generate

# 推送数据库模式
npm run db:push

# 运行种子数据
npm run db:seed
```

### 4. 启动服务

#### Windows 环境（推荐）

**方式一：一键启动（最简单）**
```cmd
# 在项目根目录运行
start.bat
```

**方式二：分别启动**
```cmd
# 启动后端服务
cd backend
start-backend.bat

# 启动前端服务（新开命令行窗口）
cd frontend
start-frontend.bat
```

#### Linux/Mac 环境

**启动后端服务：**
```bash
cd backend
npm run dev
```

**启动前端服务（新开终端）：**
```bash
cd frontend
npm run dev
```

### 5. 访问应用
- 前端: http://localhost:3002
- 后端API: http://localhost:3001

## 💳 支付系统

### 模拟支付（默认）
系统默认使用模拟支付，**无需任何配置**即可使用：
- ✅ 适合开发和测试
- ✅ 完整的支付流程
- ✅ 无需第三方平台

### 微信支付（可选）
如需使用微信支付，请参考 [支付系统配置文档](docs/PAYMENT_SETUP.md)

## 📱 页面路由

- `/` - 首页
- `/auth/login` - 登录页面
- `/auth/register` - 注册页面
- `/order` - 创建订单页面
- `/orders` - 订单列表页面
- `/orders/[id]` - 订单详情页面
- `/profile` - 个人中心页面

## 🔗 API 接口

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息
- `PUT /api/auth/profile` - 更新用户信息

### 快递站相关
- `GET /api/stations` - 获取快递站列表
- `GET /api/stations/:id` - 获取快递站详情

### 订单相关
- `GET /api/orders` - 获取订单列表
- `POST /api/orders` - 创建订单
- `GET /api/orders/:id` - 获取订单详情
- `PUT /api/orders/:id/status` - 更新订单状态
- `PUT /api/orders/:id/cancel` - 取消订单

### 地址相关
- `GET /api/addresses` - 获取地址列表
- `POST /api/addresses` - 创建地址
- `PUT /api/addresses/:id` - 更新地址
- `DELETE /api/addresses/:id` - 删除地址
- `GET /api/addresses/default` - 获取默认地址

### 支付相关
- `POST /api/payments/create` - 创建支付订单
- `POST /api/payments/confirm` - 确认支付（模拟支付）
- `POST /api/payments/cancel` - 取消支付
- `GET /api/payments/:paymentId/status` - 查询支付状态
- `POST /api/payments/refund` - 申请退款
- `GET /api/payments/history` - 获取支付记录

### 评价相关
- `POST /api/reviews/orders/:orderId` - 创建评价
- `GET /api/reviews/orders/:orderId` - 获取订单评价
- `GET /api/reviews` - 获取用户评价列表

## 🔒 安全特性

- JWT token认证
- 密码bcrypt加密
- 请求频率限制
- CORS配置
- 输入验证和清理
- SQL注入防护（Prisma）

## 📊 数据库模型

### 用户 (User)
- 基本信息：手机号、昵称、头像
- 时间戳：创建时间、更新时间

### 快递站 (DeliveryStation)
- 位置信息：名称、地址、经纬度
- 联系方式：电话
- 状态：是否激活

### 地址 (Address)
- 关联：用户ID
- 地址信息：省、市、区、详细地址、经纬度
- 收件信息：姓名、电话
- 默认地址标识

### 订单 (Order)
- 关联：用户ID、快递站ID
- 收件信息：姓名、电话、取件码
- 送达信息：地址、经纬度
- 服务配置：类型、是否加急
- 价格信息：基础价、距离费、加急费、总价
- 状态：订单状态、支付状态

### 支付 (Payment)
- 关联：订单ID
- 支付信息：金额、支付方式、交易号
- 状态：支付状态

### 评价 (Review)
- 关联：订单ID、用户ID
- 评价内容：评分、文字评价

## 🎯 功能说明

### 地址管理
- **历史地址**：用户选择的地址会自动保存
- **快速选择**：可以从历史地址中快速选择
- **默认地址**：第一个地址自动设为默认，可手动设置

### 支付流程
1. **创建订单**：用户填写订单信息并提交
2. **创建支付**：系统创建支付订单
3. **选择支付方式**：
   - 非微信环境：使用模拟支付
   - 微信环境：使用微信支付（如果已配置）
4. **完成支付**：支付成功后自动更新订单状态

### 地图定位
- 使用浏览器原生定位API
- 集成OpenStreetMap地图
- 支持地址搜索
- 无需API Key

## 📚 文档

详细文档请查看 [docs/](docs/) 目录：

- [文档索引](docs/README.md) - 文档导航
- [支付系统配置](docs/PAYMENT_SETUP.md) - 支付系统详细配置说明
- [微信支付配置](docs/WECHAT_PAY_SETUP.md) - 微信支付配置指南
- [功能特性说明](docs/PAYMENT_AND_ADDRESS_FEATURES.md) - 已实现功能详细说明
- [项目结构说明](PROJECT_STRUCTURE.md) - 项目目录结构详解

## 🔄 开发计划

### 已完成 ✅
- [x] 项目基础架构搭建
- [x] 用户认证系统（注册/登录）
- [x] 数据库设计和初始化
- [x] 前端基础页面和组件
- [x] 订单创建流程
- [x] 订单列表和详情
- [x] 个人中心页面
- [x] 支付系统（模拟支付 + 微信支付）
- [x] 地址历史记录功能
- [x] 原生定位功能（无需API Key）

### 计划中 📋
- [ ] 移动端适配优化
- [ ] 推送通知
- [ ] 数据统计和分析
- [ ] 多语言支持
- [ ] 支付宝支付集成
- [ ] 订单评价功能完善

## 🚀 生产环境部署

### 前端部署
```bash
cd frontend
npm run build
npm start
```

### 后端部署
```bash
cd backend
npm run build
npm start
```

### 生产环境建议
- 使用PM2管理Node.js进程
- 配置Nginx反向代理
- 设置SSL证书
- 配置数据库连接池
- 启用日志记录
- 设置环境变量（不要提交到代码库）

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

本项目仅用于学习和演示目的。

## 📞 联系方式

如有问题，请提交GitHub Issue。

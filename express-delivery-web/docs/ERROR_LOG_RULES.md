# 错误记录规则文档

## 📋 文档说明

本文档用于记录项目开发过程中遇到的所有问题、错误、解决方案和经验总结，方便后续查阅和避免重复踩坑。

---

## 📝 记录规则

### 1. 问题分类

每个问题应包含以下信息：

- **问题编号**：`ERR-YYYYMMDD-序号`（例如：`ERR-20250121-001`）
- **问题标题**：简洁描述问题
- **发生时间**：YYYY-MM-DD HH:MM
- **问题类型**：
  - `前端路由缺失` - 前端页面路由不存在导致 404
  - `后端API错误` - 后端接口报错或逻辑问题
  - `配置问题` - 环境变量、配置文件错误
  - `依赖问题` - npm 包版本冲突或缺失
  - `FRP/网络` - 内网穿透、网络配置问题
  - `Windows脚本` - 批处理脚本错误
  - `性能问题` - 性能优化相关
  - `其他` - 其他类型问题

- **严重程度**：
  - `🔴 严重` - 功能完全无法使用
  - `🟡 中等` - 功能部分受影响
  - `🟢 轻微` - 警告或提示，不影响使用

- **问题描述**：详细描述问题现象、错误信息、复现步骤
- **原因分析**：问题产生的根本原因
- **解决方案**：具体的解决步骤和代码修改
- **相关文件**：涉及的文件路径列表
- **预防措施**：如何避免类似问题再次发生

---

## 📖 记录格式模板

```markdown
### ERR-YYYYMMDD-序号: 问题标题

**发生时间**：YYYY-MM-DD HH:MM  
**问题类型**：问题类型  
**严重程度**：🔴/🟡/🟢

#### 问题描述
- 现象：具体表现
- 错误信息：完整的错误日志或截图
- 复现步骤：
  1. 步骤1
  2. 步骤2

#### 原因分析
问题的根本原因

#### 解决方案
1. 步骤1
2. 步骤2
3. 代码修改（如有）

#### 相关文件
- `文件路径1`
- `文件路径2`

#### 预防措施
如何避免类似问题
```

---

## 🔍 问题索引

按问题类型快速查找：

- [前端路由缺失](#前端路由缺失)
- [后端API错误](#后端api错误)
- [配置问题](#配置问题)
- [FRP/网络](#frp网络)
- [Windows脚本](#windows脚本)
- [其他](#其他)

---

## 📚 问题记录

### 前端路由缺失

#### ERR-20250121-001: `/addresses` 路由 404

**发生时间**：2025-01-21  
**问题类型**：前端路由缺失  
**严重程度**：🟡 中等

##### 问题描述
- 现象：通过 FRP 访问时，点击个人中心的"地址管理"按钮，页面返回 404
- 错误信息：`GET /addresses 404`
- 复现步骤：
  1. 通过 `http://服务器IP:3001` 访问前端
  2. 登录后进入个人中心
  3. 点击"📍 地址管理"按钮
  4. 页面显示 404

##### 原因分析
- `frontend/src/app/profile/page.tsx` 中有链接指向 `/addresses`
- 但项目中没有创建对应的页面文件 `frontend/src/app/addresses/page.tsx`
- Next.js 路由基于文件系统，缺少文件就会 404

##### 解决方案
1. 创建 `frontend/src/app/addresses/page.tsx` 地址管理页面
2. 实现地址列表、添加、编辑、删除、设置默认地址功能
3. 参考 `orders` 和 `profile` 页面的风格保持一致

##### 相关文件
- `frontend/src/app/profile/page.tsx` - 个人中心页面（包含链接）
- `frontend/src/app/addresses/page.tsx` - 新创建的地址管理页面
- `frontend/src/utils/api.ts` - API 调用工具（已有 `addressApi`）
- `backend/src/routes/addresses.ts` - 后端地址路由（已存在）

##### 预防措施
- 创建页面链接前，先确认对应的页面文件是否存在
- 使用 TypeScript 类型检查可以帮助发现路由问题
- 建立页面路由清单，确保所有链接都有对应页面

---

#### ERR-20250121-002: `/payments` 路由 404

**发生时间**：2025-01-21  
**问题类型**：前端路由缺失  
**严重程度**：🟡 中等

##### 问题描述
- 现象：通过 FRP 访问时，点击个人中心的"支付记录"按钮，页面返回 404
- 错误信息：`GET /payments 404`
- 复现步骤：
  1. 通过 `http://服务器IP:3001` 访问前端
  2. 登录后进入个人中心
  3. 点击"💳 支付记录"按钮
  4. 页面显示 404

##### 原因分析
- `frontend/src/app/profile/page.tsx` 中有链接指向 `/payments`
- 但项目中没有创建对应的页面文件 `frontend/src/app/payments/page.tsx`
- Next.js 路由基于文件系统，缺少文件就会 404

##### 解决方案
1. 创建 `frontend/src/app/payments/page.tsx` 支付记录页面
2. 实现支付记录列表、状态筛选、统计信息功能
3. 参考 `orders` 和 `addresses` 页面的风格保持一致

##### 相关文件
- `frontend/src/app/profile/page.tsx` - 个人中心页面（包含链接）
- `frontend/src/app/payments/page.tsx` - 新创建的支付记录页面
- `frontend/src/utils/api.ts` - API 调用工具（已有 `paymentApi.getPaymentHistory()`）
- `backend/src/routes/payments.ts` - 后端支付路由（已存在 `/history` 接口）

##### 预防措施
- 同 ERR-20250121-001
- 在创建导航链接时，同步创建对应的页面文件

---

#### ERR-20250121-006: `/reviews` 路由 404

**发生时间**：2025-01-21  
**问题类型**：前端路由缺失  
**严重程度**：🟡 中等

##### 问题描述
- 现象：通过 FRP 访问时，点击个人中心的"我的评价"按钮，页面返回 404
- 错误信息：`GET /reviews 404`
- 复现步骤：
  1. 通过 `http://服务器IP:3001` 访问前端
  2. 登录后进入个人中心
  3. 点击"⭐ 我的评价"按钮
  4. 页面显示 404

##### 原因分析
- `frontend/src/app/profile/page.tsx` 中有链接指向 `/reviews`
- 但项目中没有创建对应的页面文件 `frontend/src/app/reviews/page.tsx`
- Next.js 路由基于文件系统，缺少文件就会 404

##### 解决方案
1. 创建 `frontend/src/app/reviews/page.tsx` 评价管理页面
2. 实现评价列表、编辑、删除、统计信息功能
3. 支持星级评分显示和编辑
4. 参考 `orders` 和 `payments` 页面的风格保持一致

##### 相关文件
- `frontend/src/app/profile/page.tsx` - 个人中心页面（包含链接）
- `frontend/src/app/reviews/page.tsx` - 新创建的评价管理页面
- `frontend/src/utils/api.ts` - API 调用工具（已有 `reviewApi.getUserReviews()`）
- `backend/src/routes/reviews.ts` - 后端评价路由（已存在 `/` 接口）

##### 预防措施
- 同 ERR-20250121-001 和 ERR-20250121-002
- 建立页面路由清单，确保所有导航链接都有对应页面
- 在开发导航菜单时，同步创建所有页面文件

---

### 配置问题

#### ERR-20250121-003: Express rate-limit 警告 trust proxy

**发生时间**：2025-01-21  
**问题类型**：配置问题  
**严重程度**：🟢 轻微（警告，不影响功能）

##### 问题描述
- 现象：后端启动后出现警告信息
- 错误信息：
```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false...
ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
```
- 复现步骤：
  1. 通过 FRP 访问后端 API
  2. 后端控制台出现警告

##### 原因分析
- 通过 FRP 反向代理访问后端时，FRP 会在请求头中添加 `X-Forwarded-For`（用于标识真实客户端 IP）
- Express 默认不信任代理（`trust proxy = false`）
- `express-rate-limit` 检测到 `X-Forwarded-For` 头但 Express 未启用 `trust proxy`，触发警告
- 这会导致 rate-limit 无法正确识别真实 IP，可能影响限流准确性

##### 解决方案
在 `backend/src/server.ts` 中，**在中间件配置之前**添加：

```typescript
// 信任代理设置（用于 FRP/反向代理场景，让 rate-limit 能正确识别真实 IP）
app.set('trust proxy', true);
```

修改后需要重启后端服务，警告会消失。

##### 相关文件
- `backend/src/server.ts` - 后端主文件
- `docs/FRP_GUIDE.md` - FRP 配置文档（已更新此问题说明）

##### 预防措施
- 如果使用反向代理（FRP、Nginx、宝塔等），必须启用 `trust proxy`
- 部署到生产环境前检查此配置

---

### FRP/网络

#### ERR-20250121-004: Next.js allowedDevOrigins 跨域警告

**发生时间**：2025-01-21  
**问题类型**：FRP/网络  
**严重程度**：🟢 轻微（警告，不影响功能）

##### 问题描述
- 现象：通过公网 IP 访问 Next.js dev 时出现警告
- 错误信息：
```
⚠ Cross origin request detected from 115.190.245.37 to /_next/* resource. 
In a future major version of Next.js, you will need to explicitly configure "allowedDevOrigins"...
```
- 复现步骤：
  1. 通过 `http://115.190.245.37:3001` 访问前端 dev
  2. 浏览器控制台或终端出现警告

##### 原因分析
- Next.js dev 模式下，从非 `localhost` 的来源访问 dev 静态资源 `/_next/*`
- Next.js 检测到跨域请求，提示将来需要显式配置允许的来源

##### 解决方案
在 `frontend/next.config.ts` 中添加：

```typescript
const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: [
      'http://115.190.245.37:3001',
      'http://115.190.245.37',
      // 如果有域名也访问 dev，继续添加
    ],
  },
  // ... 其他配置
};
```

修改后需要**重启前端 dev 服务**。

##### 相关文件
- `frontend/next.config.ts` - Next.js 配置文件
- `docs/FRP_GUIDE.md` - FRP 配置文档（已更新此问题说明）

##### 预防措施
- 如果通过 FRP/反向代理访问 dev，提前配置 `allowedDevOrigins`
- 生产环境使用 `next build` 构建后不会有此问题

---

### Windows脚本

#### ERR-20250121-005: start.bat 中文乱码被当命令执行

**发生时间**：2025-01-21  
**问题类型**：Windows脚本  
**严重程度**：🔴 严重（脚本无法运行）

##### 问题描述
- 现象：运行 `start.bat` 时出现错误
- 错误信息：
```
'鍚姩鑴氭湰' 不是内部或外部命令，也不是可运行的程序或批处理文件。
'...' 不是内部或外部命令...
```
- 复现步骤：
  1. 双击或运行 `start.bat`
  2. 出现上述错误

##### 原因分析
- 批处理文件中有"中文说明行"没有用 `echo`/`REM`，被 `cmd` 当成命令执行
- 文件编码/代码页不一致导致中文显示为乱码
- Windows CMD 默认代码页可能不是 UTF-8

##### 解决方案
1. **所有说明文字都用 `echo` 输出**（不要裸写中文行）
2. **脚本开头加**：`chcp 65001 >nul`（设置 UTF-8 代码页）
3. **文件编码保存为 UTF-8 with BOM**（Windows 下更稳定）

示例：
```batch
@echo off
chcp 65001 >nul
echo ========================================
echo   快递服务系统 - Windows 启动脚本
echo ========================================
```

##### 相关文件
- `start.bat` - 根目录启动脚本
- `backend/start-backend.bat` - 后端启动脚本
- `frontend/start-frontend.bat` - 前端启动脚本

##### 预防措施
- 批处理文件中所有中文必须用 `echo` 输出
- 脚本开头统一加 `chcp 65001 >nul`
- 使用支持 UTF-8 BOM 的编辑器保存文件
- 使用 PowerShell 7+ 或 Windows Terminal 可以更好地支持 UTF-8

---

## 📊 统计信息

- **总问题数**：6
- **已解决**：6
- **待解决**：0

**按类型分布**：
- 前端路由缺失：3
- 配置问题：1
- FRP/网络：1
- Windows脚本：1

**按严重程度分布**：
- 🔴 严重：1
- 🟡 中等：3
- 🟢 轻微：2

---

## 🔄 更新日志

- 2025-01-21：创建文档，记录初始 5 个问题
- 2025-01-21：新增 ERR-20250121-006 `/reviews` 路由 404 问题

---

## 💡 使用建议

1. **遇到新问题时**：
   - 按照模板格式记录到对应分类下
   - 问题编号按时间顺序递增
   - 详细记录解决过程，方便后续查阅

2. **解决问题后**：
   - 更新"统计信息"部分
   - 在"更新日志"中记录日期和变更

3. **定期回顾**：
   - 检查是否有重复问题
   - 总结常见问题模式
   - 更新预防措施

4. **团队协作**：
   - 团队成员遇到问题先查此文档
   - 解决新问题后及时更新文档
   - 定期同步给团队成员

# FRP 内网穿透（宝塔 frps + 本地 frpc）配置与排查说明

## 适用场景

- **frps（服务端）**运行在公网服务器（宝塔面板所在服务器）。
- **frpc（客户端）**运行在本地电脑（项目实际跑在本地）。
- 端口统一约定：
  - **前端（Next.js dev）**：`3001`
  - **后端（Express API）**：`3000`

最终访问目标：

- **本地前端**：`http://localhost:3001`
- **本地后端**：`http://localhost:3000`
- **外网前端**：`http://<服务器IP或域名>:3001`
- **外网后端**：`http://<服务器IP或域名>:3000`

> 说明：不使用子域名时，后端推荐用 **TCP 代理（端口映射）** 暴露为 `服务器IP:3000`。

---

## 一、frps（宝塔公网服务器）示例配置

在公网服务器上配置并启动 frps（示例为 `frps.toml`）：

```toml
bindPort = 7000

auth.method = "token"
auth.token = "替换成你自己的token"

# 用于 HTTP 类型代理的 vhost 端口（前端对外访问用）
vhostHTTPPort = 3001

# 管理面板（可选）
webServer.addr = "0.0.0.0"
webServer.port = 7500
webServer.user = "admin"
webServer.password = "替换成你自己的密码"
```

### 必做检查

- **服务器防火墙/宝塔安全/云安全组**至少放行：
  - TCP `7000`（frpc 连接 frps）
  - TCP `3001`（前端对外访问，HTTP vhost）
  - TCP `3000`（后端对外访问，TCP 映射）
  - （可选）TCP `7500`（管理面板）

---

## 二、frpc（本地电脑）示例配置

本地配置并启动 frpc（示例为 `frpc.toml`）：

```toml
serverAddr = "你的公网服务器IP"
serverPort = 7000

auth.method = "token"
auth.token = "替换成你自己的token"

# 前端：HTTP 代理（对外暴露为 frps 的 vhostHTTPPort=3001）
[[proxies]]
name = "web-frontend"
type = "http"
localIP = "127.0.0.1"
localPort = 3001
customDomains = ["你的域名(可选)"]

# 后端：TCP 代理（对外暴露为 服务器IP:3000）
[[proxies]]
name = "api-backend"
type = "tcp"
localIP = "127.0.0.1"
localPort = 3000
remotePort = 3000
```

### 为什么后端用 TCP 而不是 HTTP

- **HTTP 类型代理**需要通过域名的 `Host` 做分流（通常要 `api.xxx.com` 这种子域名）。
- 你不想加子域名时，最简单稳定的是 **TCP 映射**：`服务器IP:3000 -> 本地:3000`。

---

## 三、项目端口统一（前端 3001 / 后端 3000）

项目内的默认端口应保持一致，否则会出现“前端能开，但 API 全 404/连不上”的问题。

### 后端（Express）

- 后端端口优先级建议为：`PORT` > `BACKEND_PORT` > `3000`
- 本地可用健康检查验证：`http://localhost:3000/health`

### 前端（Next.js）

- Next dev 端口：`3001`
- API 转发：将 `/api/*` 重写到 `http://localhost:3000/api/*`

---

## 四、Windows `start.bat` 常见报错与修复

### 典型报错

类似：

- `'XXXX' 不是内部或外部命令，也不是可运行的程序或批处理文件。`
- 中文内容显示为乱码（例如 `鍚姩...`）

### 原因

- 批处理里存在“中文说明行”没有用 `echo`/`REM`，被 `cmd` 当成命令执行；
- 再叠加文件编码/代码页不一致导致显示为乱码。

### 修复要点

- 所有说明文字都用 `echo` 输出（不要裸写中文行）
- 脚本开头加：`chcp 65001 >nul`
- 文件编码建议保存为 **UTF-8 with BOM**（Windows 下更稳定）

---

## 五、Next.js 警告：allowedDevOrigins（通过公网 IP 访问 dev）

现象：

- 通过 `http://<服务器IP>:3001` 访问 Next dev 时出现警告：
  - `Cross origin request detected from <服务器IP> to /_next/* ...`

原因：

- Next.js dev 模式下，你从非 `localhost` 的来源访问 dev 静态资源 `/_next/*`。

处理：

- 在 `frontend/next.config.ts` 增加 `experimental.allowedDevOrigins`，把你访问 dev 的来源加入白名单，例如：
  - `http://115.190.245.37:3001`
  - `http://115.190.245.37`

改完需要 **重启** 前端 dev 服务（重新 `npm run dev`）。

---

## 六、Express rate-limit 警告：trust proxy（通过 FRP 访问后端）

### 现象

后端启动后出现警告：

```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false...
```

### 原因

- 通过 FRP 反向代理访问后端时，FRP 会在请求头中添加 `X-Forwarded-For`（用于标识真实客户端 IP）。
- Express 默认不信任代理（`trust proxy = false`），导致 `express-rate-limit` 无法正确识别真实 IP，触发警告。

### 修复

在后端 `backend/src/server.ts` 中，**在中间件配置之前**添加：

```typescript
// 信任代理设置（用于 FRP/反向代理场景，让 rate-limit 能正确识别真实 IP）
app.set('trust proxy', true);
```

**位置示例：**

```typescript
const app = express();
const port = Number(process.env.PORT || process.env.BACKEND_PORT || 3000);

export const prisma = new PrismaClient();

// ✅ 在这里添加 trust proxy 设置
app.set('trust proxy', true);

// 中间件配置
app.use(helmet());
// ... 其他中间件
```

**修改后需要重启后端服务**，警告会消失，rate-limit 也能正确按真实 IP 限流。

> **注意**：如果你将来部署到生产环境（例如用 Nginx/宝塔反向代理），也需要启用 `trust proxy`。

---

## 七、快速排查清单

- **外网后端 `服务器IP:3000` 访问不了**
  - 服务器是否放行 TCP `3000`
  - frpc 是否在本地运行、`remotePort=3000` 是否配置正确
  - 本地后端是否能访问 `http://localhost:3000/health`

- **外网前端 `服务器IP:3001` 能开但 API 失败**
  - 前端重写是否指向 `http://localhost:3000/api`
  - 后端是否在 `3000` 启动

- **Next dev 出现 allowedDevOrigins 警告**
  - `allowedDevOrigins` 是否包含你访问时使用的 `协议://主机:端口`
  - 修改后是否重启了前端 dev


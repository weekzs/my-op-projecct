# 微信支付配置说明

## 1. 证书文件配置

请将微信支付证书文件放置在项目根目录下的证书目录：
```
express-delivery-web/1738582376_20260121_cert/
```

证书目录应包含以下文件：
- `apiclient_key.pem` - 私钥文件
- `apiclient_cert.pem` - 证书文件
- `32字符串.txt` - 密钥文件（已包含，apiv3和apiv2使用同一个32字符密钥）

**默认配置：**
- 商户号（MCH_ID）: `1738582376`
- API v3 密钥: `K9nP2fQ8jR5tW7xY1zA6bC3dE4gH8jM9`
- API v2 密钥: `K9nP2fQ8jR5tW7xY1zA6bC3dE4gH8jM9`

如果证书文件在其他位置，请在 `.env` 文件中修改 `WECHAT_CERT_PATH` 环境变量。

## 2. 环境变量配置

在 `backend` 目录下创建 `.env` 文件，配置以下变量：

```env
# 微信支付配置
WECHAT_APP_ID=你的微信小程序/公众号AppID
WECHAT_MCH_ID=1738582376
WECHAT_API_V3_KEY=K9nP2fQ8jR5tW7xY1zA6bC3dE4gH8jM9
WECHAT_API_V2_KEY=K9nP2fQ8jR5tW7xY1zA6bC3dE4gH8jM9
WECHAT_SERIAL_NO=你的证书序列号
# 本地开发可以不设置 WECHAT_CERT_PATH，代码会自动使用相对路径 1738582376_20260121_cert
# 生产环境需要设置为证书目录的绝对路径
WECHAT_CERT_PATH=
WECHAT_NOTIFY_URL=http://localhost:3001/api/payments/wechat/notify
```

**注意：** 
- API v3 和 API v2 密钥默认使用相同的32字符密钥，如果需要不同的密钥，可以分别设置
- 本地开发时，如果不设置 `WECHAT_CERT_PATH`，代码会自动从项目根目录查找 `1738582376_20260121_cert` 目录
- 支付回调URL需要配置为公网可访问的地址（生产环境）

## 3. 测试

配置完成后，重启后端和前端服务：

**Windows 环境：**

```cmd
# 后端
cd backend
start-backend.bat

# 前端（新开命令行窗口）
cd frontend
start-frontend.bat
```

**或使用 npm：**

```bash
# 后端
cd backend
npm run dev

# 前端（新开命令行窗口）
cd frontend
npm run dev
```

## 4. 注意事项

- API v3 密钥和 API v2 密钥都是32字符的字符串
- 证书文件路径使用绝对路径或相对于项目根目录的路径
- 支付回调URL需要配置为公网可访问的地址（生产环境）
- 如果证书文件不存在，系统会自动使用模拟模式（仅用于开发测试）

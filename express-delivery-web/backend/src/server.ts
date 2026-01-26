import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import orderRoutes from './routes/orders';
import stationRoutes from './routes/stations';
import addressRoutes from './routes/addresses';
import paymentRoutes from './routes/payments';
import reviewRoutes from './routes/reviews';
import uploadRoutes from './routes/uploads';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();
const port = Number(process.env.PORT || process.env.BACKEND_PORT || 3000);

// 初始化Prisma客户端
export const prisma = new PrismaClient();

// 信任代理设置（用于 FRP/反向代理场景，让 rate-limit 能正确识别真实 IP）
// 如果通过 FRP、Nginx、宝塔等反向代理访问，必须启用此设置
app.set('trust proxy', true);

// 中间件配置
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100次请求
  message: '请求过于频繁，请稍后再试'
});
app.use(limiter);

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/uploads', uploadRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use(notFound);
app.use(errorHandler);

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 服务器运行在端口 ${port}`);
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
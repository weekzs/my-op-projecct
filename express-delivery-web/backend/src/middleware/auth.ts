import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    id: string;
    phone: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '访问令牌缺失' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '无效的访问令牌' });
    }
    req.user = user as { id: string; phone: string };
    next();
  });
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: '数据验证失败',
      errors: err.errors
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      message: '数据已存在',
      field: err.meta?.target
    });
  }

  res.status(500).json({
    message: '服务器内部错误'
  });
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ message: '接口不存在' });
};
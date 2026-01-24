import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('=== 错误处理中间件 ===');
  console.error('错误堆栈:', err.stack);
  console.error('错误详情:', {
    name: err.name,
    message: err.message,
    code: err.code,
    meta: err.meta
  });

  // Prisma错误处理
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          message: '数据已存在',
          field: err.meta?.target
        });
      case 'P2003':
        return res.status(400).json({
          message: '外键约束失败，请检查关联数据是否存在',
          field: err.meta?.field_name
        });
      case 'P2014':
        return res.status(400).json({
          message: '必需字段缺失',
          field: err.meta?.target
        });
      case 'P2025':
        return res.status(404).json({
          message: '记录不存在'
        });
    }
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: '数据验证失败',
      errors: err.errors
    });
  }

  // 默认500错误
  res.status(500).json({
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? {
      name: err.name,
      message: err.message,
      stack: err.stack
    } : undefined
  });
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ message: '接口不存在' });
};
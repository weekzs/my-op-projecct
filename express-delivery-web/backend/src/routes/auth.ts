import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { phone, password, nickname } = req.body;

    // 验证输入
    if (!phone || !password) {
      return res.status(400).json({ message: '手机号和密码不能为空' });
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      return res.status(409).json({ message: '该手机号已被注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        nickname: nickname || phone
      },
      select: {
        id: true,
        phone: true,
        nickname: true,
        createdAt: true
      }
    });

    // 自动生成JWT令牌
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
    console.log('JWT_SECRET:', jwtSecret ? '已设置' : '未设置');

    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    console.log('生成的token:', token ? '成功' : '失败');

    res.status(201).json({
      message: '注册成功',
      token,
      user
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '注册失败，请重试' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: '手机号和密码不能为空' });
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '密码错误' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '登录失败，请重试' });
  }
});

// 获取用户信息
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
      select: {
        id: true,
        phone: true,
        nickname: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ user });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    const userId = (req as any).user.id;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nickname && { nickname }),
        ...(avatar && { avatar })
      },
      select: {
        id: true,
        phone: true,
        nickname: true,
        avatar: true,
        updatedAt: true
      }
    });

    res.json({
      message: '用户信息更新成功',
      user
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ message: '更新用户信息失败' });
  }
});

export default router;
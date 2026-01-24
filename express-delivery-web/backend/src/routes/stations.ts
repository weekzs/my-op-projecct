import express from 'express';
import { prisma } from '../server';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 获取所有快递站
router.get('/', async (req, res) => {
  try {
    const stations = await prisma.deliveryStation.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ stations });
  } catch (error) {
    console.error('获取快递站列表失败:', error);
    res.status(500).json({ message: '获取快递站列表失败' });
  }
});

// 获取单个快递站详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params as { id: string };

    const station = await prisma.deliveryStation.findUnique({
      where: { id }
    });

    if (!station) {
      return res.status(404).json({ message: '快递站不存在' });
    }

    res.json({ station });
  } catch (error) {
    console.error('获取快递站详情失败:', error);
    res.status(500).json({ message: '获取快递站详情失败' });
  }
});

// 创建快递站 (管理员功能)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, address, latitude, longitude, phone, description } = req.body as any;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: '快递站名称、地址、经纬度不能为空' });
    }

    const station = await prisma.deliveryStation.create({
      data: {
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone,
        description
      }
    });

    res.status(201).json({
      message: '快递站创建成功',
      station
    });
  } catch (error: any) {
    console.error('创建快递站失败:', error);
    res.status(500).json({ message: '创建快递站失败' });
  }
});

// 更新快递站 (管理员功能)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { name, address, latitude, longitude, phone, description, isActive } = req.body as any;

    const station = await prisma.deliveryStation.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
        ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
        ...(phone !== undefined && { phone }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      message: '快递站更新成功',
      station
    });
  } catch (error: any) {
    console.error('更新快递站失败:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: '快递站不存在' });
    }
    res.status(500).json({ message: '更新快递站失败' });
  }
});

// 删除快递站 (管理员功能)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params as { id: string };

    await prisma.deliveryStation.delete({
      where: { id }
    });

    res.json({ message: '快递站删除成功' });
  } catch (error: any) {
    console.error('删除快递站失败:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: '快递站不存在' });
    }
    res.status(500).json({ message: '删除快递站失败' });
  }
});

export default router;
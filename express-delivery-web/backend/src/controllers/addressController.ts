import { Request, Response } from 'express';
import { addressService } from '../services/addressService';
import { authenticateToken } from '../middleware/auth';

export class AddressController {
  // 获取用户地址列表
  async getUserAddresses(req: Request & { user?: any }, res: Response) {
    try {
      const addresses = await addressService.getUserAddresses(req.user!.id);
      res.json({ addresses });
    } catch (error: any) {
      console.error('获取地址列表失败:', error);
      res.status(500).json({ message: '获取地址列表失败' });
    }
  }

  // 创建地址
  async createAddress(req: Request & { user?: any }, res: Response) {
    try {
      const addressData = req.body;

      // 验证必填字段
      const requiredFields = ['name', 'phone', 'province', 'city', 'district', 'address'];
      for (const field of requiredFields) {
        if (!addressData[field]) {
          return res.status(400).json({ message: `${field}不能为空` });
        }
      }

      const address = await addressService.createAddress(req.user!.id, addressData);

      res.status(201).json({
        success: true,
        address
      });
    } catch (error: any) {
      console.error('创建地址失败:', error);
      res.status(500).json({ message: error.message || '创建地址失败' });
    }
  }

  // 更新地址
  async updateAddress(req: Request & { user?: any }, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const addressData = req.body;

      const address = await addressService.updateAddress(id, req.user!.id, addressData);

      res.json({
        success: true,
        address
      });
    } catch (error: any) {
      console.error('更新地址失败:', error);
      res.status(500).json({ message: error.message || '更新地址失败' });
    }
  }

  // 删除地址
  async deleteAddress(req: Request & { user?: any }, res: Response) {
    try {
      const { id } = req.params as { id: string };
      await addressService.deleteAddress(id, req.user!.id);

      res.json({ success: true, message: '地址删除成功' });
    } catch (error: any) {
      console.error('删除地址失败:', error);
      res.status(500).json({ message: error.message || '删除地址失败' });
    }
  }

  // 设置默认地址
  async setDefaultAddress(req: Request & { user?: any }, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const address = await addressService.setDefaultAddress(id, req.user!.id);

      res.json({
        success: true,
        address
      });
    } catch (error: any) {
      console.error('设置默认地址失败:', error);
      res.status(500).json({ message: error.message || '设置默认地址失败' });
    }
  }

  // 获取默认地址
  async getDefaultAddress(req: Request & { user?: any }, res: Response) {
    try {
      const address = await addressService.getDefaultAddress(req.user!.id);
      res.json({ address });
    } catch (error: any) {
      console.error('获取默认地址失败:', error);
      res.status(500).json({ message: '获取默认地址失败' });
    }
  }
}

export const addressController = new AddressController();
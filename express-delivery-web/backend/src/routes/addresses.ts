import express from 'express';
import { addressController } from '../controllers/addressController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 获取用户地址列表
router.get('/', authenticateToken, addressController.getUserAddresses.bind(addressController));

// 创建地址
router.post('/', authenticateToken, addressController.createAddress.bind(addressController));

// 更新地址
router.put('/:id', authenticateToken, addressController.updateAddress.bind(addressController));

// 删除地址
router.delete('/:id', authenticateToken, addressController.deleteAddress.bind(addressController));

// 设置默认地址
router.put('/:id/default', authenticateToken, addressController.setDefaultAddress.bind(addressController));

// 获取默认地址
router.get('/default', authenticateToken, addressController.getDefaultAddress.bind(addressController));

export default router;
import { prisma } from '../server';

export class AddressService {
  // 获取用户地址列表
  async getUserAddresses(userId: string) {
    try {
      const addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return addresses;
    } catch (error) {
      console.error('获取用户地址失败:', error);
      throw error;
    }
  }

  // 创建地址
  async createAddress(userId: string, addressData: any) {
    try {
      const {
        name,
        phone,
        province,
        city,
        district,
        address,
        latitude,
        longitude,
        isDefault = false
      } = addressData;

      // 如果设置为默认地址，先取消其他默认地址
      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId },
          data: { isDefault: false }
        });
      }

      const newAddress = await prisma.address.create({
        data: {
          userId,
          name,
          phone,
          province,
          city,
          district,
          address,
          latitude,
          longitude,
          isDefault
        }
      });

      return newAddress;
    } catch (error) {
      console.error('创建地址失败:', error);
      throw error;
    }
  }

  // 更新地址
  async updateAddress(addressId: string, userId: string, addressData: any) {
    try {
      // 检查地址是否存在且属于用户
      const existingAddress = await prisma.address.findFirst({
        where: { id: addressId, userId }
      });

      if (!existingAddress) {
        throw new Error('地址不存在');
      }

      const {
        name,
        phone,
        province,
        city,
        district,
        address,
        latitude,
        longitude,
        isDefault = false
      } = addressData;

      // 如果设置为默认地址，先取消其他默认地址
      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId, id: { not: addressId } },
          data: { isDefault: false }
        });
      }

      const updatedAddress = await prisma.address.update({
        where: { id: addressId },
        data: {
          name,
          phone,
          province,
          city,
          district,
          address,
          latitude,
          longitude,
          isDefault
        }
      });

      return updatedAddress;
    } catch (error) {
      console.error('更新地址失败:', error);
      throw error;
    }
  }

  // 删除地址
  async deleteAddress(addressId: string, userId: string) {
    try {
      // 检查地址是否存在且属于用户
      const address = await prisma.address.findFirst({
        where: { id: addressId, userId }
      });

      if (!address) {
        throw new Error('地址不存在');
      }

      await prisma.address.delete({
        where: { id: addressId }
      });

      return { success: true };
    } catch (error) {
      console.error('删除地址失败:', error);
      throw error;
    }
  }

  // 设置默认地址
  async setDefaultAddress(addressId: string, userId: string) {
    try {
      // 检查地址是否存在且属于用户
      const address = await prisma.address.findFirst({
        where: { id: addressId, userId }
      });

      if (!address) {
        throw new Error('地址不存在');
      }

      // 取消所有默认地址
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });

      // 设置新默认地址
      const updatedAddress = await prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true }
      });

      return updatedAddress;
    } catch (error) {
      console.error('设置默认地址失败:', error);
      throw error;
    }
  }

  // 获取默认地址
  async getDefaultAddress(userId: string) {
    try {
      const address = await prisma.address.findFirst({
        where: { userId, isDefault: true }
      });

      return address;
    } catch (error) {
      console.error('获取默认地址失败:', error);
      throw error;
    }
  }
}

export const addressService = new AddressService();
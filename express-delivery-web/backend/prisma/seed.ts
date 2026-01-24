import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始 seeding 数据库...');

  // 创建一些示例快递站
  const stations = [
    {
      name: '北京市海淀区快递站',
      address: '北京市海淀区中关村大厦',
      latitude: 39.9042,
      longitude: 116.4074,
      phone: '010-12345678',
      description: '位于中关村核心地带，交通便利'
    },
    {
      name: '上海市浦东新区快递站',
      address: '上海市浦东新区陆家嘴金融中心',
      latitude: 31.2304,
      longitude: 121.4737,
      phone: '021-87654321',
      description: '浦东新区核心区域，服务优质'
    },
    {
      name: '广州市天河区快递站',
      address: '广州市天河区珠江新城',
      latitude: 23.1291,
      longitude: 113.2644,
      phone: '020-11223344',
      description: '天河区繁华地段，配送快速'
    },
    {
      name: '深圳市南山区快递站',
      address: '深圳市南山区科技园',
      latitude: 22.5429,
      longitude: 114.0596,
      phone: '0755-55667788',
      description: '南山区科技园区，专业服务'
    },
    {
      name: '杭州市西湖区快递站',
      address: '杭州市西湖区文三路',
      latitude: 30.2741,
      longitude: 120.1551,
      phone: '0571-33445566',
      description: '西湖区中心地带，风景优美'
    }
  ];

  for (const station of stations) {
    const existingStation = await prisma.deliveryStation.findFirst({
      where: { name: station.name }
    });

    if (!existingStation) {
      await prisma.deliveryStation.create({
        data: station,
      });
    }
  }

  console.log('✅ 数据库 seeding 完成');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 数据库 seeding 失败:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
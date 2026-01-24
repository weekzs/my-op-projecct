import express from 'express';

const router = express.Router();

// 文件上传路由 - 暂时返回开发中
router.get('/', (req, res) => {
  res.json({ message: '文件上传功能开发中' });
});

export default router;
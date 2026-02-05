// 简单的状态检查API
export default function handler(req, res) {
  res.status(200).json({
    status: 'success',
    message: '植物养护系统API正常运行',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production'
  });
}
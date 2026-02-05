// 最简单的健康检查API
module.exports = (req, res) => {
  res.json({
    status: 'ok',
    message: '植物养护系统运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
};
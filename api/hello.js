// 最简单的测试API
module.exports = (req, res) => {
  res.json({
    message: 'Hello from 植物养护系统!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
};
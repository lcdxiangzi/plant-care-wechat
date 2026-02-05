const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const healthChecker = require('./utils/healthCheck');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static('client/dist'));

// 路由
app.use('/api/wechat', require('./routes/wechat'));
app.use('/api/user', require('./routes/user'));
app.use('/api/plant', require('./routes/plant'));
app.use('/api/care', require('./routes/care'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/community', require('./routes/community'));
app.use('/api/upload', require('./routes/upload'));

// 健康检查
app.get('/api/health', async (req, res) => {
  try {
    const healthResult = await healthChecker.quickCheck();
    
    res.status(healthResult.status === 'healthy' ? 200 : 503).json({
      ...healthResult,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: '健康检查失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 详细健康检查
app.get('/api/health/detailed', async (req, res) => {
  try {
    const healthResult = await healthChecker.runAllChecks();
    
    res.status(healthResult.status === 'healthy' ? 200 : 503).json({
      ...healthResult,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: '详细健康检查失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    code: 404, 
    message: 'API endpoint not found' 
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    code: 500, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，开始优雅关闭...');
  
  try {
    const db = require('./utils/database');
    await db.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('关闭数据库连接时出错:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，开始优雅关闭...');
  
  try {
    const db = require('./utils/database');
    await db.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('关闭数据库连接时出错:', error);
  }
  
  process.exit(0);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 WeChat H5 Plant Care App`);
    console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
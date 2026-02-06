const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static('client/dist'));

// 简单的API端点
app.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: '植物养护系统API正常运行',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '系统健康',
    timestamp: new Date().toISOString()
  });
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
    message: 'Internal server error'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Plant Care System`);
    console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// 微信配置
const WECHAT_TOKEN = process.env.WECHAT_TOKEN || 'plant_care_token_2024';

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 微信服务器验证接口
app.get('/wechat', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  
  console.log('收到微信验证请求:', { signature, timestamp, nonce, echostr });
  
  // 验证签名
  const token = WECHAT_TOKEN;
  const tmpArr = [token, timestamp, nonce].sort();
  const tmpStr = tmpArr.join('');
  const tmpSha = crypto.createHash('sha1').update(tmpStr).digest('hex');
  
  if (tmpSha === signature) {
    console.log('✅ 微信验证成功');
    res.send(echostr);
  } else {
    console.log('❌ 微信验证失败');
    res.send('验证失败');
  }
});

// 微信消息接收接口
app.post('/wechat', (req, res) => {
  console.log('收到微信消息');
  res.send('success');
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '植物养护系统运行正常',
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

// 主页
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// 启动服务器
app.listen(PORT, () => {
  console.log('🌱 植物养护微信公众号服务启动');
  console.log(`📡 端口: ${PORT}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔗 微信验证: http://localhost:${PORT}/wechat`);
});

module.exports = app;
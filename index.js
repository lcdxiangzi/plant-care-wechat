const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 微信配置
const WECHAT_TOKEN = process.env.WECHAT_TOKEN || 'plant_care_token_2024';
const WECHAT_APPID = process.env.WECHAT_APPID || 'wx1dd6d394f46a502d';
const WECHAT_APPSECRET = process.env.WECHAT_APPSECRET || '';

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 添加原始body解析中间件（用于微信XML消息）
app.use('/wechat', express.text({ type: 'text/xml' }));

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
  console.log('消息内容:', req.body);
  
  try {
    // 解析XML消息（简单提取）
    const body = req.body || '';
    
    // 提取关键信息
    const toUserMatch = body.match(/<ToUserName><!\[CDATA\[(.*?)\]\]><\/ToUserName>/);
    const fromUserMatch = body.match(/<FromUserName><!\[CDATA\[(.*?)\]\]><\/FromUserName>/);
    const msgTypeMatch = body.match(/<MsgType><!\[CDATA\[(.*?)\]\]><\/MsgType>/);
    const eventMatch = body.match(/<Event><!\[CDATA\[(.*?)\]\]><\/Event>/);
    const eventKeyMatch = body.match(/<EventKey><!\[CDATA\[(.*?)\]\]><\/EventKey>/);
    
    const toUser = toUserMatch ? toUserMatch[1] : '';
    const fromUser = fromUserMatch ? fromUserMatch[1] : '';
    const msgType = msgTypeMatch ? msgTypeMatch[1] : '';
    const event = eventMatch ? eventMatch[1] : '';
    const eventKey = eventKeyMatch ? eventKeyMatch[1] : '';
    
    console.log('解析结果:', { toUser, fromUser, msgType, event, eventKey });
    
    let replyContent = '';
    
    // 处理不同类型的消息
    if (msgType === 'event') {
      // 处理事件消息
      if (event === 'subscribe') {
        // 关注事件
        replyContent = `🌱 欢迎关注植物养护助手！

感谢您的关注！我们致力于帮助您更好地照顾您的植物。

当前版本：v0.1.2（测试版）

功能开发中：
📝 植物管理
🤖 AI识别
💡 养护建议

点击菜单开始使用！`;
      } else if (event === 'CLICK') {
        // 菜单点击事件
        if (eventKey === 'CARE_TIPS') {
          replyContent = `💡 植物养护小贴士

🌿 浇水：见干见湿，不要积水
☀️ 光照：根据植物习性调整
🌡️ 温度：避免极端温度
✂️ 修剪：及时清理枯叶

更多功能开发中...`;
        } else if (eventKey === 'ABOUT') {
          replyContent = `🌱 关于植物养护助手

版本：v0.1.2
状态：测试版

我们的目标：
让每个人都能轻松养好植物

开发团队：lcdxiangzi
联系方式：lcdxiangzi@163.com

感谢您的支持！`;
        }
      }
    } else {
      // 处理普通文本消息
      replyContent = `🌱 收到您的消息！

当前版本：v0.1.2（测试版）

功能开发中，敬请期待：
📝 植物管理
🤖 AI识别
💡 养护建议

点击菜单了解更多！`;
    }
    
    // 构建回复消息
    const replyMessage = `<xml>
  <ToUserName><![CDATA[${fromUser}]]></ToUserName>
  <FromUserName><![CDATA[${toUser}]]></FromUserName>
  <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${replyContent}]]></Content>
</xml>`;
    
    console.log('发送回复消息');
    res.type('application/xml').send(replyMessage);
    
  } catch (error) {
    console.error('处理消息出错:', error);
    res.send('success');
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '植物养护系统运行正常',
    timestamp: new Date().toISOString(),
    version: '0.1.4'
  });
});

// 获取微信access_token
async function getAccessToken() {
  try {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APPID}&secret=${WECHAT_APPSECRET}`;
    const response = await axios.get(url);
    
    if (response.data.access_token) {
      console.log('✅ 获取access_token成功');
      return response.data.access_token;
    } else {
      console.error('❌ 获取access_token失败:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ 获取access_token异常:', error.message);
    return null;
  }
}

// 创建微信菜单接口（自动调用微信API）
app.get('/wechat/menu/create', async (req, res) => {
  try {
    console.log('开始创建微信菜单...');
    
    // 检查AppSecret是否配置
    if (!WECHAT_APPSECRET) {
      return res.json({
        success: false,
        message: '请先在Railway配置WECHAT_APPSECRET环境变量',
        instructions: [
          '1. 进入Railway项目',
          '2. 点击Variables标签',
          '3. 添加: WECHAT_APPSECRET=你的AppSecret',
          '4. 重新部署后再访问此接口'
        ]
      });
    }
    
    // 获取access_token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return res.json({
        success: false,
        message: '获取access_token失败，请检查AppID和AppSecret是否正确'
      });
    }
    
    // 菜单配置
    const menu = {
      button: [
        {
          type: 'view',
          name: '我的植物',
          url: `https://${req.get('host')}/`
        },
        {
          type: 'click',
          name: '养护知识',
          key: 'CARE_TIPS'
        },
        {
          type: 'click',
          name: '关于我们',
          key: 'ABOUT'
        }
      ]
    };
    
    // 调用微信API创建菜单
    const createUrl = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${accessToken}`;
    const createResponse = await axios.post(createUrl, menu);
    
    console.log('微信API响应:', createResponse.data);
    
    if (createResponse.data.errcode === 0) {
      res.json({
        success: true,
        message: '✅ 菜单创建成功！请在微信中查看（可能需要取消关注再重新关注才能看到新菜单）',
        menu: menu
      });
    } else {
      res.json({
        success: false,
        message: '菜单创建失败',
        error: createResponse.data
      });
    }
    
  } catch (error) {
    console.error('创建菜单出错:', error);
    res.status(500).json({
      success: false,
      message: '创建菜单失败',
      error: error.message
    });
  }
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
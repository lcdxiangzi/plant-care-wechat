const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const xml2js = require('xml2js');
const WECHAT_CONFIG = require('../config/wechat');

const router = express.Router();

// 微信服务器验证
router.get('/verify', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  
  // 验证签名
  const token = WECHAT_CONFIG.token;
  const tmpArr = [token, timestamp, nonce].sort();
  const tmpStr = tmpArr.join('');
  const tmpSha = crypto.createHash('sha1').update(tmpStr).digest('hex');
  
  if (tmpSha === signature) {
    res.send(echostr);
  } else {
    res.send('验证失败');
  }
});

// 处理微信消息
router.post('/verify', (req, res) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    xml2js.parseString(body, (err, result) => {
      if (err) {
        console.error('XML解析错误:', err);
        return res.send('success');
      }
      
      const message = result.xml;
      const msgType = message.MsgType[0];
      const fromUser = message.FromUserName[0];
      const toUser = message.ToUserName[0];
      
      let responseXml = '';
      
      switch (msgType) {
        case 'text':
          const content = message.Content[0];
          responseXml = createTextResponse(fromUser, toUser, `您好！欢迎使用植物养护助手！\n\n请点击菜单进入应用，开始您的植物养护之旅！🌱`);
          break;
          
        case 'event':
          const event = message.Event[0];
          if (event === 'subscribe') {
            responseXml = createTextResponse(fromUser, toUser, 
              `🌱 欢迎关注植物养护助手！\n\n` +
              `这里可以帮您：\n` +
              `🔍 AI识别植物种类\n` +
              `📝 记录养护过程\n` +
              `💡 获取专业建议\n` +
              `👥 与花友交流经验\n\n` +
              `点击菜单开始使用吧！`
            );
          }
          break;
          
        default:
          responseXml = createTextResponse(fromUser, toUser, '感谢您的消息！请点击菜单使用植物养护功能。');
      }
      
      res.set('Content-Type', 'text/xml');
      res.send(responseXml);
    });
  });
});

// 获取访问令牌
router.get('/access-token', async (req, res) => {
  try {
    const response = await axios.get(WECHAT_CONFIG.urls.accessToken, {
      params: {
        grant_type: 'client_credential',
        appid: WECHAT_CONFIG.appId,
        secret: WECHAT_CONFIG.appSecret
      }
    });
    
    res.json({
      code: 200,
      data: response.data
    });
  } catch (error) {
    console.error('获取访问令牌失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取访问令牌失败'
    });
  }
});

// 网页授权登录
router.get('/oauth/authorize', (req, res) => {
  const redirectUri = encodeURIComponent(WECHAT_CONFIG.redirectUri);
  const state = req.query.state || 'login';
  
  const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WECHAT_CONFIG.appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;
  
  res.redirect(authUrl);
});

// 网页授权回调
router.get('/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({
      code: 400,
      message: '授权失败，缺少code参数'
    });
  }
  
  try {
    // 获取access_token
    const tokenResponse = await axios.get(WECHAT_CONFIG.urls.oauth2AccessToken, {
      params: {
        appid: WECHAT_CONFIG.appId,
        secret: WECHAT_CONFIG.appSecret,
        code: code,
        grant_type: 'authorization_code'
      }
    });
    
    const { access_token, openid } = tokenResponse.data;
    
    if (!access_token || !openid) {
      throw new Error('获取用户信息失败');
    }
    
    // 获取用户信息
    const userResponse = await axios.get(WECHAT_CONFIG.urls.oauth2UserInfo, {
      params: {
        access_token: access_token,
        openid: openid,
        lang: 'zh_CN'
      }
    });
    
    const userInfo = userResponse.data;
    
    // 重定向到前端页面，携带用户信息
    const redirectUrl = `${process.env.CLIENT_URL || '/'}?openid=${openid}&nickname=${encodeURIComponent(userInfo.nickname)}&avatar=${encodeURIComponent(userInfo.headimgurl)}`;
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('微信授权回调错误:', error);
    res.status(500).json({
      code: 500,
      message: '授权处理失败'
    });
  }
});

// 创建自定义菜单
router.post('/menu/create', async (req, res) => {
  try {
    // 首先获取access_token
    const tokenResponse = await axios.get(WECHAT_CONFIG.urls.accessToken, {
      params: {
        grant_type: 'client_credential',
        appid: WECHAT_CONFIG.appId,
        secret: WECHAT_CONFIG.appSecret
      }
    });
    
    const accessToken = tokenResponse.data.access_token;
    
    // 菜单配置
    const menuData = {
      button: [
        {
          name: "植物管理",
          sub_button: [
            {
              type: "view",
              name: "我的植物",
              url: `${process.env.CLIENT_URL || 'https://your-domain.vercel.app'}/plants`
            },
            {
              type: "view", 
              name: "添加植物",
              url: `${process.env.CLIENT_URL || 'https://your-domain.vercel.app'}/plant/add`
            },
            {
              type: "view",
              name: "AI识别",
              url: `${process.env.CLIENT_URL || 'https://your-domain.vercel.app'}/ai/identify`
            }
          ]
        },
        {
          name: "养护助手",
          sub_button: [
            {
              type: "view",
              name: "养护记录", 
              url: `${process.env.CLIENT_URL || 'https://your-domain.vercel.app'}/care`
            },
            {
              type: "view",
              name: "AI咨询",
              url: `${process.env.CLIENT_URL || 'https://your-domain.vercel.app'}/ai/consult`
            }
          ]
        },
        {
          name: "社区",
          sub_button: [
            {
              type: "view",
              name: "植友圈",
              url: `${process.env.CLIENT_URL || 'https://your-domain.vercel.app'}/community`
            },
            {
              type: "view",
              name: "我的主页",
              url: `${process.env.CLIENT_URL || 'https://your-domain.vercel.app'}/profile`
            }
          ]
        }
      ]
    };
    
    // 创建菜单
    const menuResponse = await axios.post(
      `${WECHAT_CONFIG.urls.menu}?access_token=${accessToken}`,
      menuData
    );
    
    res.json({
      code: 200,
      message: '菜单创建成功',
      data: menuResponse.data
    });
    
  } catch (error) {
    console.error('创建菜单失败:', error);
    res.status(500).json({
      code: 500,
      message: '创建菜单失败',
      error: error.response?.data || error.message
    });
  }
});

// 辅助函数：创建文本回复
function createTextResponse(toUser, fromUser, content) {
  const timestamp = Math.floor(Date.now() / 1000);
  return `<xml>
    <ToUserName><![CDATA[${toUser}]]></ToUserName>
    <FromUserName><![CDATA[${fromUser}]]></FromUserName>
    <CreateTime>${timestamp}</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[${content}]]></Content>
  </xml>`;
}

module.exports = router;
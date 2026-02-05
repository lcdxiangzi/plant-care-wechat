// 微信配置
const WECHAT_CONFIG = {
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  token: process.env.WECHAT_TOKEN || 'plant_care_token_2024', // 自定义token
  encodingAESKey: '', // 如果需要加密可以设置
  
  // API URLs
  urls: {
    accessToken: 'https://api.weixin.qq.com/cgi-bin/token',
    userInfo: 'https://api.weixin.qq.com/cgi-bin/user/info',
    oauth2AccessToken: 'https://api.weixin.qq.com/sns/oauth2/access_token',
    oauth2UserInfo: 'https://api.weixin.qq.com/sns/userinfo',
    jsapiTicket: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket',
    menu: 'https://api.weixin.qq.com/cgi-bin/menu/create'
  },
  
  // 网页授权域名（部署后需要在微信后台配置）
  redirectUri: process.env.WECHAT_REDIRECT_URI || process.env.CLIENT_URL + '/auth/callback'
};

module.exports = WECHAT_CONFIG;
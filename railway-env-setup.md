# 🚀 Railway环境变量配置

## 📋 需要在Railway项目设置中添加的环境变量：

```
NODE_ENV=production
WECHAT_APP_ID=wx1dd6d394f46a502d
WECHAT_APP_SECRET=e6a7c4d5522ae004d0f94cee916c2e90
WECHAT_TOKEN=plant_care_token_2024
JWT_SECRET=plant_care_jwt_2024_lcdxiangzi_secure_key
BAIDU_API_KEY=pPRB23J8C6cIpuFE3ba6ef31
BAIDU_SECRET_KEY=ghUZQS1slZmQbebMArsJo5PV6uVz6GuT
USE_MEMORY_DB=true
```

## 🔧 配置步骤：

1. Railway部署完成后，进入项目页面
2. 点击"Variables"标签
3. 逐个添加上述环境变量
4. 点击"Deploy"重新部署

## 🔍 验证部署：

部署完成后，Railway会提供一个域名，如：
`https://plant-care-wechat-production.up.railway.app`

访问以下URL验证：
- 主页：`https://你的域名/`
- API状态：`https://你的域名/api/status`
- 测试页：`https://你的域名/test.html`
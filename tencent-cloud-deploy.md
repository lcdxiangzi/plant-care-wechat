# 🚀 腾讯云Web应用托管部署指南

## 🎯 为什么选择腾讯云？
- ✅ 国内访问稳定
- ✅ 与微信生态集成好
- ✅ 免费额度充足
- ✅ 支持GitHub导入

## 📋 部署步骤

### 第1步：访问腾讯云控制台
https://console.cloud.tencent.com/webify

### 第2步：创建应用
1. 点击"新建应用"
2. 应用名称：`plant-care-wechat`
3. 选择"导入已有项目"

### 第3步：配置代码来源
1. 代码来源：选择"GitHub"
2. 仓库地址：`https://github.com/lcdxiangzi/plant-care-wechat`
3. 分支：`main`

### 第4步：环境配置
1. 运行环境：`Node.js 16`
2. 构建命令：`npm install`
3. 启动命令：`npm start`

### 第5步：环境变量配置
添加以下环境变量：

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

### 第6步：部署
1. 点击"立即部署"
2. 等待3-5分钟部署完成
3. 获取访问域名

## 🔍 部署后验证
- 主页：`https://你的域名/`
- 健康检查：`https://你的域名/api/health`

## 💡 优势
- 国内访问速度快
- 微信公众号配置无障碍
- 稳定可靠
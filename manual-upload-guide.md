# 📤 手动上传到Gitee指南

如果Git命令上传失败，可以使用网页手动上传：

## 🌐 网页上传步骤

### 1. 访问你的Gitee仓库
https://gitee.com/lcdxiangzi/plant-care-wechat

### 2. 上传文件
1. 点击"上传文件"按钮
2. 选择"上传文件夹"或逐个上传文件
3. 拖拽以下文件/文件夹到上传区域：

#### 📁 必须上传的文件夹：
- `server/` - 后端代码
- `client/` - 前端代码  
- `tests/` - 测试文件

#### 📄 必须上传的根文件：
- `package.json` ⭐ (最重要)
- `Procfile` ⭐ (部署配置)
- `railway.json` ⭐ (Railway配置)
- `vercel.json` (Vercel配置)
- `.gitignore`
- `.env.example`
- `jest.config.js`
- `README.md`

#### 📋 可选上传的文档文件：
- `deployment-ready-check.md`
- `CHINA_DEPLOY.md`
- `QUICK_DEPLOY.md`
- 其他.md文档

### 3. 提交更改
- 填写提交信息：`植物养护微信H5应用 - 完全可部署版本`
- 点击"提交"

## 🚀 上传完成后立即部署

### 方案A：Vercel部署
1. 访问 https://vercel.com
2. 登录后点击"New Project"
3. 选择"Import Git Repository"
4. 输入：`https://gitee.com/lcdxiangzi/plant-care-wechat`
5. 点击"Import"

### 方案B：腾讯云部署
1. 访问 https://console.cloud.tencent.com/webify
2. 创建新应用
3. 选择"从代码仓库导入"
4. 输入Gitee仓库地址

## 🔧 环境变量配置

无论选择哪个平台，都需要配置以下环境变量：

```
NODE_ENV=production
WECHAT_APP_ID=wx1dd6d394f46a502d
WECHAT_APP_SECRET=你的微信AppSecret
WECHAT_TOKEN=plant_care_token_2024
JWT_SECRET=plant_care_jwt_2024_secure_key
BAIDU_API_KEY=你的百度API密钥
BAIDU_SECRET_KEY=你的百度Secret密钥
USE_MEMORY_DB=true
```

## ⏱️ 预计时间

- 手动上传：5-10分钟
- 部署配置：3-5分钟
- 总计：15分钟内完成

**上传完成后立即告诉我，我指导你部署！** 🚀
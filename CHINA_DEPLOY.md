# 🚀 大陆网络友好部署方案

## 方案A：Vercel + Gitee（推荐）

### 第1步：上传到Gitee（2分钟）
1. **访问Gitee**：https://gitee.com
2. **创建仓库**：
   - 仓库名：`plant-care-wechat`
   - 设为公开
   - 不初始化README
3. **上传文件**：
   - 网页直接上传所有文件
   - 或使用Git：`git remote add origin https://gitee.com/你的用户名/plant-care-wechat.git`

### 第2步：Vercel部署（3分钟）
1. **访问Vercel**：https://vercel.com
2. **导入项目**：
   - 选择"Import Git Repository"
   - 输入Gitee仓库URL
   - 或直接上传文件夹
3. **自动部署**：Vercel会自动检测Node.js项目

## 方案B：腾讯云开发（国内最稳定）

### 第1步：腾讯云Web应用托管
1. **访问**：https://console.cloud.tencent.com/webify
2. **创建应用**：
   - 选择"代码上传"
   - 上传项目ZIP包
   - 选择Node.js环境

### 第2步：配置环境变量
```
NODE_ENV=production
WECHAT_APP_ID=wx1dd6d394f46a502d
WECHAT_APP_SECRET=你的微信AppSecret
WECHAT_TOKEN=plant_care_token_2024
JWT_SECRET=plant_care_jwt_2024_secure
BAIDU_API_KEY=你的百度API密钥
BAIDU_SECRET_KEY=你的百度Secret密钥
USE_MEMORY_DB=true
```

## 方案C：直接ZIP上传到Vercel

### 最简单方式（5分钟完成）
1. **打包项目**：
   - 选择所有文件
   - 压缩为ZIP格式
2. **Vercel上传**：
   - 访问 https://vercel.com
   - 拖拽ZIP文件到页面
   - 自动部署

## 🎯 推荐方案C（最快）

**立即可做：**
1. 把当前文件夹所有文件打包成ZIP
2. 访问 vercel.com
3. 直接拖拽ZIP上传
4. 等待自动部署（2-3分钟）
5. 配置环境变量

**你选择哪个方案？我立即指导具体操作！**
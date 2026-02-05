# 🚀 快速部署指南

## 第1步：GitHub上传（2分钟）

### 方式A：自动脚本（推荐）
1. **创建GitHub仓库**：
   - 访问 https://github.com/new
   - 仓库名：`plant-care-wechat`
   - 设为Public（代码已安全）
   - 不要初始化README

2. **运行上传脚本**：
   - 双击运行 `deploy-to-github.bat`
   - 按提示输入仓库URL
   - 脚本会自动上传所有文件

### 方式B：手动上传
- 直接在GitHub网页上传所有文件

## 第2步：Railway部署（3分钟）

1. **连接GitHub**：
   - 访问 https://railway.app
   - 用GitHub账号登录
   - 点击"New Project"
   - 选择"Deploy from GitHub repo"
   - 选择你的`plant-care-wechat`仓库

2. **等待自动部署**：
   - Railway会自动检测Node.js项目
   - 自动运行`npm install`和`npm start`
   - 等待部署完成（约2-3分钟）

## 第3步：配置环境变量（2分钟）

在Railway项目设置中添加：

```
NODE_ENV=production
WECHAT_APP_ID=你的微信AppID
WECHAT_APP_SECRET=你的微信AppSecret
WECHAT_TOKEN=plant_care_token_2024
JWT_SECRET=plant_care_jwt_2024_secure_key
BAIDU_API_KEY=你的百度API密钥
BAIDU_SECRET_KEY=你的百度Secret密钥
USE_MEMORY_DB=true
```

## 第4步：获取部署URL（1分钟）

- Railway会提供一个URL，如：`https://plant-care-wechat-production.up.railway.app`
- 访问这个URL验证部署成功
- 检查健康状态：`你的URL/api/health`

## 第5步：配置微信公众号（3分钟）

在微信公众平台后台：

1. **服务器配置**：
   - URL: `https://你的Railway域名/api/wechat/verify`
   - Token: `plant_care_token_2024`
   - 点击"提交"验证

2. **网页授权域名**：
   - 添加：`你的Railway域名`（不要https://）

3. **JS接口安全域名**：
   - 添加：`你的Railway域名`（不要https://）

## 🎯 总用时：约10分钟

完成后你就有一个完整运行的植物养护微信H5应用了！

---

**需要我提供的信息：**
- 你的GitHub用户名（用于仓库地址）
- 确认你有微信公众号的管理权限
- 确认你有百度智能云的API密钥
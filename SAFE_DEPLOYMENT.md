# 🔒 安全部署指南

## ⚠️ 重要安全提醒

**我之前犯了一个严重错误**，在代码中硬编码了你的敏感信息。现在已经全部修复，代码可以安全上传到GitHub。

## ✅ 安全问题已修复

- ✅ 所有敏感信息已从代码中移除
- ✅ 使用环境变量替代硬编码
- ✅ `.gitignore` 已更新，确保敏感文件不会被提交
- ✅ 代码现在可以安全地公开

## 🚀 安全部署步骤

### 第1步：重新生成密钥（强烈推荐）

为了确保安全，请重新生成所有密钥：

**微信公众平台**：
1. 登录微信公众平台
2. 开发 → 基本配置
3. 点击"重置"AppSecret
4. 记录新的AppSecret

**百度智能云**：
1. 登录百度智能云控制台
2. 找到你的应用
3. 重新生成API Key和Secret Key
4. 记录新的密钥

### 第2步：上传到GitHub

现在代码是安全的，可以上传：

1. **创建GitHub仓库**：
   - 访问 https://github.com
   - 创建新仓库 `plant-care-wechat`
   - 设为Public（代码中没有敏感信息）

2. **上传文件**：
   - 上传当前文件夹的所有文件
   - 提交信息：`植物养护微信H5应用 - 安全版本`

### 第3步：Railway部署

1. **连接仓库**：
   - 访问 https://railway.app
   - 用GitHub登录
   - 选择你的仓库部署

2. **设置环境变量**：
   在Railway项目设置中添加：

```
NODE_ENV=production
WECHAT_APP_ID=你的微信AppID
WECHAT_APP_SECRET=你重新生成的AppSecret
WECHAT_TOKEN=plant_care_token_2024
JWT_SECRET=随机生成的安全密钥
BAIDU_API_KEY=你重新生成的API密钥
BAIDU_SECRET_KEY=你重新生成的Secret密钥
USE_MEMORY_DB=true
```

**重要**：这些敏感信息只在Railway平台设置，永远不要提交到代码库！

### 第4步：微信公众号配置

部署完成后，使用Railway提供的域名配置微信：

1. **服务器配置**：
   - URL: `https://你的域名.railway.app/api/wechat/verify`
   - Token: `plant_care_token_2024`

2. **网页授权域名**：
   - 添加: `你的域名.railway.app`

3. **JS接口安全域名**：
   - 添加: `你的域名.railway.app`

## 🛡️ 安全保障

### 现在的安全措施：
- ✅ 代码库中没有任何敏感信息
- ✅ 所有配置通过环境变量传递
- ✅ 敏感文件已加入 `.gitignore`
- ✅ 可以安全地公开GitHub仓库

### 部署后的安全：
- ✅ 敏感信息只存在于Railway平台
- ✅ Railway的环境变量是加密存储的
- ✅ 可以随时更换密钥而不需要修改代码

## 📋 你需要准备的信息

在部署时，你需要提供：

1. **微信AppSecret**（重新生成的）
2. **百度API密钥**（重新生成的）
3. **JWT密钥**（随机生成，如：`plant_care_jwt_2024_your_random_string`）

## 🎯 部署后验证

部署成功后，访问：
- 健康检查: `https://你的域名.railway.app/api/health`
- 主页: `https://你的域名.railway.app/`

## 🙏 再次道歉

非常抱歉之前的安全疏忽。现在系统已经按照最佳安全实践重新配置：

- ✅ 没有硬编码的敏感信息
- ✅ 遵循环境变量最佳实践
- ✅ 代码可以安全地开源

**现在可以安全地部署了！** 🚀

---

## 🔍 如何验证安全性

你可以检查以下文件确认没有敏感信息：
- `server/config/wechat.js` - 使用 `process.env.WECHAT_APP_SECRET`
- `.env.production` - 只有占位符，没有真实密钥
- `.gitignore` - 包含所有敏感文件

**感谢你及时指出这个重要问题！** 🙏
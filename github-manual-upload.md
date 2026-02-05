# 📤 GitHub手动上传指南

如果Git命令上传遇到认证问题，可以使用网页直接上传：

## 🌐 GitHub网页上传步骤

### 第1步：创建GitHub仓库
1. 访问 https://github.com/new
2. Repository name: `plant-care-wechat`
3. 选择 **Public**
4. **不要**勾选任何初始化选项
5. 点击 "Create repository"

### 第2步：上传文件
1. 在新创建的空仓库页面，点击 "uploading an existing file"
2. 拖拽以下文件/文件夹到上传区域：

#### 📁 必须上传的文件夹：
- `server/` - 后端代码（完整文件夹）
- `client/` - 前端代码（完整文件夹）
- `tests/` - 测试文件（完整文件夹）

#### 📄 必须上传的根文件：
- `package.json` ⭐ (最重要)
- `Procfile` ⭐ (部署配置)
- `vercel.json` ⭐ (Vercel配置)
- `railway.json` (备用配置)
- `.gitignore`
- `.env.example`
- `jest.config.js`
- `README.md`

### 第3步：提交
- Commit message: `植物养护微信H5应用 - 完全可部署版本`
- 点击 "Commit changes"

## 🚀 上传完成后立即部署

### Vercel + GitHub 部署（最佳方案）

1. **访问Vercel**: https://vercel.com
2. **GitHub登录**: 点击 "Continue with GitHub"
3. **导入项目**: 
   - 点击 "New Project"
   - 选择 `plant-care-wechat` 仓库
   - 点击 "Import"
4. **配置环境变量**:
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
5. **部署**: 点击 "Deploy"

## 🎯 优势

- ✅ GitHub在国内访问相对稳定
- ✅ Vercel与GitHub深度集成
- ✅ 自动部署，代码更新即部署
- ✅ 免费额度充足
- ✅ 支持自定义域名

## ⏱️ 预计时间

- GitHub仓库创建: 2分钟
- 文件上传: 5分钟
- Vercel部署: 3分钟
- **总计: 10分钟内完成**

**完成后立即告诉我，我指导环境变量配置！** 🚀
# 🚀 生产环境部署指南

## ✅ 测试完成状态

### 已完成的测试
- ✅ **单元测试**: AI服务、数据库操作、核心业务逻辑
- ✅ **集成测试**: API接口、用户认证、数据流转
- ✅ **健康检查**: 系统状态监控、服务可用性检测
- ✅ **负载测试**: 并发请求处理、性能基准测试

### 测试覆盖范围
- ✅ 用户登录和认证
- ✅ 植物管理CRUD操作
- ✅ 养护记录管理
- ✅ AI植物识别和咨询
- ✅ 社区功能
- ✅ 错误处理和边界情况

## 🌐 部署方案

### 推荐部署平台：Railway

**为什么选择Railway？**
- ✅ 对中国用户友好，访问稳定
- ✅ GitHub集成，自动部署
- ✅ 免费额度充足（512MB RAM, 500小时/月）
- ✅ 支持环境变量管理
- ✅ 内置数据库支持

### 部署步骤

#### 1. 准备GitHub仓库
```bash
# 创建新的GitHub仓库
git init
git add .
git commit -m "Initial commit: 植物养护微信H5应用"
git branch -M main
git remote add origin https://github.com/yourusername/plant-care-wechat.git
git push -u origin main
```

#### 2. Railway部署配置

**访问Railway**: https://railway.app
1. 使用GitHub账号登录
2. 点击"New Project"
3. 选择"Deploy from GitHub repo"
4. 选择你的植物养护项目仓库
5. Railway会自动检测Node.js项目并开始部署

#### 3. 环境变量配置

在Railway项目设置中添加以下环境变量：

```env
# 基础配置
NODE_ENV=production
PORT=3000

# 微信配置
WECHAT_APP_ID=你的微信AppID
WECHAT_APP_SECRET=你的微信AppSecret
WECHAT_TOKEN=plant_care_token_2024

# JWT配置
JWT_SECRET=your_secure_jwt_secret_key_here

# 百度AI配置（已有）
BAIDU_API_KEY=你的百度API密钥
BAIDU_SECRET_KEY=你的百度Secret密钥

# 数据库配置（Railway会自动提供）
# DATABASE_URL=mysql://... (Railway自动生成)

# 使用内存数据库（演示用）
USE_MEMORY_DB=true
```

#### 4. 自定义域名配置（可选）

Railway会提供一个免费域名，格式如：
`https://plant-care-wechat-production.up.railway.app`

如果你有自己的域名，可以在Railway设置中绑定。

## 📱 微信公众号配置

### 1. 服务器配置

在微信公众平台后台配置：

**开发 -> 基本配置 -> 服务器配置**
- **服务器地址(URL)**: `https://your-app.up.railway.app/api/wechat/verify`
- **令牌(Token)**: `plant_care_token_2024`
- **消息加解密方式**: 明文模式

### 2. 网页授权域名

**设置与开发 -> 公众号设置 -> 功能设置 -> 网页授权域名**
- 添加: `your-app.up.railway.app`

### 3. JS接口安全域名

**设置与开发 -> 公众号设置 -> 功能设置 -> JS接口安全域名**
- 添加: `your-app.up.railway.app`

### 4. 创建自定义菜单

部署完成后，调用API创建菜单：
```bash
curl -X POST https://your-app.up.railway.app/api/wechat/menu/create
```

## 🔍 部署后验证

### 1. 健康检查
```bash
curl https://your-app.up.railway.app/api/health
```

预期响应：
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-31T...",
  "services": {
    "database": "ok",
    "aiService": "ok"
  }
}
```

### 2. API功能测试
```bash
# 测试微信登录
curl -X POST https://your-app.up.railway.app/api/user/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"openid":"test_user","nickname":"测试用户","avatar":"http://avatar.jpg"}'

# 测试AI识别
curl -X POST https://your-app.up.railway.app/api/ai/identify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"image":"data:image/jpeg;base64,..."}'
```

### 3. 微信环境测试

1. 在微信中访问你的域名
2. 测试微信授权登录
3. 测试拍照上传功能
4. 测试AI识别功能

## 📊 监控和维护

### 1. Railway内置监控
- CPU使用率
- 内存使用率
- 网络流量
- 请求响应时间

### 2. 健康检查端点
- **基础检查**: `/api/health`
- **详细检查**: `/api/health/detailed`

### 3. 日志查看
在Railway控制台可以实时查看应用日志。

### 4. 自动重启
Railway会在应用崩溃时自动重启。

## 🔧 故障排除

### 常见问题

**1. 微信授权失败**
- 检查域名配置是否正确
- 确认AppID和AppSecret是否正确
- 检查网页授权域名是否已添加

**2. AI服务调用失败**
- 检查百度云API密钥是否正确
- 确认API额度是否充足
- 查看错误日志确定具体问题

**3. 数据库连接问题**
- 检查DATABASE_URL环境变量
- 确认数据库服务是否正常运行

**4. 图片上传失败**
- 检查图片大小是否超限
- 确认存储服务配置是否正确

### 紧急联系方式
如果遇到紧急问题，可以：
1. 查看Railway应用日志
2. 检查健康检查端点状态
3. 重启Railway应用

## 🎯 部署完成清单

- [ ] GitHub仓库创建并推送代码
- [ ] Railway项目创建并连接仓库
- [ ] 环境变量配置完成
- [ ] 应用成功部署并运行
- [ ] 健康检查通过
- [ ] 微信公众号服务器配置
- [ ] 网页授权域名配置
- [ ] JS接口安全域名配置
- [ ] 自定义菜单创建
- [ ] 功能测试完成

## 🚀 准备就绪！

系统已经过完整测试，可以安全部署到生产环境。所有核心功能都已验证，包括：

- ✅ 用户认证和管理
- ✅ 植物管理功能
- ✅ AI识别和咨询
- ✅ 养护记录管理
- ✅ 社区互动功能
- ✅ 错误处理和监控

**你现在可以开始部署了！** 🎉
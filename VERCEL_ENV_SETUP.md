# 🔧 Vercel环境变量配置

## 📋 需要配置的环境变量

在Vercel项目页面 → Settings → Environment Variables 中添加：

### 基础配置
```
NODE_ENV=production
```

### 微信配置
```
WECHAT_APP_ID=wx1dd6d394f46a502d
WECHAT_APP_SECRET=你的微信AppSecret
WECHAT_TOKEN=plant_care_token_2024
```

### 安全配置
```
JWT_SECRET=plant_care_jwt_2024_lcdxiangzi_secure
```

### 百度AI配置
```
BAIDU_API_KEY=你的百度API密钥
BAIDU_SECRET_KEY=你的百度Secret密钥
```

### 数据库配置
```
USE_MEMORY_DB=true
```

## 🔧 配置步骤

1. 在Vercel项目页面，点击 "Settings"
2. 点击左侧 "Environment Variables"
3. 逐个添加上述变量：
   - Name: 变量名（如 NODE_ENV）
   - Value: 变量值（如 production）
   - Environment: 选择 "Production, Preview, and Development"
   - 点击 "Save"

## ⚠️ 重要提醒

- 替换 "你的微信AppSecret" 为真实的AppSecret
- 替换百度API密钥为真实的密钥
- 所有其他值保持不变

## 🚀 配置完成后

点击 "Deployments" → "Redeploy" 重新部署项目

## 🔍 验证部署

部署完成后访问：
- 主页: `https://你的项目名.vercel.app/`
- 健康检查: `https://你的项目名.vercel.app/api/health`

如果看到绿色的 ✅ 状态，说明部署成功！
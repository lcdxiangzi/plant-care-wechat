# 🌱 植物养护微信公众号

## 项目简介
基于微信公众号的植物养护助手，帮助用户记录和管理植物养护过程。

## 当前版本
**v0.1.0 - MVP测试版**

## 功能清单

### ✅ 已实现（Sprint 1）
- [x] 微信公众号接入验证
- [x] 基础服务器框架
- [x] 欢迎页面

### 🚧 开发中（Sprint 2）
- [ ] 用户登录（微信授权）
- [ ] 添加植物功能
- [ ] 植物列表展示

### 📋 计划中（Sprint 3）
- [ ] AI植物识别
- [ ] 养护建议
- [ ] 养护记录

## 技术栈
- **后端**: Node.js + Express
- **前端**: HTML + CSS + JavaScript
- **部署**: Railway/Render
- **数据库**: 内存数据库（MVP阶段）

## 部署说明

### 环境变量
```
PORT=3000
WECHAT_TOKEN=plant_care_token_2024
```

### 启动命令
```bash
npm install
npm start
```

### 健康检查
```
GET /health
```

### 微信验证接口
```
GET /wechat
```

## 微信公众号配置

1. **服务器配置**：
   - URL: `https://你的域名/wechat`
   - Token: `plant_care_token_2024`
   - 消息加解密方式: 明文模式

2. **接口权限**：
   - 订阅号（未认证）
   - 支持基础消息接收

## 开发计划

- **Sprint 1**: 基础框架 ✅
- **Sprint 2**: 核心功能（2周）
- **Sprint 3**: AI功能（2周）

## 作者
lcdxiangzi

## 许可证
MIT
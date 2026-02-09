# 版本历史

## v0.1.7 - Sprint 2.6 详细错误诊断 🚧 (2026-02-09)

### 功能
- [x] 增强 access_token 获取的错误日志
- [x] 菜单创建接口返回详细的调试信息
- [x] 显示微信API的完整响应用于诊断

### 调试信息
访问 `/wechat/menu/create` 会返回：
- AppID 和 AppSecret 前8位
- 微信API的完整响应
- 具体的错误提示和解决建议

### 部署信息
- **域名**: web-production-61069.up.railway.app
- **状态**: 🚧 待部署
- **Git Tag**: v0.1.7

---

## v0.1.6 - Sprint 2.5 配置诊断 ✅ (2026-02-09)

### 功能
- [x] 添加配置检查接口 `/wechat/config/check`
- [x] 帮助用户诊断环境变量配置状态
- [x] 显示AppSecret前8位用于验证

### 使用方法
访问 `https://web-production-61069.up.railway.app/wechat/config/check` 检查配置

### 部署信息
- **域名**: web-production-61069.up.railway.app
- **状态**: 🚧 待部署
- **Git Tag**: v0.1.6

---

## v0.1.5 - Sprint 2.4 关键词菜单 ✅ (2026-02-05)

### 功能
- [x] 关键词菜单系统（替代自定义菜单）
- [x] 支持数字快捷键（0-3）
- [x] 文本消息智能匹配
- [x] 完整的功能导航

### 说明
由于订阅号（未认证）没有自定义菜单权限，改用关键词交互：
- 回复 0 或"菜单" - 显示功能菜单
- 回复 1 或"我的植物" - 植物管理
- 回复 2 或"养护知识" - 养护技巧
- 回复 3 或"关于我们" - 项目信息

### 部署信息
- **域名**: web-production-61069.up.railway.app
- **状态**: 🚧 待部署
- **Git Tag**: v0.1.5

---

## v0.1.4 - Sprint 2.3 自定义菜单尝试 ❌ (2026-02-05)

### 功能
- [x] 微信菜单创建API
- [x] access_token获取
- [x] 菜单配置接口

### 问题
订阅号（未认证）没有自定义菜单权限，功能无法使用

### 部署信息
- **域名**: web-production-61069.up.railway.app
- **状态**: ❌ 功能受限
- **Git Tag**: v0.1.4

---

## v0.1.3 - Sprint 2.2 增强消息处理 ✅ (2026-02-05)

### 功能
- [x] 关注事件处理
- [x] CLICK事件处理
- [x] 不同消息类型回复

### 部署信息
- **域名**: web-production-61069.up.railway.app
- **状态**: ✅ 稳定运行
- **Git Tag**: v0.1.3

---

## v0.1.2 - Sprint 2.1 消息自动回复 ✅ (2026-02-05)

### 功能
- [x] XML消息解析
- [x] 自动回复功能
- [x] ToUserName/FromUserName正确处理
- [x] 时间戳格式修正

### 部署信息
- **域名**: web-production-61069.up.railway.app
- **状态**: ✅ 稳定运行
- **Git Tag**: v0.1.2

---

## v0.1.0 - Sprint 1 基础框架 ✅ (2026-02-05)

### 功能
- [x] 微信公众号接入验证
- [x] Express服务器框架
- [x] 健康检查接口
- [x] 欢迎页面
- [x] Railway部署成功

### 部署信息
- **域名**: web-production-61069.up.railway.app
- **状态**: ✅ 稳定运行
- **Git Tag**: v0.1.0

### 回退方法
```bash
git checkout v0.1.0
```

---

## 回退策略

### 如果当前版本出现问题：
1. 回退到v0.1.3（最后一个稳定版本）：`git checkout v0.1.3`
2. 在Railway重新部署
3. 或在Railway界面直接回滚到之前的部署

### 测试策略
- 每个新功能先在本地测试
- 确认无误后再部署到Railway
- Railway支持回滚到之前的部署版本
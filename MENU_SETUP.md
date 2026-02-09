# 微信自定义菜单配置指南

## 当前状态
- 代码已实现自动创建菜单功能
- 需要在 Railway 配置环境变量

## 步骤 1: 检查配置状态

访问以下地址检查环境变量是否正确配置：
```
https://web-production-61069.up.railway.app/wechat/config/check
```

应该看到：
```json
{
  "config": {
    "WECHAT_TOKEN": "✅ 已配置",
    "WECHAT_APPID": "✅ 已配置 (wx1dd6d394f46a502d)",
    "WECHAT_APPSECRET": "✅ 已配置 (e6a7c4d5...)"
  }
}
```

## 步骤 2: 配置 Railway 环境变量

如果 WECHAT_APPSECRET 显示 "❌ 未配置"：

1. 登录 Railway: https://railway.app
2. 进入项目: plant-care-wechat
3. 点击 "Variables" 标签
4. 添加或更新以下变量：
   - `WECHAT_TOKEN` = `plant_care_token_2024`
   - `WECHAT_APPID` = `wx1dd6d394f46a502d`
   - `WECHAT_APPSECRET` = `e6a7c4d5522ae004d0f94cee916c2e90`
5. 保存后 Railway 会自动重新部署

## 步骤 3: 创建菜单

配置完成后，访问：
```
https://web-production-61069.up.railway.app/wechat/menu/create
```

成功响应示例：
```json
{
  "success": true,
  "message": "✅ 菜单创建成功！请在微信中查看（可能需要取消关注再重新关注才能看到新菜单）"
}
```

## 步骤 4: 验证菜单

1. 在微信中取消关注公众号
2. 重新关注公众号
3. 查看底部是否出现自定义菜单

## 可能的问题

### 问题 1: 订阅号权限限制
**症状**: 微信API返回 `errcode: 65301` 或类似权限错误

**原因**: 未认证的订阅号没有自定义菜单权限

**解决方案**: 
- 方案A: 使用关键词菜单（当前已实现，回复 0 查看菜单）
- 方案B: 进行微信公众号认证（需要企业资质）
- 方案C: 升级为服务号（需要企业资质）

### 问题 2: access_token 获取失败
**症状**: 返回 "获取access_token失败"

**原因**: AppID 或 AppSecret 配置错误

**解决方案**: 
1. 登录微信公众平台
2. 开发 > 基本配置
3. 确认 AppID 和 AppSecret 是否正确
4. 更新 Railway 环境变量

### 问题 3: 菜单创建成功但看不到
**症状**: API返回成功，但微信中看不到菜单

**解决方案**:
1. 取消关注公众号
2. 重新关注公众号
3. 等待几分钟（微信服务器同步需要时间）

## 当前菜单配置

```json
{
  "button": [
    {
      "type": "view",
      "name": "我的植物",
      "url": "https://web-production-61069.up.railway.app/"
    },
    {
      "type": "click",
      "name": "养护知识",
      "key": "CARE_TIPS"
    },
    {
      "type": "click",
      "name": "关于我们",
      "key": "ABOUT"
    }
  ]
}
```

## 备用方案：关键词菜单

如果自定义菜单无法使用，系统已实现关键词交互：

- 回复 `0` 或 `菜单` - 显示功能菜单
- 回复 `1` 或 `我的植物` - 植物管理功能
- 回复 `2` 或 `养护知识` - 养护技巧
- 回复 `3` 或 `关于我们` - 项目信息

## 技术支持

如有问题，请查看：
- Railway 部署日志
- `/wechat/config/check` 配置检查
- `/health` 健康检查

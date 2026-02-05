# API接口设计方案

## 1. 用户管理接口

### 1.1 用户登录/注册
```
POST /api/user/login
参数：
- code: 微信登录code
- userInfo: 微信用户信息

返回：
- token: 用户token
- userInfo: 用户基本信息
```

### 1.2 获取用户信息
```
GET /api/user/profile
Headers: Authorization: Bearer {token}

返回：
- userInfo: 用户详细信息
- plantCount: 植物数量
- careCount: 养护次数
```

## 2. 植物管理接口

### 2.1 添加植物
```
POST /api/plant/add
Headers: Authorization: Bearer {token}
参数：
- plantName: 植物名称
- image: 植物照片
- location: 位置
- getMethod: 获得方式
- getDate: 获得日期
- description: 描述

返回：
- plantId: 植物ID
- aiIdentifyResult: AI识别结果
```

### 2.2 获取用户植物列表
```
GET /api/plant/list
Headers: Authorization: Bearer {token}
参数：
- page: 页码
- size: 每页数量
- status: 状态筛选

返回：
- plants: 植物列表
- total: 总数
```

### 2.3 获取植物详情
```
GET /api/plant/{plantId}
Headers: Authorization: Bearer {token}

返回：
- plantInfo: 植物详细信息
- careRecords: 最近养护记录
- aiSuggestions: AI养护建议
```

### 2.4 更新植物信息
```
PUT /api/plant/{plantId}
Headers: Authorization: Bearer {token}
参数：
- plantName: 植物名称
- location: 位置
- description: 描述
- status: 状态

返回：
- success: 是否成功
```

## 3. 养护记录接口

### 3.1 添加养护记录
```
POST /api/care/add
Headers: Authorization: Bearer {token}
参数：
- plantId: 植物ID
- careType: 养护类型
- careNote: 养护备注
- images: 照片列表
- weather: 天气

返回：
- recordId: 记录ID
- nextCareDate: 下次养护建议日期
```

### 3.2 获取养护记录
```
GET /api/care/list
Headers: Authorization: Bearer {token}
参数：
- plantId: 植物ID（可选）
- page: 页码
- size: 每页数量

返回：
- records: 养护记录列表
- total: 总数
```

## 4. AI服务接口

### 4.1 植物识别
```
POST /api/ai/identify
Headers: Authorization: Bearer {token}
参数：
- image: 植物照片

返回：
- plantType: 植物类型
- species: 具体品种
- confidence: 识别置信度
- careGuide: 基础养护指南
```

### 4.2 AI咨询
```
POST /api/ai/consult
Headers: Authorization: Bearer {token}
参数：
- plantId: 植物ID（可选）
- questionType: 问题类型
- questionText: 问题文本
- questionImages: 问题图片

返回：
- consultationId: 咨询ID
- response: AI回复
- suggestions: 相关建议
```

### 4.3 获取咨询历史
```
GET /api/ai/consultation/history
Headers: Authorization: Bearer {token}
参数：
- page: 页码
- size: 每页数量

返回：
- consultations: 咨询记录列表
- total: 总数
```

## 5. 社区接口

### 5.1 发布动态
```
POST /api/community/post
Headers: Authorization: Bearer {token}
参数：
- plantId: 相关植物ID（可选）
- content: 动态内容
- images: 图片列表
- location: 位置
- topicTags: 话题标签

返回：
- postId: 动态ID
```

### 5.2 获取动态列表
```
GET /api/community/posts
参数：
- page: 页码
- size: 每页数量
- type: 类型（latest/hot/nearby）
- plantType: 植物类型筛选

返回：
- posts: 动态列表
- total: 总数
```

### 5.3 动态互动
```
POST /api/community/interact
Headers: Authorization: Bearer {token}
参数：
- postId: 动态ID
- interactionType: 互动类型（LIKE/COMMENT）
- content: 评论内容（点赞时为空）
- replyTo: 回复的评论ID（可选）

返回：
- success: 是否成功
```

## 6. 知识库接口

### 6.1 获取植物知识
```
GET /api/knowledge/plant/{plantType}
参数：
- page: 页码
- size: 每页数量

返回：
- knowledgeList: 知识列表
- total: 总数
```

### 6.2 搜索知识
```
GET /api/knowledge/search
参数：
- keyword: 搜索关键词
- page: 页码
- size: 每页数量

返回：
- knowledgeList: 知识列表
- total: 总数
```

## 7. 文件上传接口

### 7.1 图片上传
```
POST /api/upload/image
Headers: Authorization: Bearer {token}
参数：
- file: 图片文件
- type: 图片类型（plant/care/avatar/post）

返回：
- imageUrl: 图片URL
- thumbnailUrl: 缩略图URL
```

## 8. 系统接口

### 8.1 获取系统配置
```
GET /api/system/config
参数：
- keys: 配置项键名列表

返回：
- configs: 配置项键值对
```

### 8.2 用户反馈
```
POST /api/system/feedback
Headers: Authorization: Bearer {token}
参数：
- feedbackType: 反馈类型
- title: 标题
- content: 内容
- images: 截图
- contactInfo: 联系方式

返回：
- feedbackId: 反馈ID
```

## 接口通用规范

### 请求格式
- Content-Type: application/json
- 需要认证的接口需要在Header中携带Authorization: Bearer {token}

### 响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1640995200000
}
```

### 错误码定义
- 200: 成功
- 400: 请求参数错误
- 401: 未授权
- 403: 禁止访问
- 404: 资源不存在
- 500: 服务器内部错误
- 1001: 用户不存在
- 1002: 植物不存在
- 1003: AI服务异常
- 1004: 图片上传失败
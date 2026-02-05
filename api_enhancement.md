# API接口设计补充方案
## 基于TOGAF业务架构分析的接口增强

## 1. 用户偏好管理接口

### 1.1 获取用户偏好
```
GET /api/user/preferences
Headers: Authorization: Bearer {token}

返回：
- preferences: 用户偏好设置
- defaultSettings: 默认设置
```

### 1.2 更新用户偏好
```
PUT /api/user/preferences
Headers: Authorization: Bearer {token}
参数：
- notificationSettings: 通知设置
- privacySettings: 隐私设置
- interfaceSettings: 界面设置
- careSettings: 养护设置

返回：
- success: 是否成功
- updatedPreferences: 更新后的偏好
```

## 2. 植物类型管理接口

### 2.1 获取植物类型列表
```
GET /api/plant-types
参数：
- category: 分类筛选（INDOOR/OUTDOOR/SUCCULENT）
- difficulty: 难度筛选（EASY/MEDIUM/HARD）
- page: 页码
- size: 每页数量
- keyword: 搜索关键词

返回：
- plantTypes: 植物类型列表
- total: 总数
- categories: 可用分类
```

### 2.2 获取植物类型详情
```
GET /api/plant-types/{typeId}

返回：
- plantType: 植物类型详细信息
- careGuide: 养护指南
- commonIssues: 常见问题
- relatedTypes: 相关类型
```

### 2.3 搜索植物类型
```
GET /api/plant-types/search
参数：
- query: 搜索关键词
- searchType: 搜索类型（NAME/SCIENTIFIC/COMMON）
- limit: 结果数量限制

返回：
- results: 搜索结果
- suggestions: 搜索建议
```

## 3. 养护类型管理接口

### 3.1 获取养护类型列表
```
GET /api/care-types
参数：
- category: 分类（BASIC/ADVANCED/EMERGENCY）
- difficulty: 难度筛选
- plantTypeId: 植物类型筛选

返回：
- careTypes: 养护类型列表
- categories: 分类信息
```

### 3.2 获取养护类型详情
```
GET /api/care-types/{careTypeId}

返回：
- careType: 养护类型详细信息
- operationGuide: 操作指南
- requiredTools: 所需工具
- seasonalAdjustment: 季节调整
```

### 3.3 获取植物专属养护类型
```
GET /api/care-types/for-plant/{plantTypeId}
参数：
- season: 季节（SPRING/SUMMER/AUTUMN/WINTER）
- difficulty: 用户技能水平

返回：
- recommendedCareTypes: 推荐养护类型
- frequency: 建议频率
- priority: 优先级排序
```

## 4. AI识别结果管理接口

### 4.1 获取识别结果详情
```
GET /api/ai/identification/{resultId}
Headers: Authorization: Bearer {token}

返回：
- identificationResult: 识别结果详情
- confidenceAnalysis: 置信度分析
- alternativeResults: 备选结果
- careRecommendations: 养护建议
```

### 4.2 用户反馈识别结果
```
POST /api/ai/identification/{resultId}/feedback
Headers: Authorization: Bearer {token}
参数：
- isCorrect: 识别是否正确
- correctPlantTypeId: 正确的植物类型ID（如果识别错误）
- feedback: 用户反馈内容

返回：
- success: 是否成功
- thanksMessage: 感谢信息
```

### 4.3 重新识别
```
POST /api/ai/identification/retry
Headers: Authorization: Bearer {token}
参数：
- originalResultId: 原识别结果ID
- newImage: 新的植物照片
- additionalInfo: 补充信息

返回：
- newResultId: 新识别结果ID
- comparisonAnalysis: 对比分析
```

## 5. 养护计划管理接口

### 5.1 生成养护计划
```
POST /api/care-plans/generate
Headers: Authorization: Bearer {token}
参数：
- plantId: 植物ID
- planDuration: 计划时长（天）
- userSkillLevel: 用户技能水平
- availableTimePerWeek: 每周可用时间（分钟）
- preferences: 用户偏好

返回：
- planId: 计划ID
- planOverview: 计划概览
- weeklySchedule: 周计划
- estimatedResults: 预期效果
```

### 5.2 获取用户养护计划
```
GET /api/care-plans/my-plans
Headers: Authorization: Bearer {token}
参数：
- status: 计划状态筛选
- plantId: 植物筛选
- page: 页码
- size: 每页数量

返回：
- carePlans: 养护计划列表
- total: 总数
- activeCount: 活跃计划数
```

### 5.3 更新计划执行状态
```
PUT /api/care-plans/{planId}/progress
Headers: Authorization: Bearer {token}
参数：
- completedTasks: 已完成任务列表
- notes: 执行备注
- difficulties: 遇到的困难
- adjustmentRequests: 调整请求

返回：
- updatedPlan: 更新后的计划
- completionRate: 完成率
- nextTasks: 下一步任务
- adjustmentSuggestions: 调整建议
```

### 5.4 暂停/恢复计划
```
PUT /api/care-plans/{planId}/status
Headers: Authorization: Bearer {token}
参数：
- action: 操作类型（PAUSE/RESUME/COMPLETE）
- reason: 操作原因

返回：
- success: 是否成功
- newStatus: 新状态
- message: 状态变更信息
```

## 6. AI模型配置接口（管理员）

### 6.1 获取模型配置列表
```
GET /api/admin/ai-models
Headers: Authorization: Bearer {adminToken}

返回：
- models: 模型配置列表
- performanceMetrics: 性能指标
- usageStatistics: 使用统计
```

### 6.2 更新模型配置
```
PUT /api/admin/ai-models/{configId}
Headers: Authorization: Bearer {adminToken}
参数：
- modelParameters: 模型参数
- confidenceThreshold: 置信度阈值
- isActive: 是否启用

返回：
- success: 是否成功
- updatedConfig: 更新后的配置
```

## 7. 增强现有接口

### 7.1 植物添加接口增强
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
- autoGeneratePlan: 是否自动生成养护计划 (新增)
- userSkillLevel: 用户技能水平 (新增)

返回：
- plantId: 植物ID
- aiIdentifyResult: AI识别结果
- suggestedPlantType: 建议的植物类型 (新增)
- generatedPlanId: 生成的计划ID (新增)
```

### 7.2 AI咨询接口增强
```
POST /api/ai/consult
Headers: Authorization: Bearer {token}
参数：
- plantId: 植物ID（可选）
- questionType: 问题类型
- questionText: 问题文本
- questionImages: 问题图片
- contextInfo: 上下文信息 (新增)
- preferredResponseStyle: 偏好的回复风格 (新增)

返回：
- consultationId: 咨询ID
- response: AI回复
- suggestions: 相关建议
- confidenceScore: 回复置信度 (新增)
- relatedKnowledge: 相关知识链接 (新增)
- followUpQuestions: 建议的后续问题 (新增)
```

### 7.3 社区动态接口增强
```
GET /api/community/posts
参数：
- page: 页码
- size: 每页数量
- type: 类型（latest/hot/nearby）
- plantType: 植物类型筛选
- careType: 养护类型筛选 (新增)
- difficulty: 难度筛选 (新增)
- hasImages: 是否包含图片 (新增)

返回：
- posts: 动态列表
- total: 总数
- trendingTopics: 热门话题 (新增)
- recommendedUsers: 推荐用户 (新增)
```

## 8. 新增统计分析接口

### 8.1 用户养护统计
```
GET /api/statistics/care-summary
Headers: Authorization: Bearer {token}
参数：
- period: 统计周期（WEEK/MONTH/YEAR）
- plantId: 植物筛选（可选）

返回：
- totalCareCount: 总养护次数
- careTypeDistribution: 养护类型分布
- consistencyScore: 养护一致性评分
- improvementSuggestions: 改进建议
```

### 8.2 植物健康趋势
```
GET /api/statistics/plant-health/{plantId}
Headers: Authorization: Bearer {token}
参数：
- period: 统计周期

返回：
- healthTrend: 健康趋势
- careEffectiveness: 养护效果
- riskFactors: 风险因素
- recommendations: 建议
```

## 接口版本控制

### API版本策略
- 当前版本：v1
- 新增接口使用：/api/v1/...
- 向后兼容：保持v1接口稳定
- 重大变更：引入v2版本

### 响应格式标准化
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "meta": {
    "version": "v1",
    "timestamp": 1640995200000,
    "requestId": "req_123456"
  }
}
```

## 错误码补充

### 新增错误码
- 2001: 用户偏好不存在
- 2002: 植物类型不存在
- 2003: 养护类型不存在
- 2004: 识别结果不存在
- 2005: 养护计划不存在
- 2006: AI模型配置错误
- 2007: 计划生成失败
- 2008: 识别置信度过低
- 2009: 用户技能水平不匹配
- 2010: 计划执行状态异常
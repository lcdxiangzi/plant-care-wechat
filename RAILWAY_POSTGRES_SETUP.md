# Railway PostgreSQL 数据库配置

## 方案说明
使用 Railway 提供的免费 PostgreSQL 数据库进行数据持久化。

## 优势
- ✅ 完全免费（Railway 免费计划包含）
- ✅ 自动备份
- ✅ 高可用性
- ✅ 支持多实例
- ✅ 数据永久保存

## 配置步骤

### 1. 登录 Railway
访问：https://railway.app

### 2. 进入项目
选择 plant-care-wechat 项目

### 3. 添加 PostgreSQL 数据库
1. 在项目页面，点击右上角 **"+ New"** 按钮
2. 选择 **"Database"**
3. 选择 **"Add PostgreSQL"**
4. Railway 会自动创建数据库并生成连接信息

### 4. 连接数据库到服务
1. 数据库创建后，点击 PostgreSQL 服务
2. 点击 **"Connect"** 标签
3. 复制 **"DATABASE_URL"** 的值
4. 回到你的 web 服务
5. 进入 **"Variables"** 标签
6. Railway 应该已经自动添加了 `DATABASE_URL` 变量
7. 如果没有，手动添加：
   - Variable: `DATABASE_URL`
   - Value: `postgresql://...`（从 PostgreSQL 服务复制）

### 5. 验证配置
1. 保存后 Railway 会自动重新部署
2. 部署完成后访问：`https://你的域名/health`
3. 检查返回的 JSON 中 `storage` 字段
4. 应该显示：`"storage": "PostgreSQL"`

## 数据库结构

系统会自动创建以下表：

```sql
CREATE TABLE users (
  openid VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 数据格式

每个用户的数据以 JSONB 格式存储：

```json
{
  "openid": "用户openid",
  "plants": [
    {
      "id": "1234567890",
      "name": "绿萝",
      "addedAt": "2026-02-09",
      "careRecords": [
        {
          "type": "water",
          "date": "2026-02-09T10:30:00"
        }
      ]
    }
  ],
  "createdAt": "2026-02-09"
}
```

## 代码特性

- ✅ 自动检测 `DATABASE_URL` 环境变量
- ✅ 有数据库时使用 PostgreSQL
- ✅ 无数据库时降级到 JSON 文件
- ✅ 自动初始化数据库表
- ✅ 事务支持，保证数据一致性

## 本地开发

本地开发时不需要配置数据库，会自动使用 JSON 文件存储：
- 数据文件：`data/users.json`
- 本地测试完全正常

## 迁移现有数据

如果之前有 JSON 文件数据，可以手动迁移：

1. 导出 JSON 数据
2. 连接到 PostgreSQL
3. 使用 SQL 插入数据

或者重新添加植物（数据量不大的情况）。

## 故障排查

### 问题 1: 数据库连接失败
- 检查 `DATABASE_URL` 是否正确配置
- 检查 Railway 日志中的错误信息
- 确认 PostgreSQL 服务正在运行

### 问题 2: 表未创建
- 系统会在启动时自动创建表
- 检查日志中是否有 "✅ 数据库表初始化成功"
- 如果失败，检查数据库权限

### 问题 3: 数据丢失
- PostgreSQL 数据是持久化的，不会丢失
- 检查是否连接到正确的数据库
- 查看 Railway 数据库备份

## 成本

- Railway 免费计划包含：
  - PostgreSQL 数据库
  - 500 小时运行时间/月
  - 100 GB 出站流量/月
  - 1 GB 存储空间

对于个人项目完全够用！

## 下一步

配置完成后：
1. 重新部署应用
2. 测试添加植物和养护记录
3. 重启服务验证数据是否保留
4. 确认数据持久化正常工作

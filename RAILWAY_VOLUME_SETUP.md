# Railway Volume 持久化存储配置

## 问题
Railway 的文件系统是临时的，每次部署都会清空数据。

## 解决方案
使用 Railway Volume 持久化存储。

## 配置步骤

### 1. 登录 Railway
访问：https://railway.app

### 2. 进入项目
选择 plant-care-wechat 项目

### 3. 添加 Volume
1. 点击项目服务
2. 点击 "Variables" 标签
3. 滚动到底部，找到 "Volumes" 部分
4. 点击 "New Volume"
5. 配置：
   - **Mount Path**: `/app/data`
   - **Name**: `plant-data`（可选）
6. 点击 "Add"

### 4. 添加环境变量
在 Variables 标签中添加：
- **Variable**: `DATA_DIR`
- **Value**: `/app/data`

### 5. 重新部署
保存后 Railway 会自动重新部署。

## 验证

部署完成后：
1. 添加一些植物和养护记录
2. 在 Railway 手动触发重新部署
3. 检查数据是否还在

## Volume 特点

- ✅ 持久化存储，重启/重新部署不丢失
- ✅ 免费（包含在 Railway 免费额度内）
- ✅ 自动备份
- ⚠️ 单实例（不支持多实例共享）

## 备选方案

如果 Volume 不可用，可以考虑：

### 方案 B: MongoDB Atlas（免费）
1. 注册：https://www.mongodb.com/cloud/atlas
2. 创建免费集群（512MB）
3. 安装依赖：`npm install mongoose`
4. 修改代码使用 MongoDB

### 方案 C: 本地测试用内存存储
开发环境可以用内存存储，生产环境用数据库。

## 当前状态

- ✅ 代码已支持 DATA_DIR 环境变量
- ⏳ 需要在 Railway 配置 Volume
- ⏳ 需要添加 DATA_DIR 环境变量

## 注意事项

1. Volume 配置后需要重新部署
2. Mount Path 必须是 `/app/data`
3. 确保 DATA_DIR 环境变量正确设置
4. 首次配置后数据会丢失一次（正常）

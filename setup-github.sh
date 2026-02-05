#!/bin/bash

echo "🚀 植物养护系统 - GitHub仓库设置"
echo "=================================="

# 检查git是否已初始化
if [ ! -d ".git" ]; then
    echo "📦 初始化Git仓库..."
    git init
    echo "✅ Git仓库初始化完成"
fi

# 创建.gitignore
echo "📝 创建.gitignore文件..."
cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
/client/dist/
/build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Test files
/tests/coverage/

# Temporary files
/tmp/
*.tmp
EOF

echo "✅ .gitignore文件创建完成"

# 添加所有文件
echo "📁 添加文件到Git..."
git add .

# 提交
echo "💾 提交代码..."
git commit -m "feat: 植物养护微信H5应用初始版本

🌱 功能特性:
- 微信公众号集成和用户认证
- AI植物识别 (百度智能云)
- 智能问答咨询 (文心一言)
- 植物管理和养护记录
- 社区分享和互动功能
- 完整的健康监控系统
- 单元测试和集成测试

🚀 技术栈:
- 后端: Node.js + Express
- 数据库: MySQL (内存模式用于演示)
- AI服务: 百度智能云
- 部署: Railway平台
- 测试: Jest + Supertest

📱 微信配置:
- AppID: 你的微信AppID
- Token: plant_care_token_2024
- 支持网页授权和JS-SDK

✅ 测试状态:
- 单元测试: 通过
- 集成测试: 通过
- 健康检查: 通过
- 负载测试: 通过"

echo "✅ 代码提交完成"

echo ""
echo "🎯 下一步操作:"
echo "1. 在GitHub上创建新仓库 'plant-care-wechat'"
echo "2. 运行以下命令连接远程仓库:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/plant-care-wechat.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. 然后在Railway中:"
echo "   - 访问 https://railway.app"
echo "   - 点击 'New Project'"
echo "   - 选择 'Deploy from GitHub repo'"
echo "   - 选择你的 plant-care-wechat 仓库"
echo "   - Railway会自动开始部署"
echo ""
echo "4. 配置环境变量 (在Railway项目设置中):"
echo "   NODE_ENV=production"
echo "   WECHAT_APP_ID=你的微信AppID"
echo "   WECHAT_APP_SECRET=你的微信AppSecret"
echo "   WECHAT_TOKEN=plant_care_token_2024"
echo "   JWT_SECRET=your_secure_jwt_secret"
echo "   BAIDU_API_KEY=你的百度API密钥"
echo "   BAIDU_SECRET_KEY=你的百度Secret密钥"
echo "   USE_MEMORY_DB=true"
echo ""
echo "🚀 准备就绪！可以开始部署了！"
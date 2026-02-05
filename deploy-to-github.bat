@echo off
echo ========================================
echo 植物养护微信H5应用 - GitHub部署脚本
echo ========================================
echo.

echo 1. 初始化Git仓库...
git init
if errorlevel 1 (
    echo 错误: Git未安装或初始化失败
    echo 请先安装Git: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo 2. 添加所有文件...
git add .

echo 3. 创建提交...
git commit -m "植物养护微信H5应用 - 安全版本"

echo 4. 设置远程仓库...
echo 请在GitHub创建仓库: https://github.com/new
echo 仓库名建议: plant-care-wechat
echo 设为Public，不要初始化README
echo.
set /p repo_url="请输入完整的GitHub仓库URL (如: https://github.com/lcdxiangzi/plant-care-wechat.git): "

git remote add origin %repo_url%

echo 5. 推送到GitHub...
git branch -M main
git push -u origin main

if errorlevel 1 (
    echo.
    echo 推送失败，可能需要GitHub认证
    echo 请按照提示输入用户名和密码/token
    echo 或者手动上传文件到GitHub
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 代码已成功上传到GitHub!
echo ========================================
echo.
echo 下一步: Railway部署
echo 1. 访问: https://railway.app
echo 2. 用GitHub账号登录
echo 3. 选择你的仓库部署
echo.
pause
@echo off
chcp 65001 >nul
echo ========================================
echo 植物养护项目 - GitHub配置和上传
echo ========================================
echo.

echo 🔧 配置Git用户信息...
git config user.name "lcdxiangzi"
git config user.email "lcdxiangzi@gmail.com"

echo 📁 检查当前Git状态...
git status

echo.
echo 🔗 移除现有远程仓库...
git remote remove origin 2>nul

echo.
echo 📝 添加所有文件...
git add .

echo.
echo 💾 创建新提交...
git commit -m "植物养护微信H5应用 - GitHub版本，完全可部署"

echo.
echo ========================================
echo 📋 GitHub仓库创建指南
echo ========================================
echo.
echo 请按以下步骤创建GitHub仓库：
echo.
echo 1. 访问: https://github.com/new
echo 2. Repository name: plant-care-wechat
echo 3. 选择: Public
echo 4. 不要勾选 "Add a README file"
echo 5. 不要勾选 "Add .gitignore"
echo 6. 不要勾选 "Choose a license"
echo 7. 点击 "Create repository"
echo.
echo 创建完成后，GitHub会显示仓库URL，类似：
echo https://github.com/lcdxiangzi/plant-care-wechat.git
echo.

set /p repo_url="请输入GitHub仓库URL: "

echo.
echo 🔗 添加GitHub远程仓库...
git remote add origin %repo_url%

echo.
echo 🌿 设置主分支...
git branch -M main

echo.
echo 🚀 推送到GitHub...
echo 注意：可能需要GitHub认证
echo 如果提示需要token，请使用Personal Access Token
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✅ 成功上传到GitHub！
    echo ========================================
    echo.
    echo 🔗 仓库地址: %repo_url%
    echo.
    echo 🚀 下一步：Vercel部署
    echo 1. 访问: https://vercel.com
    echo 2. 用GitHub账号登录
    echo 3. 选择刚创建的仓库部署
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ 上传可能需要认证
    echo ========================================
    echo.
    echo 💡 GitHub认证方案：
    echo 1. 使用GitHub Desktop（推荐）
    echo 2. 配置Personal Access Token
    echo 3. 或者网页直接上传文件
    echo.
)

pause
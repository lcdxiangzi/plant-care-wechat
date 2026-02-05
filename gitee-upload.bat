@echo off
chcp 65001 >nul
echo ========================================
echo 植物养护项目 - Gitee上传脚本
echo ========================================
echo.

echo 🔧 配置Git用户信息...
git config user.name "lcdxiangzi"
git config user.email "lcdxiangzi@gmail.com"

echo 📁 检查当前状态...
git status

echo.
echo 📝 添加所有文件...
git add .

echo.
echo 💾 创建提交...
git commit -m "植物养护微信H5应用 - 修复部署问题，完全可部署版本"

echo.
echo 🔗 设置Gitee远程仓库...
git remote remove origin 2>nul
git remote add origin https://gitee.com/lcdxiangzi/plant-care-wechat.git

echo.
echo 🌿 设置主分支...
git branch -M main

echo.
echo 🚀 推送到Gitee...
echo 注意：如果提示需要用户名密码，请输入你的Gitee账号信息
echo 用户名: lcdxiangzi
echo 密码: 你的Gitee密码或访问令牌
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✅ 成功上传到Gitee！
    echo ========================================
    echo.
    echo 🔗 仓库地址: https://gitee.com/lcdxiangzi/plant-care-wechat
    echo.
    echo 下一步：部署到云平台
    echo 1. Vercel: https://vercel.com
    echo 2. 腾讯云: https://console.cloud.tencent.com/webify
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ 上传失败
    echo ========================================
    echo.
    echo 可能的解决方案：
    echo 1. 检查网络连接
    echo 2. 确认Gitee用户名密码正确
    echo 3. 或者使用访问令牌代替密码
    echo.
    echo 手动上传方案：
    echo 1. 访问 https://gitee.com/lcdxiangzi/plant-care-wechat
    echo 2. 点击"上传文件"
    echo 3. 拖拽所有文件上传
    echo.
)

pause
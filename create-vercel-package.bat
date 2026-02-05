@echo off
chcp 65001 >nul
echo ========================================
echo 创建Vercel部署包
echo ========================================
echo.

echo 📁 创建部署目录...
if exist "vercel-deploy" rmdir /s /q "vercel-deploy"
mkdir "vercel-deploy"

echo 📋 复制核心文件...
xcopy /E /I /Q "server" "vercel-deploy\server"
xcopy /E /I /Q "client\dist" "vercel-deploy\client\dist"
xcopy /E /I /Q "tests" "vercel-deploy\tests"

echo 📄 复制配置文件...
copy "package.json" "vercel-deploy\"
copy "vercel.json" "vercel-deploy\"
copy ".gitignore" "vercel-deploy\"
copy "jest.config.js" "vercel-deploy\"

echo 📝 创建部署说明...
echo # 植物养护微信H5应用 > "vercel-deploy\README.md"
echo. >> "vercel-deploy\README.md"
echo 这是一个完整的植物养护微信H5应用 >> "vercel-deploy\README.md"
echo 包含AI识别、养护记录、社区分享等功能 >> "vercel-deploy\README.md"

echo 📦 创建ZIP包...
powershell -command "Compress-Archive -Path 'vercel-deploy\*' -DestinationPath 'plant-care-vercel.zip' -Force"

echo 🧹 清理临时文件...
rmdir /s /q "vercel-deploy"

echo.
echo ========================================
echo ✅ Vercel部署包创建完成！
echo ========================================
echo.
echo 📦 文件名: plant-care-vercel.zip
echo.
echo 🚀 下一步：
echo 1. 访问 https://vercel.com
echo 2. 拖拽 plant-care-vercel.zip 到页面
echo 3. 等待自动部署
echo.
pause
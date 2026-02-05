@echo off
echo ========================================
echo 创建部署包 - 植物养护微信H5应用
echo ========================================
echo.

echo 正在创建部署包...

:: 创建临时目录
if exist "plant-care-deploy" rmdir /s /q "plant-care-deploy"
mkdir "plant-care-deploy"

:: 复制所有文件，排除不需要的
echo 复制项目文件...
xcopy /E /I /Q "server" "plant-care-deploy\server"
xcopy /E /I /Q "client" "plant-care-deploy\client"
xcopy /E /I /Q "tests" "plant-care-deploy\tests"

:: 复制根目录文件
copy "package.json" "plant-care-deploy\"
copy "Procfile" "plant-care-deploy\"
copy "railway.json" "plant-care-deploy\"
copy "vercel.json" "plant-care-deploy\"
copy ".env.example" "plant-care-deploy\"
copy ".gitignore" "plant-care-deploy\"
copy "jest.config.js" "plant-care-deploy\"
copy "README.md" "plant-care-deploy\"

:: 创建部署说明
echo 创建部署说明文件...
echo # 植物养护微信H5应用 > "plant-care-deploy\DEPLOY_README.md"
echo. >> "plant-care-deploy\DEPLOY_README.md"
echo ## 环境变量配置 >> "plant-care-deploy\DEPLOY_README.md"
echo 在部署平台设置以下环境变量： >> "plant-care-deploy\DEPLOY_README.md"
echo. >> "plant-care-deploy\DEPLOY_README.md"
echo NODE_ENV=production >> "plant-care-deploy\DEPLOY_README.md"
echo WECHAT_APP_ID=wx1dd6d394f46a502d >> "plant-care-deploy\DEPLOY_README.md"
echo WECHAT_APP_SECRET=你的微信AppSecret >> "plant-care-deploy\DEPLOY_README.md"
echo WECHAT_TOKEN=plant_care_token_2024 >> "plant-care-deploy\DEPLOY_README.md"
echo JWT_SECRET=plant_care_jwt_2024_secure >> "plant-care-deploy\DEPLOY_README.md"
echo BAIDU_API_KEY=你的百度API密钥 >> "plant-care-deploy\DEPLOY_README.md"
echo BAIDU_SECRET_KEY=你的百度Secret密钥 >> "plant-care-deploy\DEPLOY_README.md"
echo USE_MEMORY_DB=true >> "plant-care-deploy\DEPLOY_README.md"

:: 创建ZIP包
echo 正在打包...
powershell -command "Compress-Archive -Path 'plant-care-deploy\*' -DestinationPath 'plant-care-wechat-deploy.zip' -Force"

:: 清理临时目录
rmdir /s /q "plant-care-deploy"

echo.
echo ========================================
echo ✅ 部署包创建完成！
echo ========================================
echo.
echo 文件名: plant-care-wechat-deploy.zip
echo.
echo 下一步:
echo 1. 访问 https://vercel.com
echo 2. 拖拽 plant-care-wechat-deploy.zip 到页面
echo 3. 等待自动部署
echo 4. 配置环境变量
echo.
pause
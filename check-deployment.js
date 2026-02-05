#!/usr/bin/env node

const axios = require('axios');

async function checkDeployment(baseUrl) {
  console.log('🔍 检查部署状态...');
  console.log(`🎯 目标地址: ${baseUrl}`);
  console.log('=' * 50);
  
  const checks = [
    {
      name: '基础健康检查',
      url: `${baseUrl}/api/health`,
      test: (data) => data.status === 'healthy'
    },
    {
      name: '详细健康检查',
      url: `${baseUrl}/api/health/detailed`,
      test: (data) => data.summary && data.summary.total > 0
    },
    {
      name: '微信验证端点',
      url: `${baseUrl}/api/wechat/verify?signature=test&timestamp=123&nonce=abc&echostr=hello`,
      test: (data) => true, // 任何响应都算成功
      expectError: true
    },
    {
      name: '静态资源',
      url: `${baseUrl}/`,
      test: (data) => typeof data === 'string' && data.includes('植物养护助手')
    }
  ];
  
  let passedChecks = 0;
  let totalChecks = checks.length;
  
  for (const check of checks) {
    try {
      console.log(`\n🧪 ${check.name}...`);
      
      const response = await axios.get(check.url, {
        timeout: 10000,
        validateStatus: () => true // 接受所有状态码
      });
      
      let success = false;
      
      if (check.expectError) {
        // 对于预期可能出错的检查，只要有响应就算成功
        success = response.status < 500;
      } else {
        success = response.status === 200 && check.test(response.data);
      }
      
      if (success) {
        console.log(`   ✅ 通过 (${response.status})`);
        passedChecks++;
      } else {
        console.log(`   ❌ 失败 (${response.status})`);
        console.log(`   响应: ${JSON.stringify(response.data).substring(0, 100)}...`);
      }
      
    } catch (error) {
      if (check.expectError && error.response) {
        console.log(`   ✅ 通过 (预期错误: ${error.response.status})`);
        passedChecks++;
      } else {
        console.log(`   ❌ 失败: ${error.message}`);
      }
    }
  }
  
  console.log('\n' + '=' * 50);
  console.log('📊 检查结果汇总:');
  console.log(`   总检查项: ${totalChecks}`);
  console.log(`   通过: ${passedChecks}`);
  console.log(`   失败: ${totalChecks - passedChecks}`);
  console.log(`   成功率: ${Math.round((passedChecks / totalChecks) * 100)}%`);
  
  if (passedChecks === totalChecks) {
    console.log('\n🎉 部署检查完全通过！系统运行正常！');
    
    console.log('\n📱 微信公众号配置信息:');
    console.log(`   服务器地址: ${baseUrl}/api/wechat/verify`);
    console.log(`   Token: plant_care_token_2024`);
    console.log(`   网页授权域名: ${baseUrl.replace('https://', '').replace('http://', '')}`);
    
    console.log('\n🔗 重要链接:');
    console.log(`   健康检查: ${baseUrl}/api/health`);
    console.log(`   详细状态: ${baseUrl}/api/health/detailed`);
    console.log(`   主页: ${baseUrl}/`);
    
  } else if (passedChecks >= totalChecks * 0.7) {
    console.log('\n⚠️  部署基本成功，但有部分功能异常');
    console.log('   建议检查日志并修复问题');
  } else {
    console.log('\n❌ 部署存在严重问题，需要排查');
    console.log('   请检查服务器日志和配置');
  }
  
  return {
    total: totalChecks,
    passed: passedChecks,
    success: passedChecks === totalChecks
  };
}

// 如果直接运行此脚本
if (require.main === module) {
  const baseUrl = process.argv[2];
  
  if (!baseUrl) {
    console.log('❌ 请提供部署地址');
    console.log('用法: node check-deployment.js https://your-app.railway.app');
    process.exit(1);
  }
  
  checkDeployment(baseUrl)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 检查过程出错:', error.message);
      process.exit(1);
    });
}

module.exports = { checkDeployment };
#!/usr/bin/env node

/**
 * 部署前完整测试脚本
 * 检查所有依赖、文件结构、配置等
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始部署前测试...\n');

const tests = [];
let passedTests = 0;
let failedTests = 0;

function addTest(name, testFn) {
  tests.push({ name, testFn });
}

function runTest(name, testFn) {
  try {
    const result = testFn();
    if (result) {
      console.log(`✅ ${name}`);
      passedTests++;
      return true;
    } else {
      console.log(`❌ ${name}`);
      failedTests++;
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failedTests++;
    return false;
  }
}

// 测试1: 检查package.json
addTest('package.json存在且格式正确', () => {
  if (!fs.existsSync('package.json')) return false;
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return pkg.name && pkg.version && pkg.scripts && pkg.scripts.start;
});

// 测试2: 检查主入口文件
addTest('服务器入口文件存在', () => {
  return fs.existsSync('server/index.js');
});

// 测试3: 检查必需的路由文件
addTest('所有路由文件存在', () => {
  const requiredRoutes = ['wechat.js', 'user.js', 'plant.js', 'care.js', 'ai.js', 'community.js', 'upload.js'];
  return requiredRoutes.every(route => fs.existsSync(`server/routes/${route}`));
});

// 测试4: 检查配置文件
addTest('微信配置文件存在', () => {
  return fs.existsSync('server/config/wechat.js');
});

// 测试5: 检查工具文件
addTest('数据库工具存在', () => {
  return fs.existsSync('server/utils/database.js');
});

addTest('健康检查工具存在', () => {
  return fs.existsSync('server/utils/healthCheck.js');
});

// 测试6: 检查服务文件
addTest('AI服务文件存在', () => {
  return fs.existsSync('server/services/aiService.js');
});

// 测试7: 检查中间件
addTest('认证中间件存在', () => {
  return fs.existsSync('server/middleware/auth.js');
});

// 测试8: 检查部署配置
addTest('Procfile存在', () => {
  if (!fs.existsSync('Procfile')) return false;
  const content = fs.readFileSync('Procfile', 'utf8');
  return content.includes('web: node server/index.js');
});

addTest('railway.json存在', () => {
  return fs.existsSync('railway.json');
});

// 测试9: 检查环境变量模板
addTest('.env.example存在', () => {
  return fs.existsSync('.env.example');
});

// 测试10: 检查.gitignore
addTest('.gitignore正确配置', () => {
  if (!fs.existsSync('.gitignore')) return false;
  const content = fs.readFileSync('.gitignore', 'utf8');
  return content.includes('.env') && content.includes('node_modules');
});

// 测试11: 检查前端文件
addTest('前端文件结构正确', () => {
  return fs.existsSync('client/src/App.vue') && 
         fs.existsSync('client/src/main.js') &&
         fs.existsSync('client/package.json');
});

// 测试12: 检查测试文件
addTest('测试文件存在', () => {
  return fs.existsSync('tests/integration/api.test.js') &&
         fs.existsSync('tests/unit/database.test.js');
});

// 测试13: 检查package.json的main字段
addTest('package.json main字段正确', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return pkg.main === 'server/index.js';
});

// 测试14: 检查启动脚本
addTest('启动脚本正确', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return pkg.scripts.start === 'node server/index.js';
});

// 测试15: 检查Node.js版本要求
addTest('Node.js版本要求设置', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return pkg.engines && pkg.engines.node;
});

// 运行所有测试
console.log('📋 运行测试清单:\n');

tests.forEach(test => {
  runTest(test.name, test.testFn);
});

console.log('\n📊 测试结果:');
console.log(`✅ 通过: ${passedTests}`);
console.log(`❌ 失败: ${failedTests}`);
console.log(`📈 总计: ${passedTests + failedTests}`);

if (failedTests === 0) {
  console.log('\n🎉 所有测试通过！项目可以安全部署。');
  process.exit(0);
} else {
  console.log('\n⚠️  存在问题，需要修复后再部署。');
  process.exit(1);
}
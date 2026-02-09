const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 微信配置
const WECHAT_TOKEN = process.env.WECHAT_TOKEN || 'plant_care_token_2024';
const WECHAT_APPID = process.env.WECHAT_APPID || 'wx1dd6d394f46a502d';
const WECHAT_APPSECRET = process.env.WECHAT_APPSECRET || '';

// 百度 AI 配置
const BAIDU_API_KEY = process.env.BAIDU_API_KEY || 'pPRB23J8C6cIpuFE3ba6ef31';
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY || 'ghUZQS1slZmQbebMArsJo5PV6uVz6GuT';

// 数据文件路径 - 支持 Railway Volume
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// 读取用户数据
async function loadUserData() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// 保存用户数据
async function saveUserData(data) {
  try {
    await ensureDataDir();
    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('保存数据失败:', error);
    return false;
  }
}

// 获取用户信息
async function getUserInfo(openid) {
  const allData = await loadUserData();
  if (!allData[openid]) {
    allData[openid] = {
      openid: openid,
      plants: [],
      createdAt: new Date().toISOString()
    };
    await saveUserData(allData);
  }
  return allData[openid];
}

// 添加植物（支持分类）
async function addPlant(openid, plantName, plantType = '其他') {
  const allData = await loadUserData();
  const user = allData[openid] || {
    openid: openid,
    plants: [],
    createdAt: new Date().toISOString()
  };
  
  const plant = {
    id: Date.now().toString(),
    name: plantName,
    type: plantType,  // 植物类型
    addedAt: new Date().toISOString()
  };
  
  user.plants.push(plant);
  allData[openid] = user;
  
  const saved = await saveUserData(allData);
  return saved ? plant : null;
}

// 获取植物列表
async function getPlants(openid) {
  const user = await getUserInfo(openid);
  return user.plants || [];
}

// 删除植物
async function deletePlant(openid, plantName) {
  const allData = await loadUserData();
  const user = allData[openid];
  
  if (!user || !user.plants) {
    return false;
  }
  
  const initialLength = user.plants.length;
  user.plants = user.plants.filter(p => p.name !== plantName);
  
  if (user.plants.length < initialLength) {
    allData[openid] = user;
    await saveUserData(allData);
    return true;
  }
  
  return false;
}

// 添加养护记录（支持备注）
async function addCareRecord(openid, plantName, careType, note = '') {
  const allData = await loadUserData();
  const user = allData[openid];
  
  if (!user || !user.plants) {
    return null;
  }
  
  const plant = user.plants.find(p => p.name === plantName);
  if (!plant) {
    return null;
  }
  
  // 初始化养护记录数组
  if (!plant.careRecords) {
    plant.careRecords = [];
  }
  
  const record = {
    type: careType,  // 'water' 或 'fertilize'
    date: new Date().toISOString(),
    note: note  // 备注
  };
  
  plant.careRecords.push(record);
  allData[openid] = user;
  
  const saved = await saveUserData(allData);
  return saved ? record : null;
}

// 获取植物详情（包含养护记录）
async function getPlantDetail(openid, plantName) {
  const user = await getUserInfo(openid);
  const plant = user.plants.find(p => p.name === plantName);
  return plant || null;
}

// 获取最后养护时间
function getLastCareTime(plant, careType) {
  if (!plant.careRecords || plant.careRecords.length === 0) {
    return null;
  }
  
  const records = plant.careRecords.filter(r => r.type === careType);
  if (records.length === 0) {
    return null;
  }
  
  // 返回最新的记录
  return records[records.length - 1].date;
}

// 格式化时间差
function formatTimeDiff(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      return '刚刚';
    }
    return `${diffHours}小时前`;
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

// 获取用户统计数据
async function getUserStats(openid) {
  const user = await getUserInfo(openid);
  const plants = user.plants || [];
  
  let totalWater = 0;
  let totalFertilize = 0;
  let plantsByType = {};
  
  plants.forEach(plant => {
    // 统计植物类型
    const type = plant.type || '其他';
    plantsByType[type] = (plantsByType[type] || 0) + 1;
    
    // 统计养护次数
    if (plant.careRecords) {
      plant.careRecords.forEach(record => {
        if (record.type === 'water') totalWater++;
        if (record.type === 'fertilize') totalFertilize++;
      });
    }
  });
  
  return {
    totalPlants: plants.length,
    totalWater,
    totalFertilize,
    plantsByType
  };
}

// 获取百度 AI Access Token
async function getBaiduAccessToken() {
  try {
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;
    const response = await axios.get(url);
    
    if (response.data.access_token) {
      console.log('✅ 获取百度AI access_token成功');
      return response.data.access_token;
    } else {
      console.error('❌ 获取百度AI access_token失败:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ 获取百度AI access_token异常:', error.message);
    return null;
  }
}

// 识别植物（通过图片URL）
async function recognizePlant(imageUrl) {
  try {
    const accessToken = await getBaiduAccessToken();
    if (!accessToken) {
      return { success: false, message: '获取百度AI授权失败' };
    }
    
    // 下载图片并转为 base64
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBase64 = Buffer.from(imageResponse.data, 'binary').toString('base64');
    
    // 调用百度植物识别 API
    const apiUrl = `https://aip.baidubce.com/rest/2.0/image-classify/v1/plant?access_token=${accessToken}`;
    const response = await axios.post(apiUrl, 
      `image=${encodeURIComponent(imageBase64)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    console.log('百度AI识别结果:', response.data);
    
    if (response.data.result && response.data.result.length > 0) {
      const result = response.data.result[0];
      return {
        success: true,
        name: result.name,
        score: result.score,
        baike_info: result.baike_info
      };
    } else {
      return { success: false, message: '未识别到植物' };
    }
  } catch (error) {
    console.error('❌ 植物识别失败:', error.message);
    return { success: false, message: '识别失败，请稍后重试' };
  }
}

// 根据植物类型获取养护建议
function getCareAdvice(plantType) {
  const adviceMap = {
    '绿植': `🌿 绿植养护建议：

💧 浇水：保持土壤湿润，见干见湿
☀️ 光照：散射光，避免强光直射
🌡️ 温度：15-25℃最适宜
💨 通风：保持空气流通
🌿 施肥：生长期每月1-2次`,

    '多肉': `🌵 多肉植物养护建议：

💧 浇水：少浇水，宁干勿湿
☀️ 光照：充足阳光，每天4-6小时
🌡️ 温度：10-30℃，耐旱怕涝
💨 通风：良好通风，防止闷热
🌿 施肥：生长期薄肥勤施`,

    '花卉': `🌸 花卉养护建议：

💧 浇水：根据品种调整，花期多浇
☀️ 光照：充足光照促进开花
🌡️ 温度：根据品种，一般15-25℃
💨 通风：良好通风防病虫害
🌿 施肥：花期前增施磷钾肥`,

    '其他': `🌱 通用养护建议：

💧 浇水：见干见湿，不积水
☀️ 光照：根据植物习性调整
🌡️ 温度：避免极端温度
💨 通风：保持空气流通
🌿 施肥：生长期适量施肥`
  };
  
  return adviceMap[plantType] || adviceMap['其他'];
}

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 添加原始body解析中间件（用于微信XML消息）
app.use('/wechat', express.text({ type: 'text/xml' }));

// 微信服务器验证接口
app.get('/wechat', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  
  console.log('收到微信验证请求:', { signature, timestamp, nonce, echostr });
  
  // 验证签名
  const token = WECHAT_TOKEN;
  const tmpArr = [token, timestamp, nonce].sort();
  const tmpStr = tmpArr.join('');
  const tmpSha = crypto.createHash('sha1').update(tmpStr).digest('hex');
  
  if (tmpSha === signature) {
    console.log('✅ 微信验证成功');
    res.send(echostr);
  } else {
    console.log('❌ 微信验证失败');
    res.send('验证失败');
  }
});

// 微信消息接收接口
app.post('/wechat', async (req, res) => {
  console.log('收到微信消息');
  console.log('消息内容:', req.body);
  
  try {
    // 解析XML消息（简单提取）
    const body = req.body || '';
    
    // 提取关键信息
    const toUserMatch = body.match(/<ToUserName><!\[CDATA\[(.*?)\]\]><\/ToUserName>/);
    const fromUserMatch = body.match(/<FromUserName><!\[CDATA\[(.*?)\]\]><\/FromUserName>/);
    const msgTypeMatch = body.match(/<MsgType><!\[CDATA\[(.*?)\]\]><\/MsgType>/);
    const eventMatch = body.match(/<Event><!\[CDATA\[(.*?)\]\]><\/Event>/);
    const eventKeyMatch = body.match(/<EventKey><!\[CDATA\[(.*?)\]\]><\/EventKey>/);
    
    const toUser = toUserMatch ? toUserMatch[1] : '';
    const fromUser = fromUserMatch ? fromUserMatch[1] : '';
    const msgType = msgTypeMatch ? msgTypeMatch[1] : '';
    const event = eventMatch ? eventMatch[1] : '';
    const eventKey = eventKeyMatch ? eventKeyMatch[1] : '';
    
    console.log('解析结果:', { toUser, fromUser, msgType, event, eventKey });
    
    let replyContent = '';
    
    // 处理不同类型的消息
    if (msgType === 'event') {
      // 处理事件消息
      if (event === 'subscribe') {
        // 关注事件 - 初始化用户数据
        await getUserInfo(fromUser);
        
        replyContent = `🌱 欢迎关注植物养护助手！

感谢您的关注！我们致力于帮助您更好地照顾您的植物。

📋 快捷菜单（回复数字）：
1️⃣ 我的植物
2️⃣ 养护知识
3️⃣ 关于我们
0️⃣ 显示菜单

💡 快速开始：
回复"添加 植物名称"来添加您的第一株植物
例如：添加 绿萝

💧 养护记录：
浇水 植物名称 - 记录浇水
施肥 植物名称 - 记录施肥
详情 植物名称 - 查看养护历史

直接发送消息开始对话！`;
      } else if (event === 'CLICK') {
        // 菜单点击事件（服务号/认证订阅号才有）
        if (eventKey === 'CARE_TIPS') {
          replyContent = `💡 植物养护小贴士

🌿 浇水：见干见湿，不要积水
☀️ 光照：根据植物习性调整
🌡️ 温度：避免极端温度
✂️ 修剪：及时清理枯叶

回复 0 返回菜单`;
        } else if (eventKey === 'ABOUT') {
          replyContent = `🌱 关于植物养护助手

版本：v0.3.0
状态：测试版

我们的目标：
让每个人都能轻松养好植物

开发团队：lcdxiangzi
联系方式：lcdxiangzi@163.com

回复 0 返回菜单`;
        }
      }
    } else if (msgType === 'text') {
      // 处理文本消息 - 提取消息内容
      const contentMatch = body.match(/<Content><!\[CDATA\[(.*?)\]\]><\/Content>/);
      const content = contentMatch ? contentMatch[1].trim() : '';
      
      console.log('收到文本消息:', content);
      
      // 解析命令
      if (content.startsWith('添加 ') || content.startsWith('添加')) {
        // 添加植物
        const plantName = content.replace(/^添加\s*/, '').trim();
        
        if (!plantName) {
          replyContent = `❌ 请输入植物名称

正确格式：
添加 植物名称 类型

例如：
添加 绿萝 绿植
添加 多肉植物 多肉
添加 月季 花卉

类型可选：绿植、多肉、花卉、其他`;
        } else {
          // 解析植物名称和类型
          const parts = plantName.split(/\s+/);
          const name = parts[0];
          const type = parts[1] || '其他';
          
          const plant = await addPlant(fromUser, name, type);
          if (plant) {
            replyContent = `✅ 添加成功！

🌱 植物名称：${name}
🏷️ 类型：${type}
📅 添加时间：${new Date(plant.addedAt).toLocaleString('zh-CN')}

回复"1"或"我的植物"查看列表
回复"删除 ${name}"可以删除`;
          } else {
            replyContent = `❌ 添加失败，请稍后重试`;
          }
        }
      } else if (content.startsWith('删除 ') || content.startsWith('删除')) {
        // 删除植物
        const plantName = content.replace(/^删除\s*/, '').trim();
        
        if (!plantName) {
          replyContent = `❌ 请输入要删除的植物名称

正确格式：
删除 植物名称

例如：
删除 绿萝`;
        } else {
          const deleted = await deletePlant(fromUser, plantName);
          if (deleted) {
            replyContent = `✅ 已删除植物：${plantName}

回复"1"或"我的植物"查看剩余植物`;
          } else {
            replyContent = `❌ 未找到植物：${plantName}

回复"1"或"我的植物"查看当前列表`;
          }
        }
      } else if (content.startsWith('浇水 ') || content.startsWith('浇水')) {
        // 记录浇水（支持备注）
        const input = content.replace(/^浇水\s*/, '').trim();
        
        if (!input) {
          replyContent = `❌ 请输入植物名称

正确格式：
浇水 植物名称 备注

例如：
浇水 绿萝
浇水 绿萝 叶子有点黄`;
        } else {
          // 解析植物名称和备注
          const parts = input.split(/\s+/);
          const plantName = parts[0];
          const note = parts.slice(1).join(' ');
          
          const record = await addCareRecord(fromUser, plantName, 'water', note);
          if (record) {
            let reply = `✅ 浇水记录成功！

🌱 植物：${plantName}
💧 浇水时间：${new Date(record.date).toLocaleString('zh-CN')}`;
            
            if (note) {
              reply += `\n📝 备注：${note}`;
            }
            
            reply += `\n\n回复"详情 ${plantName}"查看养护历史`;
            replyContent = reply;
          } else {
            replyContent = `❌ 未找到植物：${plantName}

请先添加植物
回复"添加 ${plantName}"`;
          }
        }
      } else if (content.startsWith('施肥 ') || content.startsWith('施肥')) {
        // 记录施肥（支持备注）
        const input = content.replace(/^施肥\s*/, '').trim();
        
        if (!input) {
          replyContent = `❌ 请输入植物名称

正确格式：
施肥 植物名称 备注

例如：
施肥 绿萝
施肥 绿萝 复合肥`;
        } else {
          // 解析植物名称和备注
          const parts = input.split(/\s+/);
          const plantName = parts[0];
          const note = parts.slice(1).join(' ');
          
          const record = await addCareRecord(fromUser, plantName, 'fertilize', note);
          if (record) {
            let reply = `✅ 施肥记录成功！

🌱 植物：${plantName}
🌿 施肥时间：${new Date(record.date).toLocaleString('zh-CN')}`;
            
            if (note) {
              reply += `\n📝 备注：${note}`;
            }
            
            reply += `\n\n回复"详情 ${plantName}"查看养护历史`;
            replyContent = reply;
          } else {
            replyContent = `❌ 未找到植物：${plantName}

请先添加植物
回复"添加 ${plantName}"`;
          }
        }
      } else if (content.startsWith('详情 ') || content.startsWith('详情')) {
        // 查看植物详情
        const plantName = content.replace(/^详情\s*/, '').trim();
        
        if (!plantName) {
          replyContent = `❌ 请输入植物名称

正确格式：
详情 植物名称

例如：
详情 绿萝`;
        } else {
          const plant = await getPlantDetail(fromUser, plantName);
          if (plant) {
            const addedDate = new Date(plant.addedAt).toLocaleDateString('zh-CN');
            const lastWater = getLastCareTime(plant, 'water');
            const lastFertilize = getLastCareTime(plant, 'fertilize');
            const plantType = plant.type || '其他';
            
            let detailText = `🌱 ${plant.name}
🏷️ 类型：${plantType}
📅 添加时间：${addedDate}

💧 浇水记录：${lastWater ? formatTimeDiff(lastWater) : '暂无记录'}
🌿 施肥记录：${lastFertilize ? formatTimeDiff(lastFertilize) : '暂无记录'}`;

            // 显示最近5条记录
            if (plant.careRecords && plant.careRecords.length > 0) {
              const recentRecords = plant.careRecords.slice(-5).reverse();
              detailText += '\n\n📋 最近养护：';
              recentRecords.forEach(r => {
                const icon = r.type === 'water' ? '💧' : '🌿';
                const action = r.type === 'water' ? '浇水' : '施肥';
                const time = formatTimeDiff(r.date);
                let recordText = `\n${icon} ${action} - ${time}`;
                if (r.note) {
                  recordText += `\n   📝 ${r.note}`;
                }
                detailText += recordText;
              });
            }
            
            detailText += '\n\n💡 快捷操作：';
            detailText += `\n浇水 ${plantName}`;
            detailText += `\n施肥 ${plantName}`;
            detailText += '\n\n回复 0 返回菜单';
            
            replyContent = detailText;
          } else {
            replyContent = `❌ 未找到植物：${plantName}

回复"1"或"我的植物"查看当前列表`;
          }
        }
      } else if (content === '0' || content === '菜单' || content === 'menu') {
        replyContent = `📋 快捷菜单

回复对应数字查看：
1️⃣ 我的植物
2️⃣ 养护知识
3️⃣ 关于我们
📊 统计 - 查看数据

🌱 植物管理：
添加 植物名称 类型 - 添加新植物
删除 植物名称 - 删除植物

💧 养护记录：
浇水 植物名称 备注 - 记录浇水
施肥 植物名称 备注 - 记录施肥
详情 植物名称 - 查看详情

直接发送消息开始对话！`;
      } else if (content === '统计' || content === 'stats' || content === '数据') {
        // 查看统计数据
        const stats = await getUserStats(fromUser);
        
        if (stats.totalPlants === 0) {
          replyContent = `📊 养护统计

您还没有添加植物

回复"添加 植物名称"开始记录`;
        } else {
          let statsText = `📊 养护统计

🌱 植物总数：${stats.totalPlants}株
💧 浇水次数：${stats.totalWater}次
🌿 施肥次数：${stats.totalFertilize}次`;

          // 按类型统计
          if (Object.keys(stats.plantsByType).length > 0) {
            statsText += '\n\n🏷️ 植物分类：';
            Object.entries(stats.plantsByType).forEach(([type, count]) => {
              statsText += `\n${type}：${count}株`;
            });
          }
          
          statsText += '\n\n回复 0 返回菜单';
          replyContent = statsText;
        }
      } else if (content === '1' || content.includes('我的植物') || content.includes('植物列表')) {
        // 查看植物列表
        const plants = await getPlants(fromUser);
        
        if (plants.length === 0) {
          replyContent = `🌿 我的植物

您还没有添加植物

💡 快速添加：
回复"添加 植物名称"

例如：
添加 绿萝
添加 多肉植物
添加 发财树

回复 0 返回菜单`;
        } else {
          let plantList = plants.map((p, index) => {
            const addedDate = new Date(p.addedAt).toLocaleDateString('zh-CN');
            const lastWater = getLastCareTime(p, 'water');
            const waterInfo = lastWater ? `💧 ${formatTimeDiff(lastWater)}` : '💧 未浇水';
            const plantType = p.type || '其他';
            return `${index + 1}. ${p.name} [${plantType}]\n   📅 ${addedDate}\n   ${waterInfo}`;
          }).join('\n\n');
          
          replyContent = `🌿 我的植物（共${plants.length}株）

${plantList}

💡 养护操作：
浇水 植物名称 - 记录浇水
施肥 植物名称 - 记录施肥
详情 植物名称 - 查看详情

💡 管理植物：
添加 植物名称 - 添加新植物
删除 植物名称 - 删除植物

回复 0 返回菜单`;
        }
      } else if (content === '2' || content.includes('养护') || content.includes('知识')) {
        replyContent = `💡 植物养护知识

🌿 浇水技巧
见干见湿，不要积水
不同植物需水量不同

☀️ 光照管理
喜阳植物：充足光照
喜阴植物：散射光

🌡️ 温度控制
避免极端温度
注意季节变化

✂️ 日常养护
及时清理枯叶
定期检查病虫害

💡 获取专业建议：
回复"建议 植物类型"
例如：建议 绿植

回复 0 返回菜单`;
      } else if (content.startsWith('建议 ') || content.startsWith('建议')) {
        // 获取养护建议
        const input = content.replace(/^建议\s*/, '').trim();
        
        if (!input) {
          replyContent = `💡 养护建议

请输入植物类型：

建议 绿植
建议 多肉
建议 花卉

或查看植物详情获取专属建议`;
        } else {
          const advice = getCareAdvice(input);
          replyContent = advice + '\n\n回复 0 返回菜单';
        }
      } else if (content === '3' || content.includes('关于') || content.includes('联系')) {
        replyContent = `🌱 关于植物养护助手

版本：v0.2.0
状态：测试版

📌 项目目标
让每个人都能轻松养好植物

👨‍💻 开发团队
lcdxiangzi

📧 联系方式
lcdxiangzi@163.com

🙏 感谢您的支持！

回复 0 返回菜单`;
      } else {
        // 默认回复
        replyContent = `🌱 收到您的消息：${content}

AI对话功能开发中...

💡 提示：
回复 0 查看功能菜单
回复 1 查看我的植物
回复 2 查看养护知识
回复 3 查看关于我们

🌿 植物管理：
添加 植物名称 - 添加新植物
删除 植物名称 - 删除植物`;
      }
    } else if (msgType === 'image') {
      // 处理图片消息 - AI 植物识别
      const picUrlMatch = body.match(/<PicUrl><!\[CDATA\[(.*?)\]\]><\/PicUrl>/);
      const picUrl = picUrlMatch ? picUrlMatch[1] : '';
      
      console.log('收到图片消息:', picUrl);
      
      if (picUrl) {
        replyContent = `🔍 正在识别植物...

请稍等片刻`;
        
        // 异步识别植物（不阻塞响应）
        recognizePlant(picUrl).then(async (result) => {
          if (result.success) {
            // 识别成功，发送客服消息告知结果
            console.log(`识别成功: ${result.name}, 置信度: ${result.score}`);
            
            // 这里可以通过客服消息接口发送详细结果
            // 由于订阅号限制，暂时只能在首次回复中提示
          } else {
            console.log('识别失败:', result.message);
          }
        });
      } else {
        replyContent = `❌ 图片接收失败

请重新发送图片`;
      }
    } else {
      // 其他类型消息
      replyContent = `🌱 收到您的消息！

💡 支持的功能：
📝 文本消息 - 植物管理和养护
📷 图片消息 - AI植物识别

回复 0 查看功能菜单`;
    }
    
    // 构建回复消息
    const replyMessage = `<xml>
  <ToUserName><![CDATA[${fromUser}]]></ToUserName>
  <FromUserName><![CDATA[${toUser}]]></FromUserName>
  <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
  <MsgType><![CDATA[text]]></MsgType>
  <Content><![CDATA[${replyContent}]]></Content>
</xml>`;
    
    console.log('发送回复消息');
    res.type('application/xml').send(replyMessage);
    
  } catch (error) {
    console.error('处理消息出错:', error);
    res.send('success');
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '植物养护系统运行正常',
    timestamp: new Date().toISOString(),
    version: '0.5.0',
    storage: 'Railway Volume (JSON)',
    features: ['关键词菜单', '植物管理', '养护记录', '数据持久化', '植物分类', '养护备注', '数据统计', 'AI植物识别', '智能养护建议']
  });
});

// 配置检查接口（用于诊断）
app.get('/wechat/config/check', (req, res) => {
  res.json({
    message: '环境变量配置检查',
    config: {
      WECHAT_TOKEN: WECHAT_TOKEN ? '✅ 已配置' : '❌ 未配置',
      WECHAT_APPID: WECHAT_APPID ? `✅ 已配置 (${WECHAT_APPID})` : '❌ 未配置',
      WECHAT_APPSECRET: WECHAT_APPSECRET ? `✅ 已配置 (${WECHAT_APPSECRET.substring(0, 8)}...)` : '❌ 未配置'
    },
    instructions: WECHAT_APPSECRET ? 
      '所有配置正常，可以访问 /wechat/menu/create 创建菜单' :
      '请在Railway配置WECHAT_APPSECRET环境变量后重新部署'
  });
});

// 获取微信access_token
async function getAccessToken() {
  try {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APPID}&secret=${WECHAT_APPSECRET}`;
    console.log('正在获取access_token...');
    console.log('AppID:', WECHAT_APPID);
    console.log('AppSecret前8位:', WECHAT_APPSECRET ? WECHAT_APPSECRET.substring(0, 8) : '未配置');
    
    const response = await axios.get(url);
    console.log('微信API响应:', response.data);
    
    if (response.data.access_token) {
      console.log('✅ 获取access_token成功');
      return response.data.access_token;
    } else {
      console.error('❌ 获取access_token失败:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ 获取access_token异常:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
    return null;
  }
}

// 创建微信菜单接口（自动调用微信API）
app.get('/wechat/menu/create', async (req, res) => {
  try {
    console.log('开始创建微信菜单...');
    
    // 检查AppSecret是否配置
    if (!WECHAT_APPSECRET) {
      return res.json({
        success: false,
        message: '请先在Railway配置WECHAT_APPSECRET环境变量',
        instructions: [
          '1. 进入Railway项目',
          '2. 点击Variables标签',
          '3. 添加: WECHAT_APPSECRET=你的AppSecret',
          '4. 重新部署后再访问此接口'
        ]
      });
    }
    
    // 获取access_token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      // 尝试直接调用微信API获取详细错误
      const testUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APPID}&secret=${WECHAT_APPSECRET}`;
      const testResponse = await axios.get(testUrl);
      
      return res.json({
        success: false,
        message: '获取access_token失败，请检查AppID和AppSecret是否正确',
        debug: {
          appid: WECHAT_APPID,
          appsecret_prefix: WECHAT_APPSECRET.substring(0, 8),
          wechat_response: testResponse.data
        },
        help: '请登录微信公众平台 > 开发 > 基本配置，确认AppID和AppSecret'
      });
    }
    
    // 菜单配置
    const menu = {
      button: [
        {
          type: 'view',
          name: '我的植物',
          url: `https://${req.get('host')}/`
        },
        {
          type: 'click',
          name: '养护知识',
          key: 'CARE_TIPS'
        },
        {
          type: 'click',
          name: '关于我们',
          key: 'ABOUT'
        }
      ]
    };
    
    // 调用微信API创建菜单
    const createUrl = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${accessToken}`;
    const createResponse = await axios.post(createUrl, menu);
    
    console.log('微信API响应:', createResponse.data);
    
    if (createResponse.data.errcode === 0) {
      res.json({
        success: true,
        message: '✅ 菜单创建成功！请在微信中查看（可能需要取消关注再重新关注才能看到新菜单）',
        menu: menu
      });
    } else {
      res.json({
        success: false,
        message: '菜单创建失败',
        error: createResponse.data,
        help: createResponse.data.errcode === 65301 ? 
          '订阅号（未认证）没有自定义菜单权限，请使用关键词菜单（回复 0 查看）' : 
          '请查看微信公众平台文档了解错误码含义'
      });
    }
    
  } catch (error) {
    console.error('创建菜单出错:', error);
    res.status(500).json({
      success: false,
      message: '创建菜单失败',
      error: error.message,
      details: error.response ? error.response.data : null
    });
  }
});

// 主页
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// 启动服务器
app.listen(PORT, () => {
  console.log('🌱 植物养护微信公众号服务启动');
  console.log(`📡 端口: ${PORT}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔗 微信验证: http://localhost:${PORT}/wechat`);
});

module.exports = app;
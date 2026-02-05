const axios = require('axios');

class AIService {
  constructor() {
    this.baiduApiKey = process.env.BAIDU_API_KEY;
    this.baiduSecretKey = process.env.BAIDU_SECRET_KEY;
    this.accessToken = null;
    this.tokenExpireTime = 0;
  }
  
  // 获取百度AI访问令牌
  async getBaiduAccessToken() {
    try {
      if (this.accessToken && Date.now() < this.tokenExpireTime) {
        return this.accessToken;
      }
      
      const response = await axios.post(
        'https://aip.baidubce.com/oauth/2.0/token',
        null,
        {
          params: {
            grant_type: 'client_credentials',
            client_id: this.baiduApiKey,
            client_secret: this.baiduSecretKey
          }
        }
      );
      
      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000; // 提前5分钟过期
        return this.accessToken;
      } else {
        throw new Error('获取百度AI访问令牌失败');
      }
    } catch (error) {
      console.error('获取百度AI访问令牌失败:', error);
      throw error;
    }
  }
  
  // 植物识别
  async identifyPlant(imageUrl) {
    try {
      const accessToken = await this.getBaiduAccessToken();
      
      // 将图片URL转换为base64
      const imageBase64 = await this.imageUrlToBase64(imageUrl);
      
      const response = await axios.post(
        `https://aip.baidubce.com/rest/2.0/image-classify/v1/plant?access_token=${accessToken}`,
        {
          image: imageBase64,
          baike_num: 1
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      if (response.data.result && response.data.result.length > 0) {
        const result = response.data.result[0];
        
        return {
          success: true,
          data: {
            plantType: result.name,
            species: result.name,
            confidence: result.score,
            difficulty: this.getDifficultyByPlantType(result.name),
            description: result.baike_info?.description || '',
            careGuide: this.getBasicCareGuide(result.name)
          }
        };
      } else {
        return {
          success: false,
          message: '未能识别出植物类型'
        };
      }
    } catch (error) {
      console.error('植物识别失败:', error);
      return {
        success: false,
        message: '植物识别服务异常'
      };
    }
  }
  
  // AI咨询问答
  async consultQuestion(question, context = {}) {
    try {
      const accessToken = await this.getBaiduAccessToken();
      
      // 构建提示词
      let prompt = `你是一个专业的植物养护专家，请回答用户的植物相关问题。\n\n`;
      
      if (context.plantType) {
        prompt += `用户的植物类型：${context.plantType}\n`;
      }
      
      if (context.plantAge) {
        prompt += `植物年龄：${context.plantAge}\n`;
      }
      
      if (context.location) {
        prompt += `植物位置：${context.location}\n`;
      }
      
      prompt += `\n用户问题：${question}\n\n请提供专业、实用的建议，包括具体的操作步骤。`;
      
      const response = await axios.post(
        `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${accessToken}`,
        {
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          top_p: 0.8,
          penalty_score: 1.0
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.result) {
        return {
          success: true,
          data: {
            response: response.data.result,
            suggestions: this.extractSuggestions(response.data.result)
          }
        };
      } else {
        throw new Error('AI咨询服务返回异常');
      }
    } catch (error) {
      console.error('AI咨询失败:', error);
      return {
        success: false,
        message: 'AI咨询服务暂时不可用，请稍后重试'
      };
    }
  }
  
  // 获取养护建议
  async getCareAdvice(plantType, context = {}) {
    try {
      const { season = 'SPRING', lastCareDate } = context;
      
      let prompt = `请为${plantType}提供${season}季节的养护建议。`;
      
      if (lastCareDate) {
        const daysSinceLastCare = Math.floor((Date.now() - new Date(lastCareDate)) / (1000 * 60 * 60 * 24));
        prompt += `上次养护是${daysSinceLastCare}天前。`;
      }
      
      prompt += `请提供具体的养护建议，包括浇水、施肥、光照等方面。`;
      
      const result = await this.consultQuestion(prompt);
      
      if (result.success) {
        return {
          success: true,
          data: this.parseCareAdvice(result.data.response)
        };
      } else {
        return result;
      }
    } catch (error) {
      console.error('获取养护建议失败:', error);
      return {
        success: false,
        message: '获取养护建议失败'
      };
    }
  }
  
  // 图片URL转base64
  async imageUrlToBase64(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });
      
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      return base64;
    } catch (error) {
      console.error('图片转换失败:', error);
      throw new Error('图片处理失败');
    }
  }
  
  // 根据植物类型判断养护难度
  getDifficultyByPlantType(plantType) {
    const easyPlants = ['绿萝', '吊兰', '仙人掌', '多肉', '虎皮兰', '发财树'];
    const hardPlants = ['兰花', '茉莉', '玫瑰', '杜鹃', '茶花'];
    
    if (easyPlants.some(plant => plantType.includes(plant))) {
      return 'EASY';
    } else if (hardPlants.some(plant => plantType.includes(plant))) {
      return 'HARD';
    } else {
      return 'MEDIUM';
    }
  }
  
  // 获取基础养护指南
  getBasicCareGuide(plantType) {
    const guides = {
      '绿萝': '喜阴湿环境，避免阳光直射，保持土壤湿润但不积水',
      '吊兰': '喜半阴环境，土壤干燥时浇水，春夏季节可适当施肥',
      '仙人掌': '喜阳光充足，耐旱，浇水要少而透，冬季基本不浇水',
      '多肉': '喜阳光，耐旱，浇水见干见湿，避免积水',
      '虎皮兰': '耐阴耐旱，土壤干透再浇水，避免叶心积水'
    };
    
    for (let plant in guides) {
      if (plantType.includes(plant)) {
        return guides[plant];
      }
    }
    
    return '请根据植物特性提供适当的光照、水分和养分';
  }
  
  // 提取建议
  extractSuggestions(response) {
    const suggestions = [];
    
    // 简单的关键词提取
    if (response.includes('浇水')) {
      suggestions.push('注意浇水频率和水量');
    }
    
    if (response.includes('施肥')) {
      suggestions.push('适时施肥补充营养');
    }
    
    if (response.includes('光照')) {
      suggestions.push('调整光照条件');
    }
    
    if (response.includes('修剪')) {
      suggestions.push('及时修剪枯叶病枝');
    }
    
    return suggestions;
  }
  
  // 解析养护建议
  parseCareAdvice(response) {
    const advice = [];
    
    // 简单的文本解析，提取养护要点
    const lines = response.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.includes('浇水') || line.includes('水分')) {
        advice.push({
          type: 'WATER',
          title: '浇水建议',
          content: line.trim()
        });
      } else if (line.includes('施肥') || line.includes('营养')) {
        advice.push({
          type: 'FERTILIZE',
          title: '施肥建议',
          content: line.trim()
        });
      } else if (line.includes('光照') || line.includes('阳光')) {
        advice.push({
          type: 'LIGHT',
          title: '光照建议',
          content: line.trim()
        });
      } else if (line.includes('修剪') || line.includes('整理')) {
        advice.push({
          type: 'PRUNE',
          title: '修剪建议',
          content: line.trim()
        });
      }
    });
    
    return advice;
  }
}

module.exports = new AIService();
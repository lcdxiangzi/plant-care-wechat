const fs = require('fs').promises;
const path = require('path');

// 数据存储适配器 - 支持 JSON 文件和 PostgreSQL
class DataStore {
  constructor() {
    this.useDatabase = !!process.env.DATABASE_URL;
    this.dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.db = null;
    
    if (this.useDatabase) {
      const { Pool } = require('pg');
      this.db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      this.initDatabase();
    }
  }
  
  // 初始化数据库表
  async initDatabase() {
    if (!this.db) return;
    
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS users (
          openid VARCHAR(255) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ 数据库表初始化成功');
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error);
    }
  }
  
  // 读取所有用户数据
  async loadAllData() {
    if (this.useDatabase) {
      try {
        const result = await this.db.query('SELECT openid, data FROM users');
        const allData = {};
        result.rows.forEach(row => {
          allData[row.openid] = row.data;
        });
        return allData;
      } catch (error) {
        console.error('读取数据库失败:', error);
        return {};
      }
    } else {
      // JSON 文件存储
      try {
        await this.ensureDataDir();
        const data = await fs.readFile(this.usersFile, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        return {};
      }
    }
  }
  
  // 保存所有用户数据
  async saveAllData(data) {
    if (this.useDatabase) {
      // 使用事务保存所有数据
      const client = await this.db.connect();
      try {
        await client.query('BEGIN');
        
        for (const [openid, userData] of Object.entries(data)) {
          await client.query(`
            INSERT INTO users (openid, data, updated_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (openid)
            DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP
          `, [openid, JSON.stringify(userData)]);
        }
        
        await client.query('COMMIT');
        return true;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('保存数据库失败:', error);
        return false;
      } finally {
        client.release();
      }
    } else {
      // JSON 文件存储
      try {
        await this.ensureDataDir();
        await fs.writeFile(this.usersFile, JSON.stringify(data, null, 2), 'utf8');
        return true;
      } catch (error) {
        console.error('保存文件失败:', error);
        return false;
      }
    }
  }
  
  // 读取单个用户数据
  async loadUserData(openid) {
    if (this.useDatabase) {
      try {
        const result = await this.db.query(
          'SELECT data FROM users WHERE openid = $1',
          [openid]
        );
        return result.rows.length > 0 ? result.rows[0].data : null;
      } catch (error) {
        console.error('读取用户数据失败:', error);
        return null;
      }
    } else {
      const allData = await this.loadAllData();
      return allData[openid] || null;
    }
  }
  
  // 保存单个用户数据
  async saveUserData(openid, userData) {
    if (this.useDatabase) {
      try {
        await this.db.query(`
          INSERT INTO users (openid, data, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (openid)
          DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP
        `, [openid, JSON.stringify(userData)]);
        return true;
      } catch (error) {
        console.error('保存用户数据失败:', error);
        return false;
      }
    } else {
      const allData = await this.loadAllData();
      allData[openid] = userData;
      return await this.saveAllData(allData);
    }
  }
  
  // 确保数据目录存在（仅文件存储需要）
  async ensureDataDir() {
    if (this.useDatabase) return;
    
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }
  
  // 获取存储类型
  getStorageType() {
    return this.useDatabase ? 'PostgreSQL' : 'JSON File';
  }
}

module.exports = new DataStore();

<template>
  <div class="home">
    <!-- 顶部轮播图 -->
    <van-swipe class="home-swipe" :autoplay="3000" indicator-color="white">
      <van-swipe-item v-for="(banner, index) in banners" :key="index">
        <div class="banner-item" :style="{ backgroundImage: `url(${banner.image})` }">
          <div class="banner-content">
            <h3>{{ banner.title }}</h3>
            <p>{{ banner.subtitle }}</p>
          </div>
        </div>
      </van-swipe-item>
    </van-swipe>
    
    <!-- 快捷功能 -->
    <div class="quick-actions">
      <div class="action-grid">
        <div class="action-item" @click="$router.push('/ai/identify')">
          <div class="action-icon">
            <van-icon name="search" size="24" />
          </div>
          <span>AI识别</span>
        </div>
        <div class="action-item" @click="$router.push('/plant/add')">
          <div class="action-icon">
            <van-icon name="plus" size="24" />
          </div>
          <span>添加植物</span>
        </div>
        <div class="action-item" @click="$router.push('/care/add')">
          <div class="action-icon">
            <van-icon name="edit" size="24" />
          </div>
          <span>记录养护</span>
        </div>
        <div class="action-item" @click="$router.push('/ai/consult')">
          <div class="action-icon">
            <van-icon name="chat-o" size="24" />
          </div>
          <span>AI咨询</span>
        </div>
      </div>
    </div>
    
    <!-- 我的植物 -->
    <div class="my-plants" v-if="isLogin">
      <div class="section-header">
        <h3>我的植物</h3>
        <van-button type="primary" size="small" @click="$router.push('/plants')">
          查看全部
        </van-button>
      </div>
      
      <div class="plant-list" v-if="recentPlants.length > 0">
        <div 
          class="plant-card" 
          v-for="plant in recentPlants" 
          :key="plant.plantId"
          @click="$router.push(`/plant/${plant.plantId}`)"
        >
          <div class="plant-image">
            <img :src="plant.mainImage" :alt="plant.plantName" />
          </div>
          <div class="plant-info">
            <h4>{{ plant.plantName }}</h4>
            <p>{{ plant.plantType || '未识别' }}</p>
            <span class="care-status" :class="getCareStatusClass(plant.lastCareDate)">
              {{ getCareStatusText(plant.lastCareDate) }}
            </span>
          </div>
        </div>
      </div>
      
      <van-empty v-else description="还没有植物，快去添加一个吧！" />
    </div>
    
    <!-- 社区动态 -->
    <div class="community-section">
      <div class="section-header">
        <h3>植友圈</h3>
        <van-button type="primary" size="small" @click="$router.push('/community')">
          更多动态
        </van-button>
      </div>
      
      <div class="post-list" v-if="recentPosts.length > 0">
        <div 
          class="post-card" 
          v-for="post in recentPosts" 
          :key="post.postId"
        >
          <div class="post-header">
            <van-image
              class="avatar"
              round
              width="32"
              height="32"
              :src="post.userAvatar"
            />
            <div class="user-info">
              <span class="username">{{ post.userNickname }}</span>
              <span class="time">{{ formatTime(post.createTime) }}</span>
            </div>
          </div>
          
          <div class="post-content">
            <p>{{ post.content }}</p>
            <div class="post-images" v-if="post.images">
              <van-image
                v-for="(image, index) in post.images.split(',')"
                :key="index"
                :src="image"
                width="60"
                height="60"
                fit="cover"
                @click="previewImages(post.images.split(','), index)"
              />
            </div>
          </div>
          
          <div class="post-actions">
            <span class="action-item">
              <van-icon name="good-job-o" />
              {{ post.likeCount }}
            </span>
            <span class="action-item">
              <van-icon name="chat-o" />
              {{ post.commentCount }}
            </span>
          </div>
        </div>
      </div>
      
      <van-empty v-else description="暂无动态" />
    </div>
    
    <!-- 登录提示 -->
    <div class="login-prompt" v-if="!isLogin">
      <van-empty description="请先登录使用完整功能">
        <van-button type="primary" @click="handleLogin">立即登录</van-button>
      </van-empty>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { previewImage } from '../utils/wechat'

export default {
  name: 'Home',
  data() {
    return {
      banners: [
        {
          title: '🌱 AI植物识别',
          subtitle: '拍照即可识别植物种类',
          image: '/images/banner1.jpg'
        },
        {
          title: '📝 智能养护',
          subtitle: '记录每一次用心呵护',
          image: '/images/banner2.jpg'
        },
        {
          title: '👥 植友社区',
          subtitle: '与植友分享养护经验',
          image: '/images/banner3.jpg'
        }
      ],
      recentPlants: [],
      recentPosts: []
    }
  },
  
  computed: {
    ...mapGetters('user', ['isLogin'])
  },
  
  async created() {
    if (this.isLogin) {
      await this.loadRecentPlants()
    }
    await this.loadRecentPosts()
  },
  
  methods: {
    async loadRecentPlants() {
      try {
        const response = await this.$store.dispatch('plant/getPlantList', {
          page: 1,
          size: 3
        })
        if (response.success) {
          this.recentPlants = response.data.plants
        }
      } catch (error) {
        console.error('加载植物列表失败:', error)
      }
    },
    
    async loadRecentPosts() {
      try {
        const response = await this.$store.dispatch('community/getPostList', {
          page: 1,
          size: 5,
          type: 'latest'
        })
        if (response.success) {
          this.recentPosts = response.data.posts
        }
      } catch (error) {
        console.error('加载社区动态失败:', error)
      }
    },
    
    getCareStatusClass(lastCareDate) {
      if (!lastCareDate) return 'never'
      
      const daysDiff = Math.floor((Date.now() - new Date(lastCareDate)) / (1000 * 60 * 60 * 24))
      
      if (daysDiff <= 1) return 'recent'
      if (daysDiff <= 3) return 'normal'
      if (daysDiff <= 7) return 'warning'
      return 'urgent'
    },
    
    getCareStatusText(lastCareDate) {
      if (!lastCareDate) return '从未养护'
      
      const daysDiff = Math.floor((Date.now() - new Date(lastCareDate)) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 0) return '今天已养护'
      if (daysDiff === 1) return '昨天已养护'
      if (daysDiff <= 3) return `${daysDiff}天前养护`
      if (daysDiff <= 7) return `${daysDiff}天未养护`
      return `${daysDiff}天未养护！`
    },
    
    formatTime(time) {
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
      
      return date.toLocaleDateString()
    },
    
    previewImages(images, current) {
      previewImage(images[current], images)
    },
    
    handleLogin() {
      this.$router.push('/login')
    }
  }
}
</script>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.home-swipe {
  height: 200px;
  
  .banner-item {
    height: 100%;
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
    }
    
    .banner-content {
      position: relative;
      z-index: 1;
      text-align: center;
      color: white;
      
      h3 {
        font-size: 24px;
        margin: 0 0 8px 0;
      }
      
      p {
        font-size: 14px;
        margin: 0;
        opacity: 0.9;
      }
    }
  }
}

.quick-actions {
  background: white;
  margin: 16px;
  border-radius: 12px;
  padding: 20px;
  
  .action-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  
  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    
    .action-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin-bottom: 8px;
    }
    
    span {
      font-size: 12px;
      color: #666;
    }
  }
}

.my-plants, .community-section {
  margin: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      margin: 0;
      font-size: 18px;
      color: #323233;
    }
  }
}

.plant-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.plant-card {
  border: 1px solid #ebedf0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  
  .plant-image {
    height: 100px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .plant-info {
    padding: 8px;
    
    h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
      color: #323233;
    }
    
    p {
      margin: 0 0 4px 0;
      font-size: 12px;
      color: #969799;
    }
    
    .care-status {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      
      &.recent {
        background: #f0f9ff;
        color: #1989fa;
      }
      
      &.normal {
        background: #f7f8fa;
        color: #646566;
      }
      
      &.warning {
        background: #fff7e6;
        color: #ff976a;
      }
      
      &.urgent, &.never {
        background: #ffebee;
        color: #ee0a24;
      }
    }
  }
}

.post-list {
  .post-card {
    border-bottom: 1px solid #ebedf0;
    padding-bottom: 16px;
    margin-bottom: 16px;
    
    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
  }
  
  .post-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    
    .avatar {
      margin-right: 8px;
    }
    
    .user-info {
      flex: 1;
      
      .username {
        display: block;
        font-size: 14px;
        color: #323233;
        font-weight: 500;
      }
      
      .time {
        font-size: 12px;
        color: #969799;
      }
    }
  }
  
  .post-content {
    p {
      margin: 0 0 8px 0;
      font-size: 14px;
      line-height: 1.5;
      color: #323233;
    }
    
    .post-images {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
  }
  
  .post-actions {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    
    .action-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #969799;
    }
  }
}

.login-prompt {
  margin: 16px;
  background: white;
  border-radius: 12px;
  padding: 40px 16px;
}
</style>
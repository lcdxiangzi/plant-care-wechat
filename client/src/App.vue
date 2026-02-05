<template>
  <div id="app">
    <router-view />
    
    <!-- 全局加载提示 -->
    <van-overlay :show="$store.state.loading" class="loading-overlay">
      <div class="loading-content">
        <van-loading size="24px" vertical>加载中...</van-loading>
      </div>
    </van-overlay>
    
    <!-- 全局Toast -->
    <van-toast />
  </div>
</template>

<script>
export default {
  name: 'App',
  created() {
    // 初始化应用
    this.initApp()
  },
  methods: {
    async initApp() {
      try {
        // 检查用户登录状态
        await this.$store.dispatch('user/checkLoginStatus')
        
        // 如果在微信环境且未登录，尝试自动登录
        if (this.isWechatEnv() && !this.$store.state.user.isLogin) {
          this.handleWechatLogin()
        }
      } catch (error) {
        console.error('应用初始化失败:', error)
      }
    },
    
    isWechatEnv() {
      return /micromessenger/i.test(navigator.userAgent)
    },
    
    handleWechatLogin() {
      // 检查URL参数中是否有用户信息（来自微信授权回调）
      const urlParams = new URLSearchParams(window.location.search)
      const openid = urlParams.get('openid')
      const nickname = urlParams.get('nickname')
      const avatar = urlParams.get('avatar')
      
      if (openid) {
        // 自动登录
        this.$store.dispatch('user/wechatLogin', {
          openid,
          nickname: decodeURIComponent(nickname || ''),
          avatar: decodeURIComponent(avatar || '')
        })
        
        // 清理URL参数
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f7f8fa;
  min-height: 100vh;
}

.loading-overlay {
  .loading-content {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: white;
  }
}

// 全局样式重置
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: #f7f8fa;
}

// 微信环境适配
.wechat-env {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
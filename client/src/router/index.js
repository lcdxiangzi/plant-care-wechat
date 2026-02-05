import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '植物养护助手' }
  },
  {
    path: '/login',
    name: 'Login', 
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/plants',
    name: 'PlantList',
    component: () => import('../views/plant/PlantList.vue'),
    meta: { title: '我的植物', requiresAuth: true }
  },
  {
    path: '/plant/add',
    name: 'PlantAdd',
    component: () => import('../views/plant/PlantAdd.vue'),
    meta: { title: '添加植物', requiresAuth: true }
  },
  {
    path: '/plant/:id',
    name: 'PlantDetail',
    component: () => import('../views/plant/PlantDetail.vue'),
    meta: { title: '植物详情', requiresAuth: true }
  },
  {
    path: '/care',
    name: 'CareList',
    component: () => import('../views/care/CareList.vue'),
    meta: { title: '养护记录', requiresAuth: true }
  },
  {
    path: '/care/add',
    name: 'CareAdd',
    component: () => import('../views/care/CareAdd.vue'),
    meta: { title: '添加养护记录', requiresAuth: true }
  },
  {
    path: '/ai/identify',
    name: 'AIIdentify',
    component: () => import('../views/ai/AIIdentify.vue'),
    meta: { title: 'AI植物识别', requiresAuth: true }
  },
  {
    path: '/ai/consult',
    name: 'AIConsult',
    component: () => import('../views/ai/AIConsult.vue'),
    meta: { title: 'AI咨询', requiresAuth: true }
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('../views/community/Community.vue'),
    meta: { title: '植友圈' }
  },
  {
    path: '/community/post',
    name: 'CommunityPost',
    component: () => import('../views/community/CommunityPost.vue'),
    meta: { title: '发布动态', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('../views/AuthCallback.vue'),
    meta: { title: '授权中...' }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || '植物养护助手'
  
  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    if (!store.state.user.isLogin) {
      // 未登录，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }
  
  next()
})

export default router
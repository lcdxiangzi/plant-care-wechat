import { createStore } from 'vuex'
import user from './modules/user'
import plant from './modules/plant'
import care from './modules/care'
import ai from './modules/ai'
import community from './modules/community'

export default createStore({
  state: {
    loading: false,
    isWechatEnv: /micromessenger/i.test(navigator.userAgent)
  },
  
  mutations: {
    SET_LOADING(state, loading) {
      state.loading = loading
    }
  },
  
  actions: {
    setLoading({ commit }, loading) {
      commit('SET_LOADING', loading)
    }
  },
  
  modules: {
    user,
    plant,
    care,
    ai,
    community
  }
})
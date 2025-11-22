import './style.css'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import AuthView from './views/AuthView.vue'
import DashboardView from './views/DashboardView.vue'
import { useAuthStore } from './stores/auth'

const routes = [
  { path: '/', name: 'Auth', component: AuthView },
  { path: '/dashboard', name: 'Dashboard', component: DashboardView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫（临时禁用以便于测试）
// router.beforeEach(async (to, from) => {
//   const authStore = useAuthStore()
//   const isAuthenticated = authStore.isAuthenticated

//   if (to.name === 'Dashboard' && !isAuthenticated) {
//     return { name: 'Auth' }
//   }

//   if (to.name === 'Auth' && isAuthenticated) {
//     return { name: 'Dashboard' }
//   }
// })

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// 初始化认证状态
const authStore = useAuthStore()
authStore.init()
authStore.listenToAuthState()

app.mount('#app')

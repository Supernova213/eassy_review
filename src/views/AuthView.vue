<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <!-- 顶部Logo区域 -->
    <div class="pt-20 pb-8 text-center">
      <div class="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
        <i class="fas fa-brain text-3xl text-white"></i>
      </div>
      <h1 class="text-4xl font-bold text-gray-900 mb-2">申论作文助手</h1>
      <p class="text-gray-600 text-lg">让申论写作更智能、更高效</p>
    </div>

    <!-- 登录表单卡片 -->
    <div class="max-w-md mx-auto px-6">
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <!-- 标题 -->
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">
            {{ isLogin ? '欢迎回来' : '创建新账号' }}
          </h2>
          <p class="text-gray-600">
            {{ isLogin ? '登录您的账户' : '开始您的申论学习之旅' }}
          </p>
        </div>

        <!-- 表单 -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fas fa-envelope text-gray-400"></i>
              </div>
              <input
                id="email"
                v-model="email"
                name="email"
                type="email"
                required
                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="请输入邮箱地址"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fas fa-lock text-gray-400"></i>
              </div>
              <input
                id="password"
                v-model="password"
                name="password"
                type="password"
                required
                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="请输入密码"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin mr-2"></i>
            <i v-else :class="isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'" class="fas mr-2"></i>
            {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
          </button>
        </form>

        <!-- 切换链接 -->
        <div class="mt-6 text-center">
          <button
            type="button"
            @click="isLogin = !isLogin"
            class="text-blue-600 hover:text-blue-800 font-medium transition duration-200"
          >
            {{ isLogin ? '还没有账号？立即注册' : '已有账号？立即登录' }}
          </button>
        </div>

        <!-- 错误信息 -->
        <div v-if="error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex">
            <i class="fas fa-exclamation-circle text-red-500 mr-3 mt-0.5"></i>
            <p class="text-red-800 text-sm">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="text-center mt-8 text-gray-500 text-sm">
        <p>© 2024 申论作文助手. 让申论写作更简单.</p>
      </div>
    </div>

    <!-- 特色功能展示 -->
    <div class="mt-16 max-w-4xl mx-auto px-6">
      <div class="grid md:grid-cols-3 gap-6">
        <div class="text-center p-6">
          <div class="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <i class="fas fa-magic text-blue-600"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">智能生成</h3>
          <p class="text-gray-600 text-sm">基于材料自动生成申论题目</p>
        </div>
        <div class="text-center p-6">
          <div class="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <i class="fas fa-lightbulb text-green-600"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">专业建议</h3>
          <p class="text-gray-600 text-sm">多维度作文修改建议</p>
        </div>
        <div class="text-center p-6">
          <div class="mx-auto h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <i class="fas fa-star text-purple-600"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">详细解析</h3>
          <p class="text-gray-600 text-sm">专业答案点评和等级评定</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '../stores/auth'

export default {
  name: 'AuthView',
  data() {
    return {
      isLogin: true,
      email: '',
      password: '',
    }
  },
  computed: {
    loading() {
      return useAuthStore().loading
    },
    error() {
      return useAuthStore().error
    }
  },
  methods: {
    async handleSubmit() {
      const authStore = useAuthStore()
      const { success } = this.isLogin
        ? await authStore.login(this.email, this.password)
        : await authStore.register(this.email, this.password)

      if (success) {
        this.$router.push('/dashboard')
      }
    }
  }
}
</script>

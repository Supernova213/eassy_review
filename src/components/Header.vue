<template>
  <header class="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-3 fixed top-0 left-0 right-0 z-10">
    <div class="container mx-auto">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="h-9 w-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <i class="fas fa-brain text-white text-lg"></i>
          </div>
          <h1 class="text-xl font-semibold text-gray-800">申论作文助手</h1>
        </div>
        <div v-if="$store?.user" class="flex items-center space-x-4">
          <span class="text-sm text-gray-600 hidden sm:block">{{ $store.user?.email }}</span>
          <button
            @click="logout"
            class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition duration-200 text-sm font-medium"
          >
            <i class="fas fa-sign-out-alt mr-1"></i>
            登出
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { useAuthStore } from '../stores/auth'

export default {
  name: 'Header',
  computed: {
    $store() {
      return this.$route.name ? useAuthStore() : null
    }
  },
  methods: {
    async logout() {
      const authStore = useAuthStore()
      await authStore.logout()
      this.$router.push('/')
    }
  }
}
</script>

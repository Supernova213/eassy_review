<template>
  <div id="app" class="h-screen bg-gray-50">
    <Header v-if="showHeader" />
    <div class="h-full" :class="{ 'pt-16': showHeader }">
      <router-view />
    </div>
  </div>
</template>

<script>
import Header from './components/Header.vue'

export default {
  components: {
    Header
  },
  computed: {
    showHeader() {
      // 只有在dashboard页面才显示Header
      return this.$route.name === 'Dashboard'
    }
  }
}
</script>

<template>
  <aside class="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
    <div class="px-6 py-4 border-b border-gray-200 shrink-0">
      <h2 class="text-lg font-semibold text-gray-800">批改记录</h2>
    </div>
    <div class="flex-1 overflow-y-auto">
      <div v-if="isLoading" class="p-6 text-center text-gray-500">
        <i class="fas fa-spinner fa-spin mr-2"></i>
        加载中...
      </div>
      <div v-else-if="history.length === 0" class="p-6 text-center text-gray-500">
        <p>暂无历史记录</p>
      </div>
      <ul v-else class="divide-y divide-gray-100">
        <li v-for="item in history" :key="item.id" @click="$emit('load-history', item)" class="px-6 py-4 hover:bg-gray-50/70 cursor-pointer transition-colors duration-200">
          <h3 class="font-semibold text-gray-700 truncate text-sm">{{ item.ai_question || 'AI 生成材料练习' }}</h3>
          <p class="text-xs text-gray-500 mt-1.5">{{ formatTimestamp(item.created_at) }}</p>
        </li>
      </ul>
    </div>
    <div class="px-6 py-4 border-t border-gray-200 shrink-0">
       <button @click="$emit('new-review')" class="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white px-4 py-2.5 rounded-full transition duration-200 font-semibold shadow-sm">
        <i class="fas fa-plus mr-2"></i>
        创建新会话
      </button>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'HistorySidebar',
  props: {
    history: {
      type: Array,
      required: true,
    },
    isLoading: {
      type: Boolean,
      default: false,
    }
  },
  emits: ['load-history', 'new-review'],
  methods: {
    formatTimestamp(timestamp) {
      return new Date(timestamp).toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}
</script>

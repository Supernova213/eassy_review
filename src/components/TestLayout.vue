<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h1 class="text-2xl font-bold text-center mb-4">测试页面</h1>
      <div class="space-y-4">
        <input type="email" placeholder="邮箱" class="w-full px-3 py-2 border rounded" />
        <input type="password" placeholder="密码" class="w-full px-3 py-2 border rounded" />
        <button class="w-full bg-blue-500 text-white py-2 rounded">测试按钮</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TestLayout'
}
</script>

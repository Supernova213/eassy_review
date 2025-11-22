<template>
<div class="flex h-full">
  <HistorySidebar 
    :history="history" 
    :is-loading="historyLoading"
    @load-history="loadHistory"
    @new-review="createNewReview"
  />
  <div class="flex-1 overflow-y-auto bg-gray-50">
    <!-- 主工作区 -->
    <main class="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <!-- 步骤指示器 -->
      <section id="stepper-section">
        <ol class="flex items-center w-full">
          <li v-for="(step, index) in steps" :key="step.name" class="flex w-full items-center" :class="{'text-blue-600 dark:text-blue-500': currentStep >= index, 'text-gray-500': currentStep < index, 'after:inline-block after:w-full after:h-1 after:border-b after:border-4 after:mx-6': index < steps.length - 1, 'after:border-gray-200': currentStep <= index, 'after:border-blue-100': currentStep > index}">
            <span class="flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0" :class="{'bg-blue-100': currentStep >= index, 'bg-gray-100': currentStep < index}">
              <i class="text-xl" :class="[step.icon, {'text-blue-600': currentStep >= index, 'text-gray-500': currentStep < index}]"></i>
            </span>
          </li>
        </ol>
      </section>

      <!-- 步骤 1: 材料输入 -->
      <section id="material-section" class="transition-opacity duration-500">
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span class="h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">1</span>
              提供申论材料
            </h2>
            <div class="bg-gray-50/70 p-4 rounded-xl">
              <textarea
                v-model="material"
                placeholder="请在此处粘贴申论材料，或让AI为您生成一份..."
                class="w-full px-3 py-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y bg-transparent text-gray-700 leading-relaxed"
                rows="8"
                :disabled="isLoading"
              ></textarea>
            </div>
          </div>
          <div class="bg-gray-50/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              @click="generateMaterial"
              :disabled="isLoading"
              class="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 px-5 py-2.5 rounded-full transition duration-200 font-semibold text-sm"
            >
               <i v-if="isLoading && currentAction === 'generate_material'" class="fas fa-spinner fa-spin mr-2"></i>
               AI 生成材料
            </button>
            <button
              @click="generateQuestion"
              :disabled="!material.trim() || isLoading"
              class="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 disabled:opacity-50 text-white px-6 py-2.5 rounded-full transition duration-200 font-semibold shadow-md"
            >
              <i v-if="isLoading && currentAction === 'generate_question'" class="fas fa-spinner fa-spin mr-2"></i>
              生成题目
            </button>
          </div>
        </div>
      </section>

      <!-- 步骤 2: 题目与作答 -->
      <section id="question-answer-section" v-if="question" class="transition-opacity duration-500">
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span class="h-8 w-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3">2</span>
              根据题目作答
            </h2>
            <div class="mb-5 p-4 bg-gray-50/70 rounded-xl">
                <h3 class="font-semibold text-gray-700 mb-2">题目：</h3>
                <p class="text-gray-800 whitespace-pre-wrap leading-relaxed">{{ question }}</p>
            </div>
            <div class="bg-gray-50/70 p-4 rounded-xl">
              <textarea
                v-model="answer"
                placeholder="请在此处输入您的答案..."
                class="w-full px-3 py-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 resize-y bg-transparent text-gray-700 leading-relaxed"
                rows="10"
                :disabled="isLoading"
              ></textarea>
            </div>
          </div>
           <div class="bg-gray-50/50 px-6 py-4 flex justify-end">
             <button
                @click="reviewAnswer"
                :disabled="!answer.trim() || isLoading"
                class="bg-gradient-to-r from-green-500 to-teal-500 hover:opacity-90 disabled:opacity-50 text-white px-6 py-2.5 rounded-full transition duration-200 font-semibold shadow-md"
              >
                <i v-if="isLoading && currentAction === 'review_answer'" class="fas fa-spinner fa-spin mr-2"></i>
                提交批改
            </button>
           </div>
        </div>
      </section>

      <!-- 步骤 3: 批改结果 -->
      <section id="review-result-section" v-if="reviewResult || (isLoading && currentAction === 'review_answer')" class="transition-opacity duration-500">
         <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div class="p-6">
                <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <span class="h-8 w-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-3">3</span>
                    AI 批改报告
                </h2>
                <div v-if="isLoading && currentAction === 'review_answer'" class="text-center py-12">
                    <i class="fas fa-spinner fa-spin text-purple-500 text-4xl"></i>
                    <p class="mt-4 text-gray-600">AI 正在全力批阅您的答案，请稍候...</p>
                </div>
                <div v-else class="prose max-w-none text-gray-800 leading-relaxed" v-html="formattedReviewResult"></div>
            </div>
         </div>
      </section>
    </main>
  </div>
</div>
</template>

<script>
import { createClient } from '@supabase/supabase-js'
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import HistorySidebar from '../components/HistorySidebar.vue';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default {
  name: 'DashboardView',
  components: {
    HistorySidebar,
  },
  data() {
    return {
      history: [],
      historyLoading: false,
      material: '',
      question: '',
      answer: '',
      reviewResult: '',
      isLoading: false,
      currentAction: null,
      steps: [
        { name: '提供材料', icon: 'fas fa-file-alt' },
        { name: '作答题目', icon: 'fas fa-pen-nib' },
        { name: '查看报告', icon: 'fas fa-chart-line' },
      ]
    };
  },
  mounted() {
    this.fetchHistory();
  },
  computed: {
    currentStep() {
      if (this.reviewResult) return 2;
      if (this.question) return 1;
      return 0;
    },
    formattedReviewResult() {
      if (!this.reviewResult) return '';
      const rawHtml = marked(this.reviewResult, { gfm: true, breaks: true });
      return DOMPurify.sanitize(rawHtml);
    }
  },
  methods: {
    async callApi(action, body) {
      this.isLoading = true;
      this.currentAction = action;
      try {
        const { data, error } = await supabase.functions.invoke('essay-review', {
          body: { action, ...body }
        });
        if (error) throw error;
        return data.response;
      } catch (error) {
        console.error('API call error:', error);
        alert(`请求失败: ${error.message}`);
        return null;
      } finally {
        this.isLoading = false;
        this.currentAction = null;
      }
    },

    async fetchHistory() {
      this.historyLoading = true;
      // 在实际应用中，这里应该获取当前登录用户的ID
      const userId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // 使用硬编码的示例ID
      try {
        const { data, error } = await supabase
          .from('essay_reviews')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        this.history = data;
      } catch(error) {
        console.error('获取历史记录失败:', error);
        alert('获取历史记录失败');
      } finally {
        this.historyLoading = false;
      }
    },
    
    async generateMaterial() {
        this.resetState(false);
        const response = await this.callApi('generate_material', {});
        if (response) {
            this.material = response;
            this.scrollTo('material-section');
        }
    },

    async generateQuestion() {
      this.question = '';
      this.answer = '';
      this.reviewResult = '';
      const response = await this.callApi('generate_question', { text: this.material });
      if (response) {
        this.question = response;
        this.scrollTo('question-answer-section');
      }
    },

    async reviewAnswer() {
      this.reviewResult = '';
      const response = await this.callApi('review_answer', {
        material: this.material,
        question: this.question,
        answer: this.answer,
      });
      if (response) {
        this.reviewResult = response;
        this.scrollTo('review-result-section');
        this.fetchHistory(); // 批改完成后刷新历史记录
      }
    },
    
    loadHistory(item) {
      this.material = item.original_text || '';
      this.question = item.ai_question || '';
      this.answer = item.user_answer || '';
      this.reviewResult = item.ai_feedback || '';
    },
    
    createNewReview() {
      this.resetState(true);
      this.scrollTo('stepper-section');
    },

    resetState(fullReset = true) {
        if (fullReset) {
            this.material = '';
        }
        this.question = '';
        this.answer = '';
        this.reviewResult = '';
    },

    scrollTo(elementId) {
      this.$nextTick(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    },
  },
};
</script>

<style>
/* 优化滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
}
::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 6px;
}
::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}
/* 自定义Prose样式以更好地匹配Gemini风格 */
.prose h3 {
  color: #374151;
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
.prose ul {
  list-style-position: inside;
  padding-left: 0;
}
.prose ul > li::marker {
  color: #60a5fa;
}
.prose strong {
  color: #1f2937;
}
</style>

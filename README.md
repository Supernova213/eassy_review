# 申论作文助手 (Vue版本)

一个基于Vue.js + Tailwind CSS + Supabase的现代化申论作文智能助手，提供完整的用户认证和管理功能。

## 🎯 功能特性

- **🔐 用户认证系统**：注册、登录、登出功能
- **🧠 申论题目生成**：基于材料内容智能生成符合公务员考试标准的题目
- **💡 作文修改建议**：多维度专项修改指导
- **⭐ 专业答案解析**：全面点评、等级评价和优化建议
- **🎨 现代化UI**：响应式设计，支持移动端
- **📱 路由管理**：Vue Router实现页面导航
- **🏪 状态管理**：Pinia管理应用状态

## 📁 项目结构

```
├── public/
├── src/
│   ├── components/
│   │   └── Header.vue          # 头部组件
│   ├── views/
│   │   ├── AuthView.vue       # 认证页面
│   │   └── DashboardView.vue  # 主控制台
│   ├── stores/
│   │   └── auth.js            # 认证状态管理
│   ├── App.vue                # 根组件
│   └── main.js                # 应用入口
├── supabase/
│   └── functions/
│       └── essay-review/
│           └── index.ts       # Edge Function
├── .env.example               # 环境变量示例
├── vite.config.js             # Vite配置
└── tailwind.config.js         # Tailwind配置
```

## 🚀 部署指南

### Supabase配置

1. **创建Supabase项目**
   ```bash
   # 安装Supabase CLI
   npm install -g supabase

   # 登录并初始化项目
   supabase login
   supabase init
   ```

2. **部署数据库和函数**
   ```bash
   # 启动本地开发环境
   supabase start

   # 部署Edge Function
   supabase functions deploy essay-review

   # 设置环境变量
   supabase secrets set GEMINI_API_KEY=your_gemini_key
   ```

3. **获取项目配置**
   - 在Supabase仪表板找到项目URL和anon key
   - 复制到`.env`文件

### 前端部署到GitHub Pages

1. **创建环境变量**
   ```bash
   cp .env.example .env
   # 编辑.env文件填入实际配置
   ```

2. **构建应用**
   ```bash
   npm run build
   ```

3. **部署到GitHub Pages**
   ```bash
   # 安装gh-pages
   npm install -D gh-pages

   # 部署
   npx gh-pages -d dist
   ```

### 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 🛠️ 技术栈

- **Vue 3**：渐进式前端框架
- **Vue Router**：官方路由管理器
- **Pinia**：状态管理库
- **Tailwind CSS**：原子化CSS框架
- **Supabase**：后端平台(BaaS)
- **Vite**：前端构建工具
- **Google Gemini AI**：AI能力提供

## 📝 使用说明

1. **注册/登录**：首次使用需创建账号
2. **生成题目**：输入考材料内容，自动生成申论题目
3. **获取建议**：输入题目获得专业写作指导
4. **提交解析**：输入题目和答案获得详细点评
5. **管理账号**：可随时修改密码或登出

## 🔧 环境变量

创建`.env`文件并配置：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 📚 数据库表结构

```sql
-- 用户使用记录
CREATE TABLE daily_usage (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 作文评审记录
CREATE TABLE essay_reviews (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  original_text TEXT,
  ai_question TEXT,
  user_answer TEXT,
  ai_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## ⚠️ 注意事项

- 项目包含每日使用限制（默认3次）
- 请妥善保管API密钥，不要提交到版本控制
- 生产环境建议启用HTTPS
- 定期备份数据库数据

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进项目！

## 📄 许可证

MIT License

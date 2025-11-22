# 申论作文助手

这是一个使用 Vue 3、Vite、Tailwind CSS 和 Supabase 构建的智能申论批改应用。它可以根据用户提供的材料生成题目，并对用户的答案进行智能批改和提供反馈。

## 功能特性

- **AI 生成材料**: 快速生成一篇高质量的申论材料。
- **AI 生成题目**: 根据给定材料，智能生成一道申论题目。
- **智能批改**: 对用户的答案进行多维度分析，包括结构、内容、语言等，并提供详细的优化建议。
- **操作步骤指引**: 清晰的步骤条，引导用户完成整个流程。
- **历史记录**: 自动保存每一次批改，方便随时回顾和查阅。
- **现代化界面**: 采用类似 Google Gemini 的设计风格，简洁美观。

## 技术栈

- **前端**: Vue 3 (Options API), Vite, Tailwind CSS, Pinia
- **后端**: Supabase (Database, Edge Functions)
- **AI 模型**: Google Gemini

## 本地开发

1.  **克隆仓库**:
    ```bash
    git clone https://github.com/Supernova213/eassy_review.git
    cd eassy_review
    ```

2.  **安装依赖**:
    ```bash
    npm install
    ```

3.  **配置环境变量**:
    复制 `.env.example` 文件为 `.env`，并填入你的 Supabase 项目信息：
    ```
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    ```
    *你可以在 Supabase 项目后台的 `Settings` > `API` 中找到这些值。*

4.  **运行开发服务器**:
    ```bash
    npm run dev
    ```
    应用将在 `http://localhost:3001` (或其它可用端口) 上运行。

---

## 部署指南

部署此项目需要分别部署前端应用和后端的 Supabase Edge Function。

### 第一部分：部署前端 (以 Vercel 为例)

Vercel 提供了优秀的免费额度，并且与 Vite 项目的集成非常顺畅。

1.  **推送代码**: 将你的项目代码推送到一个 GitHub, GitLab, 或 Bitbucket 仓库。

2.  **在 Vercel 上创建项目**:
    - 登录 Vercel，点击 "Add New... > Project"。
    - 选择你刚刚推送的 Git 仓库并点击 "Import"。

3.  **配置项目**:
    - **Build Command**: Vercel 通常会自动识别为 `npm run build`。如果不是，请手动填入。
    - **Output Directory**: Vercel 会自动识别为 `dist`。
    - **Install Command**: 保持 `npm install` 即可。

4.  **添加环境变量**:
    - 在项目设置的 "Environment Variables" 部分，添加以下两个变量：
      - `VITE_SUPABASE_URL`: 你的 Supabase 项目 URL。
      - `VITE_SUPABASE_ANON_KEY`: 你的 Supabase 项目 Anon Key。

5.  **部署**:
    - 点击 "Deploy" 按钮。Vercel 将会自动拉取代码、构建并部署你的前端应用。完成后，你将得到一个公开的 URL。

### 第二部分：部署后端 (Supabase Edge Function)

你需要使用 Supabase CLI 来部署 `essay-review` 这个云函数。

1.  **安装 Supabase CLI**:
    如果你没有安装过，请根据你的操作系统选择相应的命令：
    - **macOS / Linux**: `brew install supabase/tap/supabase-cli`
    - **Windows**: `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git; scoop install supabase`
    *(更多安装方式请参考 [Supabase 官方文档](https://supabase.com/docs/guides/cli))*

2.  **登录 Supabase**:
    在你的项目根目录下打开终端，运行：
    ```bash
    supabase login
    ```
    这会打开一个浏览器窗口让你授权。

3.  **关联远程项目**:
    运行以下命令，将你的本地项目与你的 Supabase 远程项目关联起来。`[project-ref]` 是你项目的唯一ID，可以在你的 Supabase 项目 URL 中找到。
    
    例如，如果你的项目 URL 是 `https://supabase.com/dashboard/project/empienlynfhwrlbpipyp`，那么你的 `[project-ref]` 就是 `empienlynfhwrlbpipyp`。

    ```bash
    # 将 [project-ref] 替换成你自己的
    supabase link --project-ref [project-ref]
    ```
    CLI 可能会要求你输入数据库密码，请照做。

4.  **设置函数密钥 (Secrets)**:
    为了安全，我们需要将 Gemini API Key 作为一个秘密变量设置给云函数，而不是硬编码。
    ```bash
    # 将 your-gemini-api-key 替换成你自己的
    supabase secrets set GEMINI_API_KEY=your-gemini-api-key
    ```

5.  **部署云函数**:
    最后，运行部署命令。`essay-review` 是你在 `supabase/functions` 文件夹下的函数名。
    ```bash
    supabase functions deploy essay-review --no-verify-jwt
    ```
    *`--no-verify-jwt` 参数表示允许从浏览器直接调用该函数，这在我们的场景下是需要的。*

部署成功后，你的前端应用就可以通过 Supabase SDK 调用这个云函数了。

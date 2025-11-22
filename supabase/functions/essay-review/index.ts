import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"

// 初始化 Google Generative AI
const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY")!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"});

serve(async (req) => {
  console.log('--- 环境变量检查 ---');
  console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL'));
  console.log('SERVICE_ROLE_KEY:', Deno.env.get('SERVICE_ROLE_KEY') ? '已加载' : '未加载');
  console.log('GEMINI_API_KEY:', Deno.env.get('GEMINI_API_KEY') ? '已加载' : '未加载');
  console.log('-----------------------------------');

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SERVICE_ROLE_KEY') ?? '', // 直接使用服务角色密钥进行完全访问
  );

  // 对于本地测试，我们将使用硬编码的用户 ID
  // 在实际应用中，这将来自于已认证的用户
  const user = { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }; // 示例 UUID
  if (!user.id) {
    return new Response(JSON.stringify({ error: '未授权：数据库操作需要用户 ID' }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- 每日使用限制逻辑 ---
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: usageData, error: usageError } = await supabaseClient
    .from('daily_usage')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (usageError && usageError.code !== 'PGRST116') { // PGRST116 表示未找到行
    return new Response(JSON.stringify({ error: usageError.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  if (usageData) {
    const lastUsedDate = new Date(usageData.last_used_at).toISOString().slice(0, 10);
    if (lastUsedDate === today) {
      if (usageData.usage_count >= 3) {
        return new Response(JSON.stringify({ error: '已达到每日 3 次使用限制。' }), { status: 429, headers: { "Content-Type": "application/json" } });
      }
      // 增加使用计数
      await supabaseClient.from('daily_usage').update({ usage_count: usageData.usage_count + 1, last_used_at: new Date().toISOString() }).eq('id', usageData.id);
    } else {
      // 新的一天重置使用计数
      await supabaseClient.from('daily_usage').update({ usage_count: 1, last_used_at: new Date().toISOString() }).eq('id', usageData.id);
    }
  } else {
    // 创建新的使用记录
    await supabaseClient.from('daily_usage').insert({ user_id: user.id, usage_count: 1, last_used_at: new Date().toISOString() });
  }
  // --- 每日使用限制逻辑结束 ---
  
  const { action, text, material, question, answer } = await req.json()

  let prompt = ""
  switch (action) {
    case 'generate_material':
      prompt = `你是一位申论考试命题专家。请围绕当前的一个社会热点（例如：数字经济、乡村振兴、基层治理、生态文明建设等），生成一份长度在800-1000字左右的申论材料。要求材料内容翔实，案例与数据结合，观点鲜明，逻辑清晰，能够引出深刻的申论主题。`
      break
    case 'generate_question':
      prompt = `你是一名申论考试的出题专家。请根据以下材料，严格按照申论出题规范，设计一道有深度、有区分度的申论题目。

**出题要求：**
1.  **紧扣材料**：题目必须源于给定材料，不能脱离材料另起炉灶。
2.  **题型明确**：可以是归纳概括题、综合分析题、提出对策题、应用文写作题或文章论述题。
3.  **设问精准**：问题要清晰、具体，避免模棱两可。
4.  **富有启发**：能够引导考生进行深层次思考。
5.  **包含作答要求**：明确指出答案要点、字数限制（例如，800-1200字）和其他注意事项。

**给定材料：**
---
${text}
---
`
      break
    case 'review_answer':
      prompt = `你是一位经验丰富的申论阅卷组长。你的任务是为一位考生提供一份专业、全面、富有洞见的申论批改报告。请严格按照下面的Markdown格式和要求进行批改。

**背景信息：**

*   **给定材料：**
    ---
    ${material}
    ---
*   **申论题目：** "${question}"
*   **考生答案：**
    ---
    ${answer}
    ---

**批改报告（请严格使用以下Markdown格式输出）：**

---

### 一、材料核心要点解析
*   **核心主题**：[请在此处精准概括材料的核心思想与主题]
*   **关键信息点1**：[提炼材料中的第一个关键事实、数据或观点]
*   **关键信息点2**：[提炼材料中的第二个关键事实、数据或观点]
*   **关键信息点3**：[继续提炼，直至覆盖所有要点]

### 二、考生答案综合评估
*   **预估得分**：[给出一个参考分数，满分50分]
*   **评定等级**：[在“优秀”、“良好”、“中等”、“待改进”中选择一个]
*   **总体评价**：[在此处对答案进行一个高度概括的总评，点明主要优点与不足]

### 三、分项详细点评
1.  **立意与切题**
    *   **优点**：[考生观点是否准确、深刻，是否紧扣材料和题目要求]
    *   **不足**：[是否存在跑题、偏题或理解肤浅的问题]
2.  **结构与逻辑**
    *   **优点**：[文章结构是否清晰，逻辑层次是否分明，过渡是否自然]
    *   **不足**：[是否存在结构混乱、逻辑跳跃或层次不清的问题]
3.  **内容与论据**
    *   **优点**：[对材料信息的利用是否充分，论据是否典型、有力]
    *   **不足**：[是否存在内容空洞、脱离材料、论据不足或不当的问题]
4.  **语言与表达**
    *   **优点**：[语言是否流畅、精准，表达是否符合策论文体要求]
    *   **不足**：[是否存在语病、错别字、表述不清或口语化的问题]

### 四、优化建议与提升方向
*   **内容方面**：[针对内容和论据，提出具体的补充或调整建议]
*   **结构方面**：[就如何优化文章布局和逻辑，给出可行性建议]
*   **语言方面**：[提出具体的语言润色或表达规范建议]

---
`
      break
    default:
      return new Response(JSON.stringify({ error: '无效操作' }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = await response.text();

    // 将交互存储到数据库
    await supabaseClient.from('essay_reviews').insert({
      user_id: user.id,
      original_text: material || text, // 'generate_question'用的是text, 'review_answer'用的是material
      ai_question: action === 'generate_question' ? aiResponse : question,
      user_answer: answer,
      ai_feedback: action === 'review_answer' ? aiResponse : null,
    });

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

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
  
  const { action, text, question, answer } = await req.json()

  let prompt = ""
  switch (action) {
    case 'generate_question':
      prompt = `根据以下文本，请生成一个引人深思的问题：\n\n${text}`
      break
    case 'provide_hint':
      prompt = `对于问题“${question}”，请提供一个简短的提示或一些如何解决它的想法。`
      break
    case 'review_answer':
      prompt = `问题：“${question}”\n回答：“${answer}”\n请对这个回答提供详细的评论，包括改进建议。`
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
      original_text: text,
      ai_question: question || (action === 'generate_question' ? aiResponse : null),
      user_answer: answer,
      ai_feedback: action === 'review_answer' ? aiResponse : null,
    })

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

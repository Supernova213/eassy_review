import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"
import type { User } from 'https://esm.sh/@supabase/supabase-js@2'

// 验证环境变量
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL 环境变量未设置')
}

if (!SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY 环境变量未设置')
}

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY 环境变量未设置')
}

// 初始化 Google Generative AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// 初始化 Supabase 客户端
const supabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// 输入验证函数
function validateInput(req: Request, requiredFields: string[]) {
  // CORS 预检请求处理
  if (req.method === 'OPTIONS') {
    return { isValid: true, data: null }
  }

  return {
    isValid: true,
    data: null // 将在后面解析JSON
  }
}

// 获取用户信息函数
async function getUserFromAuthHeader(req: Request): Promise<User | null> {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return null
    }

    // 解析 JWT token (简化版本，实际应该使用适当的JWT验证)
    const token = authHeader.replace('Bearer ', '')
    
    // 这里需要根据实际认证方案来验证用户
    // 暂时返回一个示例实现
    try {
      const { data: { user }, error } = await supabaseClient.auth.getUser(token)
      if (error || !user) {
        console.error('用户认证失败:', error)
        return null
      }
      return user
    } catch (error) {
      console.error('认证过程中发生错误:', error)
      return null
    }
  } catch (error) {
    console.error('获取用户信息时发生错误:', error)
    return null
  }
}

// 统一错误响应函数
function createErrorResponse(message: string, status: number = 500, details?: any) {
  const error = {
    error: message,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  }
  
  return new Response(JSON.stringify(error), {
    status,
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://supernova213.github.io",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info"
    }
  })
}

// 成功响应函数
function createSuccessResponse(data: any) {
  return new Response(JSON.stringify({
    data,
    timestamp: new Date().toISOString()
  }), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://supernova213.github.io",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info"
    }
  })
}

// 每日使用限制检查函数
async function checkDailyUsageLimit(userId: string): Promise<{ allowed: boolean, remaining: number }> {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const MAX_DAILY_USES = 3 // 最大每日使用次数

  try {
    // 首先尝试获取现有记录
    const { data: usageData, error: fetchError } = await supabaseClient
      .from('daily_usage')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 表示未找到行，这是正常的
      throw new Error(`获取使用记录失败: ${fetchError.message}`)
    }

    if (usageData) {
      const lastUsedDate = new Date(usageData.last_used_at).toISOString().slice(0, 10)
      
      if (lastUsedDate === today) {
        // 今天已经使用过
        if (usageData.usage_count >= MAX_DAILY_USES) {
          return { allowed: false, remaining: 0 }
        }
        // 增加使用计数
        const { error: updateError } = await supabaseClient
          .from('daily_usage')
          .update({ 
            usage_count: usageData.usage_count + 1, 
            last_used_at: new Date().toISOString() 
          })
          .eq('id', usageData.id)

        if (updateError) {
          throw new Error(`更新使用记录失败: ${updateError.message}`)
        }
        
        return { allowed: true, remaining: MAX_DAILY_USES - usageData.usage_count - 1 }
      } else {
        // 新的一天，重置使用计数
        const { error: updateError } = await supabaseClient
          .from('daily_usage')
          .update({ 
            usage_count: 1, 
            last_used_at: new Date().toISOString() 
          })
          .eq('id', usageData.id)

        if (updateError) {
          throw new Error(`重置使用记录失败: ${updateError.message}`)
        }
        
        return { allowed: true, remaining: MAX_DAILY_USES - 1 }
      }
    } else {
      // 创建新的使用记录
      const { error: insertError } = await supabaseClient
        .from('daily_usage')
        .insert({ 
          user_id: userId, 
          usage_count: 1, 
          last_used_at: new Date().toISOString() 
        })

      if (insertError) {
        throw new Error(`创建使用记录失败: ${insertError.message}`)
      }
      
      return { allowed: true, remaining: MAX_DAILY_USES - 1 }
    }
  } catch (error) {
    console.error('检查每日使用限制时发生错误:', error)
    // 在错误情况下，允许继续使用但记录错误
    return { allowed: true, remaining: MAX_DAILY_USES - 1 }
  }
}

// AI 生成函数
async function generateAIResponse(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    return await response.text()
  } catch (error) {
    console.error('AI 生成错误:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    throw new Error(`AI 服务暂时不可用: ${errorMessage}`)
  }
}

// 数据库记录函数
async function recordInteraction(data: {
  userId: string,
  originalText: string,
  aiQuestion: string,
  userAnswer: string,
  aiFeedback: string
}) {
  try {
    const { error } = await supabaseClient
      .from('essay_reviews')
      .insert({
        user_id: data.userId,
        original_text: data.originalText,
        ai_question: data.aiQuestion,
        user_answer: data.userAnswer,
        ai_feedback: data.aiFeedback,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('记录交互失败:', error)
      // 不抛出错误，避免影响主要功能
    }
  } catch (error) {
    console.error('记录交互时发生错误:', error)
  }
}

serve(async (req: Request) => {
  // CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info"
      }
    })
  }

  console.log(`[${new Date().toISOString()}] 收到请求: ${req.method} ${req.url}`)

  try {
    // 验证请求方法
    if (req.method !== 'POST') {
      return createErrorResponse('仅支持 POST 请求', 405)
    }

    // 解析请求体
    let requestData
    try {
      requestData = await req.json()
    } catch (error) {
      return createErrorResponse('无效的 JSON 格式', 400)
    }

    const { action, text, material, question, answer } = requestData

    // 验证必需字段
    if (!action) {
      return createErrorResponse('缺少必需参数: action', 400)
    }

    // 获取用户信息
    const user = await getUserFromAuthHeader(req)
    if (!user) {
      return createErrorResponse('未授权访问', 401)
    }

    // 检查每日使用限制
    const usageCheck = await checkDailyUsageLimit(user.id)
    if (!usageCheck.allowed) {
      return createErrorResponse('已达到每日使用限制（3次）', 429)
    }

    // 生成提示词
    let prompt = ""
    let originalText = ""
    let aiQuestion = ""
    let userAnswer = ""
    let aiFeedback = ""

    switch (action) {
      case 'generate_material':
        prompt = `你是一位申论考试命题专家。请围绕当前的一个社会热点（例如：数字经济、乡村振兴、基层治理、生态文明建设等），生成一份长度在800-1000字左右的申论材料。要求材料内容翔实，案例与数据结合，观点鲜明，逻辑清晰，能够引出深刻的申论主题。`
        break

      case 'generate_question':
        if (!text) {
          return createErrorResponse('generate_question 操作需要提供 text 参数', 400)
        }
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
---`
        originalText = text
        break

      case 'review_answer':
        if (!material || !question || !answer) {
          return createErrorResponse('review_answer 操作需要提供 material、question 和 answer 参数', 400)
        }
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
*   **评定等级**：[在"优秀"、"良好"、"中等"、"待改进"中选择一个]
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

---`
        originalText = material
        aiQuestion = question
        userAnswer = answer
        break

      default:
        return createErrorResponse('无效的操作类型', 400)
    }

    // 生成AI响应
    console.log(`[${new Date().toISOString()}] 开始AI生成，操作为: ${action}`)
    const aiResponse = await generateAIResponse(prompt)
    console.log(`[${new Date().toISOString()}] AI生成完成`)

    // 根据操作类型设置AI反馈
    if (action === 'review_answer') {
      aiFeedback = aiResponse
    }

    // 记录交互到数据库
    await recordInteraction({
      userId: user.id,
      originalText,
      aiQuestion: aiQuestion || aiResponse, // generate_material 和 generate_question 使用 aiResponse
      userAnswer,
      aiFeedback
    })

    // 返回成功响应
    return createSuccessResponse({
      response: aiResponse,
      remainingUses: usageCheck.remaining
    })

  } catch (error) {
    console.error(`[${new Date().toISOString()}] 处理请求时发生错误:`, error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    const errorType = error instanceof Error ? error.constructor.name : 'Unknown'
    return createErrorResponse('服务器内部错误', 500, {
      message: errorMessage,
      type: errorType
    })
  }
})

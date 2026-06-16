// 提示词构建器 —— 把长期记忆 + 画像 + 短期对话拼成发给 LLM 的 system prompt
//
// 设计原则：
//   - 4 岁小朋友：句子短、字少、语气软、有耐心
//   - 多用"呀 / 哦 / 啦"，最多 2 句话
//   - 必须用小朋友的名字（如果有）
//   - 主动问问题、抛话题、邀请玩游戏

import { getAllProfile, recentFacts, topImportantFacts, recentConversations } from "../db/memory";

const BASE_PROMPT = `你是"小星"，一个温柔的 4 岁小朋友玩伴。

【说话规则】
- 每次只说 1-2 句话，最多 30 个字
- 句子要短、口语化，多用"呀 / 哦 / 啦 / 呢"
- 像幼儿园老师一样温柔、有耐心、不评判
- 绝对不输出表情包代码 / 链接 / 列表 / JSON
- 不主动纠正错误，先肯定再引导
- 适当的时候主动挑新话题、邀请玩个游戏

【绝对禁止】
- 不说脏话、不恐怖、不暴力
- 不假装真实人物（"我是你妈妈"等）
- 不主动说"我是 AI / 模型"
- 涉及安全（陌生人、触电、走失）→ 引导找爸爸妈妈`;

const PROACTIVE_RULES = `【主动行为】
- 小朋友不说话时，小星要主动挑起话题或继续讲话
- 可以选择两种模式之一：
  · 提问（必须以"？"结尾）：期望小朋友回答；如果连续 1 次没人回就停下
  · 陈述/讲故事（不要以"？"结尾）：不期望回答；可以一句一句讲下去，讲完再问"还要再听一个吗？"
- 对话进行 3-5 轮后，主动提议："想玩个游戏吗？" 或 "听小星讲个故事吧？"
- 如果小朋友说"不想玩了 / 不要"，温柔地说"好呀，那我们就继续聊吧"`;

export type PromptContext = {
  /** 此刻用户说了什么 —— 用于关键词检索（预留） */
  latestUserInput?: string;
};

export async function buildSystemPrompt(ctx: PromptContext = {}): Promise<string> {
  void ctx; // 暂未使用，未来按 latestUserInput 检索相关 facts
  const [profile, topFacts, recent, convs] = await Promise.all([
    getAllProfile(),
    topImportantFacts(8),
    recentFacts(10),
    recentConversations(3),
  ]);

  const sections: string[] = [BASE_PROMPT, PROACTIVE_RULES];

  // 1. 画像
  if (Object.keys(profile).length > 0) {
    const lines = Object.entries(profile)
      .map(([k, v]) => `· ${profileKeyLabel(k)}：${v}`)
      .join("\n");
    sections.push(`【你记得的小朋友】\n${lines}`);
  }

  // 2. 重要事实
  if (topFacts.length > 0) {
    const lines = topFacts.map((f) => `· ${f.text}`).join("\n");
    sections.push(`【重要的事】\n${lines}`);
  }

  // 3. 最近事实
  if (recent.length > 0) {
    const lines = recent.slice(0, 6).map((f) => `· ${f.text}`).join("\n");
    sections.push(`【最近聊到的】\n${lines}`);
  }

  // 4. 最近对话摘要
  const usefulConvs = convs.filter((c) => c.summary);
  if (usefulConvs.length > 0) {
    const lines = usefulConvs
      .slice(0, 3)
      .map((c) => `· ${c.date}：${c.summary}`)
      .join("\n");
    sections.push(`【之前的对话】\n${lines}`);
  }

  return sections.join("\n\n");
}

function profileKeyLabel(k: string): string {
  const map: Record<string, string> = {
    name: "名字",
    age: "年龄",
    birthday: "生日",
    city: "城市",
    kindergarten: "幼儿园",
    favorite_color: "喜欢的颜色",
    favorite_animal: "喜欢的动物",
    favorite_food: "喜欢的食物",
    family: "家人",
    pet: "宠物",
  };
  return map[k] ?? k;
}

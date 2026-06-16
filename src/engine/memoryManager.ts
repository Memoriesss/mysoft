// 记忆管理器 —— 让 LLM 当"记忆管理员"
//
// 职责：
//   1. 从对话里抽取值得长期记住的事实
//   2. 把长对话压缩成一句话摘要
//   3. 检测"是否应该更新画像"（如名字、年龄）

import { chatJson } from "../utils/llm";
import {
  bulkAddFacts,
  endConversation,
  setProfileValue,
  type Fact,
  type Conversation,
} from "../db/memory";

type ExtractedFact = {
  text: string;
  tags: string[];
  category: Fact["category"];
  importance: 1 | 2 | 3;
};

type ExtractResult = {
  facts: ExtractedFact[];
  summary: string;
  /** 检测到用户自报家门：例如 "我叫小明" / "我 4 岁了" */
  profile_updates?: { key: string; value: string }[];
};

const EXTRACT_SYS = `你是"小星"机器人的记忆管理员。你的工作是从小朋友和机器人的对话里，找出值得**长期**记住的事实。

规则：
- 只记客观、具体、可复述的信息（不要记"宝宝今天心情好"这种没信息量的话）
- 偏好类（喜欢/讨厌什么）：importance = 2
- 事件类（去过哪里、做过什么、今天发生啥）：importance = 1
- 关键信息（名字、年龄、生日、家庭成员、宠物名字）：importance = 3
- 每条事实一句话、不超过 30 字
- tags 用 1-3 个中文关键词（如 ["动物", "事件"]）
- 如果对话里小朋友主动说了自己的信息（"我叫..."、"我今年..."），写入 profile_updates

输出 JSON：
{
  "facts": [{ "text": "...", "tags": [...], "category": "preference|event|person|milestone|other", "importance": 1-3 }],
  "summary": "用一句话总结这次对话（不超过 30 字）",
  "profile_updates": [{"key":"name","value":"小明"}] // 没有就空数组
}

没有值得记的就返回 {"facts": [], "summary": "今天随便聊了几句。", "profile_updates": []}`;

/** 从一段对话中提取事实 + 摘要 */
export async function extractMemories(messages: { from: "bot" | "kid"; text: string }[]): Promise<ExtractResult> {
  const transcript = messages
    .map((m) => `${m.from === "bot" ? "小星" : "小朋友"}：${m.text}`)
    .join("\n");

  const result = await chatJson<Partial<ExtractResult>>(
    [
      { role: "system", content: EXTRACT_SYS },
      { role: "user", content: `请从下面这段对话提取记忆：\n\n${transcript}` },
    ],
    { temperature: 0.3, maxTokens: 600 },
  );

  return {
    facts: Array.isArray(result.facts) ? result.facts : [],
    summary: result.summary ?? "",
    profile_updates: Array.isArray(result.profile_updates) ? result.profile_updates : [],
  };
}

/** 把提取结果落库：写 facts + 更新 profile + 结束 conversation */
export async function commitMemories(convId: number, extracted: ExtractResult) {
  // 1. 写事实（去重在 addFact 内部完成）
  if (extracted.facts.length > 0) {
    const items: Array<Omit<Fact, "id" | "createdAt" | "fingerprint">> = extracted.facts.map((f) => ({
      text: f.text,
      tags: f.tags ?? [],
      category: f.category ?? "other",
      importance: f.importance ?? 1,
      ts: Date.now(),
    }));
    await bulkAddFacts(items);
  }

  // 2. 更新画像
  if (extracted.profile_updates && extracted.profile_updates.length > 0) {
    for (const u of extracted.profile_updates) {
      if (u.key && u.value) {
        await setProfileValue(u.key, u.value);
      }
    }
  }

  // 3. 关闭对话
  await endConversation(convId, extracted.summary);
}

/** 简单的兜底：如果 LLM 抽不出东西，就不写入（不强行制造噪音） */
export async function rememberIfWorth(convId: number, messages: Conversation["messages"]) {
  if (messages.length < 2) return null;
  try {
    const extracted = await extractMemories(messages);
    await commitMemories(convId, extracted);
    return extracted;
  } catch (e) {
    console.debug("[memory] extract failed", e);
    return null;
  }
}

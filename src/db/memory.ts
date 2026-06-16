// 长期记忆数据库 —— Dexie 封装 IndexedDB
// 全部数据存在用户浏览器本地，不上传任何后端
//
// 三层结构：
//   1. profile    — 永久画像（名字、生日、家庭）
//   2. facts      — 长期事实（喜欢/害怕/事件），带 tags 用于检索
//   3. conversations — 每日对话摘要 + 完整原文（短期流水，1-2 周后压缩）

import Dexie, { type Table } from "dexie";

export type ProfileRow = { key: string; value: string; updatedAt: number };

export type Fact = {
  id?: number;
  text: string;
  tags: string[]; // 用于检索的中文标签
  category: "preference" | "event" | "person" | "milestone" | "other";
  importance: 1 | 2 | 3; // 1 普通 / 2 重要 / 3 关键
  ts: number; // 发生时间
  createdAt: number; // 入库时间
  /** 用于去重：相同 fingerprint 的事实会被合并 */
  fingerprint: string;
};

export type Conversation = {
  id?: number;
  date: string; // YYYY-MM-DD
  startedAt: number;
  endedAt?: number;
  /** 自动生成的当日摘要 */
  summary?: string;
  /** 完整对话流 */
  messages: { from: "bot" | "kid"; text: string; ts: number }[];
};

class KidBotDB extends Dexie {
  profile!: Table<ProfileRow, string>;
  facts!: Table<Fact, number>;
  conversations!: Table<Conversation, number>;

  constructor() {
    super("kidbot-memory");
    this.version(1).stores({
      profile: "key, updatedAt",
      facts: "++id, fingerprint, category, ts, *tags",
      conversations: "++id, date, startedAt",
    });
  }
}

export const db = new KidBotDB();

/* ---------------- Profile ---------------- */

export async function getProfileValue(key: string): Promise<string | undefined> {
  const row = await db.profile.get(key);
  return row?.value;
}

export async function setProfileValue(key: string, value: string) {
  await db.profile.put({ key, value, updatedAt: Date.now() });
}

export async function getAllProfile(): Promise<Record<string, string>> {
  const rows = await db.profile.toArray();
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

/* ---------------- Facts ---------------- */

/** 简单指纹：去掉标点 + 小写 + 取前 24 字符（够用） */
export function fingerprint(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, "")
    .slice(0, 24);
}

export async function addFact(fact: Omit<Fact, "id" | "createdAt" | "fingerprint">) {
  const fp = fingerprint(fact.text);
  // 同指纹 → 跳过（不重复入库）
  const existed = await db.facts.where("fingerprint").equals(fp).first();
  if (existed) return existed.id;
  return db.facts.add({ ...fact, fingerprint: fp, createdAt: Date.now() });
}

export async function bulkAddFacts(items: Array<Omit<Fact, "id" | "createdAt" | "fingerprint">>) {
  const ids: number[] = [];
  for (const f of items) {
    const id = await addFact(f);
    if (id) ids.push(id);
  }
  return ids;
}

/** 按 tag 检索最近的事实 */
export async function findFactsByTag(tag: string, limit = 10): Promise<Fact[]> {
  return db.facts
    .where("tags")
    .equals(tag)
    .reverse()
    .sortBy("ts")
    .then((rows) => rows.slice(0, limit));
}

/** 按关键字模糊匹配（中文按 substring 即可） */
export async function searchFacts(q: string, limit = 10): Promise<Fact[]> {
  const all = await db.facts.orderBy("ts").reverse().limit(200).toArray();
  const norm = q.toLowerCase().trim();
  if (!norm) return all.slice(0, limit);
  return all
    .filter((f) => f.text.toLowerCase().includes(norm) || f.tags.some((t) => t.toLowerCase().includes(norm)))
    .slice(0, limit);
}

/** 取最近 N 条事实（按时间） */
export async function recentFacts(limit = 20): Promise<Fact[]> {
  return db.facts.orderBy("ts").reverse().limit(limit).toArray();
}

/** 取最重要的 N 条 */
export async function topImportantFacts(limit = 10): Promise<Fact[]> {
  const all = await db.facts.toArray();
  return all.sort((a, b) => b.importance - a.importance || b.ts - a.ts).slice(0, limit);
}

/* ---------------- Conversations ---------------- */

export async function startConversation(): Promise<number> {
  return db.conversations.add({
    date: new Date().toISOString().slice(0, 10),
    startedAt: Date.now(),
    messages: [],
  });
}

export async function appendMessage(convId: number, msg: { from: "bot" | "kid"; text: string; ts: number }) {
  const c = await db.conversations.get(convId);
  if (!c) return;
  c.messages.push(msg);
  await db.conversations.put(c);
}

export async function endConversation(convId: number, summary?: string) {
  const c = await db.conversations.get(convId);
  if (!c) return;
  c.endedAt = Date.now();
  if (summary) c.summary = summary;
  await db.conversations.put(c);
}

export async function recentConversations(limit = 5): Promise<Conversation[]> {
  return db.conversations.orderBy("startedAt").reverse().limit(limit).toArray();
}

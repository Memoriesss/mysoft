# 童语星球 · KidBot

AI 主动陪聊应用，目标用户 4 岁左右儿童。最终形态为**纯语音机器人**（VUI），本仓库为**文字测试版**。

## ✨ 特性

- **MiniMax-M3 大脑**（可切换任意 OpenAI 兼容 API）
- **三层长期记忆**（IndexedDB 本地存储，零上传）
  - 画像：名字、年龄、家庭、喜好（永久）
  - 事实：偏好/事件/关键信息（带标签去重）
  - 对话流水：每日摘要 + 完整原文
- **自动记忆机制**：LLM 静默抽取事实 + 总结
- **剧本兜底**：未配 LLM 时使用本地状态机
- **TTS 朗读**：浏览器内置 SpeechSynthesis

## 🚀 快速开始

```bash
pnpm install
cp .env.example .env
# 编辑 .env 填入 VITE_LLM_KEY=sk-xxx
pnpm dev   # http://localhost:5173
```

## 📁 项目结构

```
src/
├── db/memory.ts            # Dexie 长期记忆数据库
├── engine/
│   ├── dialogueEngine.ts   # 剧本状态机（兜底用）
│   ├── memoryManager.ts    # LLM 记忆提取
│   ├── promptBuilder.ts    # 拼接 system prompt
│   ├── stories.ts          # 故事库
│   └── topics.ts           # 6 大主题剧本
├── games/                  # 文字小游戏
├── pages/                  # 页面（Welcome / Chat / Story / Bye）
├── components/             # UI 组件（Bubble / ParentPanel）
├── store/useSettings.ts    # 家长设置（Zustand）
└── utils/
    ├── llm.ts              # OpenAI 兼容 LLM 客户端
    └── tts.ts              # SpeechSynthesis 封装
```

## 🧠 记忆系统

每次对话**静默 1 分钟**或**关闭页面**时，自动调用 LLM 提取事实 + 写摘要：

```ts
// 提示词见 src/engine/memoryManager.ts
{
  facts: [
    { text: "小明家里养了一只猫叫花花", tags: ["宠物", "猫"], importance: 3 },
    { text: "小明怕打雷", tags: ["情绪", "害怕"], importance: 2 }
  ],
  summary: "今天聊了家里的宠物和害怕的事。",
  profile_updates: [{ key: "name", value: "小明" }]
}
```

数据**全部本地存储**（IndexedDB），不发送到任何后端。家长可在「家长」面板一键清空。

## 🔌 LLM 兼容性

只要是 OpenAI `/v1/chat/completions` 协议的都能用，`.env` 里换 base URL + key 即可：

```bash
VITE_LLM_BASE_URL=https://api.deepseek.com/v1
VITE_LLM_KEY=sk-xxx
VITE_LLM_MODEL=deepseek-chat
```

## 🎮 文字小游戏

- 猜动物 — 我说提示，你猜名字
- 颜色问答 — 我问颜色 / 物品，你回答
- 数到几 — 我数 1、2、3，你猜一共几个

## 📜 脚本

```bash
pnpm dev      # 开发
pnpm build    # 生产构建
pnpm check    # TypeScript 类型检查
pnpm lint     # ESLint
```

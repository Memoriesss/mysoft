// Anthropic 兼容的 LLM 客户端
// MiniMax M3 用的是 Anthropic Messages API 协议（不是 OpenAI Chat Completions）
// 文档：https://platform.minimaxi.com/docs/token-plan/quickstart
//
// 协议要点：
//   - 端点：POST {baseUrl}/v1/messages
//   - 鉴权：x-api-key 头（不是 Authorization: Bearer）
//   - 必带：anthropic-version: 2023-06-01
//   - system 是独立字段，不在 messages 数组里
//   - 响应里有 thinking / text 多种 block，要过滤

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** 让模型返回 JSON（用提示词约束，因为 Anthropic 没有 response_format） */
  jsonMode?: boolean;
};

type ApiConfig = {
  baseUrl: string;
  key: string;
  model: string;
};

function readConfig(): ApiConfig {
  const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
  // dev 模式走 Vite 代理（避免浏览器 CORS），生产模式用 .env 里的真地址
  const isDev = Boolean((import.meta as unknown as { env: { DEV?: boolean } }).env.DEV);
  const baseUrl = isDev
    ? "/llm"
    : (env.VITE_LLM_BASE_URL ?? "https://api.minimaxi.com/anthropic");
  return {
    baseUrl,
    key: env.VITE_LLM_KEY ?? "",
    model: env.VITE_LLM_MODEL ?? "MiniMax-M3",
  };
}

export function isLlmConfigured(): boolean {
  return Boolean(readConfig().key);
}

type AnthropicResponse = {
  content?: Array<
    | { type: "text"; text: string }
    | { type: "thinking"; thinking: string }
    | { type: string; text?: string; thinking?: string }
  >;
  stop_reason?: string;
};

export async function chat(
  messages: ChatMessage[],
  systemOrOpts: string | ChatOptions = {},
  maybeOpts: ChatOptions = {},
): Promise<string> {
  let system: string;
  let opts: ChatOptions;
  if (typeof systemOrOpts === "string") {
    system = systemOrOpts;
    opts = maybeOpts;
  } else {
    system = "";
    opts = systemOrOpts;
  }

  const cfg = readConfig();
  if (!cfg.key) {
    throw new Error("未配置 VITE_LLM_KEY，请在 .env 里填入 MiniMax 的 API Key");
  }

  // JSON 模式：在 system 末尾追加硬约束
  if (opts.jsonMode && system && !/JSON/.test(system)) {
    system += "\n\n【输出约束】只输出合法 JSON 对象，不要 markdown 围栏，不要任何解释。";
  }

  const body = {
    model: opts.model ?? cfg.model,
    system,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 512,
  };

  // 🔍 调试：打印 LLM 输入
  console.log("[LLM] → request", {
    url: `${cfg.baseUrl.replace(/\/$/, "")}/v1/messages`,
    model: body.model,
    temperature: body.temperature,
    max_tokens: body.max_tokens,
    system: body.system,
    messages: body.messages,
  });

  const url = `${cfg.baseUrl.replace(/\/$/, "")}/v1/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cfg.key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[LLM] ✗ error", res.status, text.slice(0, 300));
    throw new Error(`LLM 请求失败 ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as AnthropicResponse;
  // 只取 text block，跳过 thinking 等
  const text = (data.content ?? [])
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  // 🔍 调试：打印 LLM 输出
  console.log("[LLM] ← reply", { text, stop_reason: data.stop_reason, raw: data });

  return text;
}

/** 让模型输出 JSON 对象（带容错：去掉 markdown 围栏） */
export async function chatJson<T = unknown>(
  messages: ChatMessage[],
  systemOrOpts: string | ChatOptions = {},
  maybeOpts: ChatOptions = {},
): Promise<T> {
  const opts: ChatOptions = typeof systemOrOpts === "string"
    ? { ...maybeOpts, jsonMode: true }
    : { ...systemOrOpts, jsonMode: true };
  const raw = await chat(messages, systemOrOpts, opts);
  return parseJsonLoose(raw) as T;
}

function parseJsonLoose(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        /* fallthrough */
      }
    }
    // 尝试找数组
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket >= 0 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.slice(firstBracket, lastBracket + 1));
      } catch {
        /* fallthrough */
      }
    }
    return { _raw: text };
  }
}

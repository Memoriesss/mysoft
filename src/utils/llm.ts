// OpenAI 兼容的 LLM 客户端
// MiniMax-M3、DeepSeek、Qwen、Doubao、OpenAI 等都遵循相同的 chat completions 协议
// 只需在 .env 里配置 VITE_LLM_BASE_URL 和 VITE_LLM_KEY 即可切换

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** 让模型返回 JSON */
  jsonMode?: boolean;
};

type ApiConfig = {
  baseUrl: string;
  key: string;
  model: string;
};

function readConfig(): ApiConfig {
  const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
  return {
    baseUrl: env.VITE_LLM_BASE_URL ?? "https://api.stepfun.com/v1",
    key: env.VITE_LLM_KEY ?? "",
    model: env.VITE_LLM_MODEL ?? "step-2-16k",
  };
}

export function isLlmConfigured(): boolean {
  return Boolean(readConfig().key);
}

export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const cfg = readConfig();
  if (!cfg.key) {
    throw new Error("未配置 VITE_LLM_KEY，请在 .env 里填入 MiniMax-M3 的 API Key");
  }
  const body: Record<string, unknown> = {
    model: opts.model ?? cfg.model,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 512,
    stream: false,
  };
  if (opts.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM 请求失败 ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  return content.trim();
}

/** 让模型输出 JSON 对象（带容错：去掉 markdown 围栏） */
export async function chatJson<T = unknown>(messages: ChatMessage[], opts: ChatOptions = {}): Promise<T> {
  const raw = await chat(messages, { ...opts, jsonMode: true });
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
    // 最后兜底：返回原文
    return { _raw: text };
  }
}

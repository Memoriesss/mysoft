import { useEffect, useRef, useState } from "react";
import Bubble from "../components/Bubble";
import ParentPanel from "../components/ParentPanel";
import { speak, stopSpeak, warmupTts } from "../utils/tts";
import { useSettings } from "../store/useSettings";
import { chat, isLlmConfigured, type ChatMessage } from "../utils/llm";
import { buildSystemPrompt } from "../engine/promptBuilder";
import { rememberIfWorth } from "../engine/memoryManager";
import { appendMessage, startConversation } from "../db/memory";
import { reply as scriptedReply, start as scriptedStart, idlePrompt } from "../engine/dialogueEngine";
import type { DialogueState } from "../engine/dialogueEngine";
import { pickStory } from "../engine/stories";

type ChatMsg = { from: "bot" | "kid"; text: string };
type Page = "chat" | "game" | "story";

type Props = {
  go: (p: Page, opts?: { gameId?: string }) => void;
  onTimeUp: () => void;
};

const IDLE_MS = 12000;
const REMEMBER_AFTER_MS = 60_000; // 静默 1 分钟或对话结束就保存记忆
const MAX_HISTORY_FOR_LLM = 16; // 每次发 LLM 时携带的最近消息轮数

export default function ChatPage({ go, onTimeUp }: Props) {
  const { ttsEnabled, voiceRate, toggleTts, addUsed, rolloverIfNewDay, dailyLimitMin, usedSeconds, resetUsed } = useSettings();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [showParent, setShowParent] = useState(false);
  const [draft, setDraft] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [receivedPing, setReceivedPing] = useState(false);
  const [llmOn, setLlmOn] = useState(isLlmConfigured());
  const [lastTs, setLastTs] = useState<number>(Date.now());

  const listRef = useRef<HTMLDivElement>(null);
  const convIdRef = useRef<number | null>(null);
  const scriptedDlogRef = useRef<DialogueState | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const rememberTimerRef = useRef<number | null>(null);

  /* ---------------- 启动 ---------------- */
  useEffect(() => {
    warmupTts();
    void initConversation();
    return () => {
      // 离开页面时尝试保存记忆
      void saveMemoryNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initConversation() {
    if (llmOn) {
      try {
        convIdRef.current = await startConversation();
        const sysPrompt = await buildSystemPrompt();
        const greeting = await chat(
          [{ role: "user", content: "小朋友刚刚打开 App，请你先用 1 句温柔的话打个招呼，并主动抛一个话题（动物/颜色/食物/家庭/情绪/想象里选一个）。" }],
          sysPrompt,
          { temperature: 0.85, maxTokens: 80 },
        );
        pushBot(greeting || "你好呀！我是小星～", false);
      } catch (e) {
        console.error("[chat] init failed", e);
        // 失败 → 走剧本模式
        setLlmOn(false);
        fallbackToScripted();
      }
    } else {
      fallbackToScripted();
    }
  }

  function fallbackToScripted() {
    const { state, result } = scriptedStart();
    scriptedDlogRef.current = state;
    pushBot(result.botText, false);
  }

  /* ---------------- 时长累计 ---------------- */
  useEffect(() => {
    rolloverIfNewDay();
    const id = window.setInterval(() => {
      addUsed(1);
      // 用 getState() 读最新值，避免闭包捕获过期数据
      const s = useSettings.getState();
      const total = s.dailyLimitMin * 60;
      if (s.usedSeconds + 1 >= total) {
        onTimeUp();
      }
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- 自动滚动 ---------------- */
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, isThinking]);

  /* ---------------- 沉默主动说话 ---------------- */
  useEffect(() => {
    armIdle();
    return clearIdle;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  function clearIdle() {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }
  function armIdle() {
    clearIdle();
    idleTimerRef.current = window.setTimeout(() => {
      onIdle();
    }, IDLE_MS);
  }

  async function onIdle() {
    if (isThinking) return;
    if (llmOn) {
      try {
        const sysPrompt = await buildSystemPrompt();
        const reply = await chat(
          [
            ...buildHistorySlice(),
            { role: "user", content: "（小朋友没说话，请你主动挑一个新话题，或者邀请玩个游戏、听个故事。1 句话。）" },
          ],
          sysPrompt,
          { temperature: 0.9, maxTokens: 80 },
        );
        pushBot(reply, true);
      } catch (e) {
        console.debug("[chat] idle llm failed", e);
      }
    } else if (scriptedDlogRef.current) {
      const result = idlePrompt(scriptedDlogRef.current);
      scriptedDlogRef.current = { ...scriptedDlogRef.current, topicId: result.topicId, nodeId: result.nodeId, turns: 0 };
      pushBot(result.botText, false);
    }
  }

  /* ---------------- 记忆保存（静默触发） ---------------- */
  useEffect(() => {
    if (!llmOn || convIdRef.current == null) return;
    if (rememberTimerRef.current !== null) window.clearTimeout(rememberTimerRef.current);
    rememberTimerRef.current = window.setTimeout(() => {
      void saveMemoryNow();
    }, REMEMBER_AFTER_MS);
    return () => {
      if (rememberTimerRef.current !== null) window.clearTimeout(rememberTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTs, messages.length]);

  async function saveMemoryNow() {
    if (!llmOn || convIdRef.current == null) return;
    if (messages.length < 2) return;
    setIsSavingMemory(true);
    try {
      await rememberIfWorth(convIdRef.current, messages.map((m) => ({ ...m, ts: Date.now() })));
    } catch (e) {
      console.debug("[memory] save failed", e);
    } finally {
      setIsSavingMemory(false);
    }
  }

  /* ---------------- 工具 ---------------- */
  function buildHistorySlice(): ChatMessage[] {
    const slice = messages.slice(-MAX_HISTORY_FOR_LLM);
    return slice.map((m) => ({
      role: m.from === "bot" ? "assistant" : "user",
      content: m.text,
    }));
  }

  function pushBot(text: string, doSpeak: boolean) {
    if (!text) return;
    setIsThinking(false);
    const clean = text.replace(/^["'「」]+|["'「」]+$/g, "").trim();
    setMessages((m) => [...m, { from: "bot", text: clean }]);
    setLastTs(Date.now());
    if (convIdRef.current != null) {
      void appendMessage(convIdRef.current, { from: "bot", text: clean, ts: Date.now() });
    }
    if (doSpeak) {
      speak(clean, { enabled: ttsEnabled, rate: voiceRate });
    }
    armIdle();
  }

  function showReceivedPing() {
    setReceivedPing(true);
    window.setTimeout(() => setReceivedPing(false), 1500);
  }

  /* ---------------- 用户输入 ---------------- */
  async function handleUser(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "kid", text: text.trim() }]);
    setLastTs(Date.now());
    if (convIdRef.current != null) {
      void appendMessage(convIdRef.current, { from: "kid", text: text.trim(), ts: Date.now() });
    }
    showReceivedPing();
    armIdle();
    setIsThinking(true);

    if (llmOn) {
      try {
        const sysPrompt = await buildSystemPrompt();
        const reply = await chat(
          [
            ...buildHistorySlice(),
            { role: "user", content: text.trim() },
          ],
          sysPrompt,
          { temperature: 0.85, maxTokens: 100 },
        );
        pushBot(reply || "嗯嗯～", true);
      } catch (e) {
        console.error("[chat] llm failed", e);
        // 兜底：走剧本
        fallbackReply(text);
      }
    } else {
      fallbackReply(text);
    }
  }

  function fallbackReply(text: string) {
    if (!scriptedDlogRef.current) {
      const { state } = scriptedStart();
      scriptedDlogRef.current = state;
    }
    const { state, result } = scriptedReply(scriptedDlogRef.current, text);
    scriptedDlogRef.current = state;
    pushBot(result.botText, false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = draft.trim();
    if (!t) return;
    setDraft("");
    void handleUser(t);
  }

  function startVoicePlaceholder() {
    setIsRecording(true);
    window.setTimeout(() => {
      setIsRecording(false);
      void handleUser("🎤 嗯嗯");
    }, 1500);
  }

  /* ---------------- 主动指令识别（"玩个游戏" / "听故事"） —— 占位 ---------------- */
  useEffect(() => {
    // 未来：识别 LLM 输出里的 "[INVITE:game]" / "[INVITE:story]" 等指令，自动跳转
    // 当前：用户点标题栏的 🎮 / 📖 按钮手动进入
  }, [messages, llmOn]);

  return (
    <div className="h-full w-full flex flex-col bg-[#FAF7F0]">
      {/* 顶部 */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5DFD3] bg-white">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${llmOn ? "bg-[#4F6BED]" : "bg-[#9A9387]"}`} />
          <span className="text-sm font-medium text-[#2D2A26]">童语星球 · 小星</span>
          {isSavingMemory && (
            <span className="text-xs text-[#9A9387] animate-kb-fade-in">· 正在记笔记…</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => go("game", { gameId: "emoji" })}
            className="text-xs text-[#6F6A60] hover:text-[#2D2A26]"
            title="玩个游戏"
          >
            🎮 游戏
          </button>
          <button
            type="button"
            onClick={() => {
              const s = pickStory();
              go("story", { gameId: s.id });
            }}
            className="text-xs text-[#6F6A60] hover:text-[#2D2A26]"
            title="听个故事"
          >
            📖 故事
          </button>
          <button
            type="button"
            onClick={toggleTts}
            className="text-xs text-[#6F6A60] hover:text-[#2D2A26]"
            aria-label="切换小星语音"
            title={ttsEnabled ? "语音已开启，点一下关闭" : "语音已关闭，点一下开启"}
          >
            {ttsEnabled ? "🔊 语音" : "🔇 静音"}
          </button>
          <button
            type="button"
            onClick={() => setShowParent(true)}
            className="text-xs text-[#6F6A60] hover:text-[#2D2A26]"
          >
            家长
          </button>
        </div>
      </header>

      {/* 对话列表 */}
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {messages.map((m, i) => (
            <Bubble key={i} from={m.from} text={m.text} />
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="kb-bubble-bot flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9A9387] animate-kb-typing" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#9A9387] animate-kb-typing" style={{ animationDelay: "120ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#9A9387] animate-kb-typing" style={{ animationDelay: "240ms" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 输入区 */}
      <div className="border-t border-[#E5DFD3] bg-white">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
            <button
              type="button"
              onClick={startVoicePlaceholder}
              disabled={isRecording}
              className={`kb-btn-ghost px-2.5 ${isRecording ? "animate-kb-blink" : ""}`}
              title="按着说一句话（占位，未来接 STT）"
              aria-label="按着说一句话"
            >
              🎤
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={llmOn ? "跟小星说点什么…" : "未配置 LLM，使用本地剧本模式"}
                className="kb-input"
                disabled={isThinking}
              />
              {receivedPing && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#4F6BED] animate-kb-fade-in" />
              )}
            </div>
            <button type="submit" disabled={!draft.trim() || isThinking} className="kb-btn">发送</button>
          </form>
        </div>
      </div>

      <ParentPanel
        open={showParent}
        onClose={() => setShowParent(false)}
        onClearHistory={() => {
          stopSpeak();
          setMessages([]);
          resetUsed();
          void saveMemoryNow();
        }}
      />
    </div>
  );
}

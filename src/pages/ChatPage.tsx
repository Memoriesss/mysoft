import { useEffect, useRef, useState } from "react";
import Bubble from "../components/Bubble";
import ParentPanel from "../components/ParentPanel";
import { speak, stopSpeak, warmupTts } from "../utils/tts";
import { useSettings } from "../store/useSettings";
import { start as dlgStart, reply as dlgReply, idlePrompt } from "../engine/dialogueEngine";
import type { DialogueState } from "../engine/dialogueEngine";
import type { ReplyOption } from "../engine/topics";
import { pickStory } from "../engine/stories";

type ChatMsg = { from: "bot" | "kid"; text: string };

type Page = "chat" | "game" | "story";
type Props = {
  go: (p: Page, opts?: { gameId?: string }) => void;
  onTimeUp: () => void;
  onClear: () => void;
};

const IDLE_MS = 9000;

export default function ChatPage({ go, onTimeUp, onClear }: Props) {
  const { ttsEnabled, voiceRate, toggleTts, addUsed, rolloverIfNewDay, dailyLimitMin, usedSeconds, resetUsed } = useSettings();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [options, setOptions] = useState<ReplyOption[] | undefined>(undefined);
  const [dlg, setDlg] = useState<DialogueState | null>(null);
  const [showOffer, setShowOffer] = useState<null | "game" | "story">(null);
  const [showParent, setShowParent] = useState(false);
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [receivedPing, setReceivedPing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<number | null>(null);
  const isThinkingRef = useRef(false);

  // 启动时小星主动打招呼
  useEffect(() => {
    warmupTts();
    const { state, result } = dlgStart();
    setDlg(state);
    setOptions(result.options);
    pushBot(result.botText, result.options, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 时长累计 + 跨天重置
  useEffect(() => {
    rolloverIfNewDay();
    const id = window.setInterval(() => {
      addUsed(1);
      // 注意：store 内部同步更新；这里读一次快照判断
      const total = dailyLimitMin * 60;
      if (usedSeconds + 1 >= total) {
        onTimeUp();
      }
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自动滚到底
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, isThinking]);

  // 沉默主动说话
  useEffect(() => {
    if (!dlg) return;
    if (showOffer) return;
    armIdle();
    return clearIdle;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dlg, showOffer, messages.length]);

  function clearIdle() {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }
  function armIdle() {
    clearIdle();
    idleTimerRef.current = window.setTimeout(() => {
      if (isThinkingRef.current) return;
      if (!dlg) return;
      const result = idlePrompt(dlg);
      if (result.nextCmd === "game") {
        setShowOffer("game");
        pushBot("好呀，我们玩个游戏吧？", undefined);
      } else if (result.nextCmd === "story") {
        setShowOffer("story");
        pushBot("想听小星讲故事吗？", undefined);
      } else {
        setDlg({ ...dlg, topicId: result.topicId, nodeId: result.nodeId, turns: 0 });
        pushBot(result.botText, result.options);
      }
    }, IDLE_MS);
  }

  function kickIdle() {
    if (dlg) armIdle();
  }

  function pushBot(text: string, opts?: ReplyOption[], doSpeak: boolean = true) {
    if (!text) return;
    setIsThinking(false);
    isThinkingRef.current = false;
    setMessages((m) => [...m, { from: "bot", text }]);
    setOptions(opts);
    if (doSpeak) {
      speak(text, { enabled: ttsEnabled, rate: voiceRate });
    }
  }

  function handleUser(text: string) {
    if (!dlg) return;
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "kid", text }]);
    setOptions(undefined);
    setIsThinking(true);
    isThinkingRef.current = true;
    showReceivedPing();
    // 模拟一点思考延迟，让对话更自然
    window.setTimeout(() => {
      const { state, result } = dlgReply(dlg, text);
      setDlg(state);
      if (result.nextCmd === "game") {
        setShowOffer("game");
        pushBot("好呀，小星选了一个好玩的游戏给你～", undefined);
      } else if (result.nextCmd === "story") {
        setShowOffer("story");
        pushBot("竖起耳朵，小星开始讲啦～", undefined);
      } else if (result.nextCmd === "switch") {
        setDlg({ ...state, topicId: result.topicId, nodeId: result.nodeId, turns: 0 });
        pushBot(result.botText, result.options);
      } else {
        pushBot(result.botText, result.options);
      }
    }, 350);
    kickIdle();
  }

  function handlePickOption(opt: ReplyOption) {
    handleUser(`${opt.icon ?? ""} ${opt.label}`.trim());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = draft.trim();
    if (!t) return;
    setDraft("");
    handleUser(t);
  }

  function showReceivedPing() {
    setReceivedPing(true);
    window.setTimeout(() => setReceivedPing(false), 1500);
  }

  function startVoicePlaceholder() {
    setIsRecording(true);
    // 占位：1.5s 后假装听到一句"嗯嗯"
    window.setTimeout(() => {
      setIsRecording(false);
      handleUser("🎤 我说：嗯嗯");
    }, 1500);
  }

  function chooseGameOffer(gameId: string) {
    setShowOffer(null);
    if (!dlg) return;
    pushBot("好呀，开始啦！", undefined);
    window.setTimeout(() => go("game", { gameId }), 400);
  }
  function acceptStoryOffer() {
    setShowOffer(null);
    if (!dlg) return;
    const story = pickStory();
    pushBot("好呀，竖起耳朵听哦～", undefined);
    window.setTimeout(() => go("story", { gameId: story.id }), 400);
  }
  function declineOffer() {
    setShowOffer(null);
    pushBot("好呀，那我们就继续聊吧！", undefined);
    kickIdle();
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#FAF7F0]">
      {/* 顶部细标题栏 */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5DFD3] bg-white">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4F6BED]" />
          <span className="text-sm font-medium text-[#2D2A26]">童语星球 · 小星</span>
        </div>
        <div className="flex items-center gap-3">
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

          {/* 主动邀请卡（游戏/故事） */}
          {showOffer && (
            <div className="bg-white border border-[#E5DFD3] rounded-2xl p-4 flex flex-col gap-3 max-w-md self-start animate-kb-fade-in">
              <div className="text-sm text-[#2D2A26]">想玩什么呀？</div>
              {showOffer === "game" && (
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => chooseGameOffer("emoji")} className="kb-btn-ghost justify-start">猜动物（我说提示，你猜名字）</button>
                  <button type="button" onClick={() => chooseGameOffer("color")} className="kb-btn-ghost justify-start">颜色问答（我说颜色，你答物品）</button>
                  <button type="button" onClick={() => chooseGameOffer("clap")} className="kb-btn-ghost justify-start">数到几（我数数，你猜一共几个）</button>
                </div>
              )}
              {showOffer === "story" && (
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={acceptStoryOffer} className="kb-btn-ghost justify-start">好呀，听小星讲故事</button>
                </div>
              )}
              <button type="button" onClick={declineOffer} className="text-xs text-[#6F6A60] hover:text-[#2D2A26] self-start">
                先不玩，继续聊
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 候选回复 + 输入区 */}
      <div className="border-t border-[#E5DFD3] bg-white">
        <div className="max-w-2xl mx-auto px-4 py-3 flex flex-col gap-2">
          {/* 候选回复 */}
          {options && options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handlePickOption(o)}
                  className="px-3 py-1.5 rounded-full border border-[#E5DFD3] bg-white text-sm text-[#2D2A26] hover:bg-[#F4EFE3] transition-colors"
                >
                  {o.icon && <span className="mr-1">{o.icon}</span>}
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {/* 输入框 + 语音占位 + 发送 */}
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
                placeholder="跟小星说点什么…"
                className="kb-input"
              />
              {receivedPing && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#4F6BED] animate-kb-fade-in" />
              )}
            </div>
            <button type="submit" disabled={!draft.trim()} className="kb-btn">发送</button>
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
          onClear();
        }}
      />
    </div>
  );
}

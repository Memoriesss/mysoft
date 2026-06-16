import { useEffect, useState } from "react";
import Robot from "../components/Robot";
import Bubble from "../components/Bubble";
import ReplyDock from "../components/ReplyDock";
import ParentPanel from "../components/ParentPanel";
import GameCard from "../components/GameCard";
import { TopicTint } from "../components/Decorations";
import { speak, stopSpeak, warmupTts } from "../utils/tts";
import { useIdle } from "../utils/idles";
import { useSettings } from "../store/useSettings";
import { start as dlgStart, reply as dlgReply, idlePrompt } from "../engine/dialogueEngine";
import type { DialogueState } from "../engine/dialogueEngine";
import { getTopic } from "../engine/topics";
import { pickStory } from "../engine/stories";

type Page = "chat" | "game" | "story";

type Props = {
  go: (p: Page, opts?: { gameId?: string }) => void;
  triggerGame?: string | null;
  triggerStory?: boolean;
  onTimeUp: () => void;
  onClear: () => void;
};

export default function ChatPage({ go, triggerGame, triggerStory, onTimeUp, onClear }: Props) {
  const settings = useSettings();
  const [dlg, setDlg] = useState<DialogueState>(() => dlgStart().state);
  const [history, setHistory] = useState<{ from: "bot" | "kid"; text: string }[]>([]);
  const [options, setOptions] = useState(dlgStart().result.options);
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [parentOpen, setParentOpen] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showStoryMenu, setShowStoryMenu] = useState(false);
  const [holdStart, setHoldStart] = useState<number | null>(null);

  const topic = getTopic(dlg.topicId);

  // 启动时小星打招呼
  useEffect(() => {
    warmupTts();
    const { result, state } = dlgStart();
    setDlg(state);
    setOptions(result.options);
    setHistory([{ from: "bot", text: result.botText }]);
    setSpeaking(true);
    speak(result.botText, { muted: settings.quietMode, rate: settings.voiceRate });
    const t = setTimeout(() => setSpeaking(false), 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 触发从外部进入游戏/故事
  useEffect(() => {
    if (triggerGame) {
      go("game", { gameId: triggerGame });
    } else if (triggerStory) {
      go("story");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerGame, triggerStory]);

  // 时长累计 + 到达限制
  useEffect(() => {
    settings.rolloverIfNewDay();
    const id = setInterval(() => {
      settings.addUsed(1);
      const used = settings.usedSeconds + 1;
      if (used >= settings.dailyLimitMin * 60) {
        onTimeUp();
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 沉默主动说话
  const idle = useIdle(9000, () => {
    if (showGameMenu || showStoryMenu) return;
    const result = idlePrompt(dlg);
    if (result.nextCmd === "game") setShowGameMenu(true);
    else if (result.nextCmd === "story") setShowStoryMenu(true);
    else pushBot(result.botText, result.options);
  });
  // 用户每次输入都 kick 一下
  const kickIdle = () => idle.kick();

  const pushBot = (text: string, opts?: typeof options) => {
    if (!text) return;
    setHistory((h) => [...h, { from: "bot", text }]);
    setOptions(opts);
    setSpeaking(true);
    speak(text, { muted: settings.quietMode, rate: settings.voiceRate });
    setTimeout(() => setSpeaking(false), Math.max(1200, text.length * 220));
  };

  const onPick = (value: string, label: string) => {
    kickIdle();
    setHistory((h) => [...h, { from: "kid", text: label }]);
    setOptions(undefined);
    const { state, result } = dlgReply(dlg, value);
    setDlg(state);
    if (result.nextCmd === "game") {
      setShowGameMenu(true);
      pushBot("好呀！小星选了一个好玩的游戏给你～", undefined);
    } else if (result.nextCmd === "story") {
      setShowStoryMenu(true);
      pushBot("竖起耳朵，小星开始讲啦～", undefined);
    } else if (result.nextCmd === "switch") {
      pushBot("好的，我们换个新话题～", result.options);
      setDlg({ ...state, nodeId: result.nodeId, topicId: result.topicId, turns: 0 });
    } else {
      pushBot(result.botText, result.options);
    }
  };

  const onAskGame = () => {
    kickIdle();
    setShowGameMenu(true);
  };
  const onAskStory = () => {
    kickIdle();
    setShowStoryMenu(true);
  };
  const onRecord = () => {
    kickIdle();
    setRecording((r) => !r);
    if (!recording) {
      // 模拟：用户"说"了 1.6s 一句话，机器人给一个简短的回应
      setTimeout(() => {
        setRecording(false);
        setHistory((h) => [...h, { from: "kid", text: "🎤 我说话啦" }]);
        const canned = [
          { text: "哇，你说得好棒！小星听懂了～", options: undefined },
          { text: "嗯嗯，小星也这么觉得！", options: undefined },
          { text: "好厉害！那我们玩个游戏吧？", options: undefined },
        ];
        const pick = canned[Math.floor(Math.random() * canned.length)];
        pushBot(pick.text, pick.options);
        setShowGameMenu(true);
      }, 1600);
    }
  };

  // 长按左上角 3s 进入家长
  const startHold = () => {
    setHoldStart(Date.now());
    setTimeout(() => {
      if (holdStart && Date.now() - holdStart >= 2900) {
        setParentOpen(true);
      }
    }, 3000);
  };
  const endHold = () => setHoldStart(null);

  const totalSec = settings.dailyLimitMin * 60;
  const remainPct = Math.max(0, 100 - (settings.usedSeconds / totalSec) * 100);

  return (
    <div className="h-full w-full relative flex flex-col">
      <TopicTint tint={topic.tint} />

      {/* 顶部状态栏 */}
      <header className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          className="w-12 h-12 rounded-full bg-lavender text-white grid place-items-center text-xl font-display shadow-pill border-2 border-cocoa/15"
          aria-label="长按进入家长控制台"
        >
          ✦
        </button>
        <div className="flex items-center gap-2">
          <span className="pill">⏱️ 今日还剩 {Math.max(0, totalSec - settings.usedSeconds)} 秒</span>
          <div className="w-32 h-3 rounded-full bg-white/60 overflow-hidden border-2 border-cocoa/10">
            <div className="h-full bg-mint" style={{ width: `${remainPct}%` }} />
          </div>
        </div>
      </header>

      {/* 主题小标签 */}
      <div className="px-4 -mt-1 mb-2 flex items-center gap-2 text-cocoa/70 text-sm font-bold">
        <span className="text-2xl">{topic.emoji}</span>
        <span>现在聊：{topic.name}</span>
      </div>

      {/* 机器人 */}
      <div className="flex-1 min-h-0 flex flex-col items-center px-4">
        <Robot size={210} speaking={speaking} />
        <div className="w-full max-w-xl flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-3">
          {history.map((h, i) => (
            <Bubble key={i} from={h.from} text={h.text} />
          ))}
          {speaking && (
            <div className="flex items-center gap-2 text-cocoa/60 text-sm pl-12">
              <span className="w-1.5 h-1.5 rounded-full bg-cocoa/40 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-cocoa/40 animate-bounce" style={{ animationDelay: "120ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cocoa/40 animate-bounce" style={{ animationDelay: "240ms" }} />
            </div>
          )}
        </div>
      </div>

      {/* 输入区 */}
      <ReplyDock
        options={showGameMenu || showStoryMenu ? undefined : options}
        onPick={(v, l) => {
          setShowGameMenu(false);
          setShowStoryMenu(false);
          onPick(v, l);
        }}
        onAskGame={onAskGame}
        onAskStory={onAskStory}
        onRecord={onRecord}
        isRecording={recording}
      />

      {/* 游戏菜单 */}
      {showGameMenu && (
        <div className="absolute inset-0 z-30 bg-cream/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-whoosh">
          <div className="font-display text-3xl text-cocoa mb-4">小星选了 3 个好玩的游戏～</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
            <GameCard emoji="🐶" title="emoji 猜猜乐" desc="看图猜小动物" tint="lavender" onClick={() => go("game", { gameId: "emoji" })} />
            <GameCard emoji="🎨" title="颜色找一找" desc="眼力大挑战" tint="mint" onClick={() => go("game", { gameId: "color" })} />
            <GameCard emoji="👏" title="数字拍拍手" desc="拍对就赢" tint="sun" onClick={() => go("game", { gameId: "clap" })} />
          </div>
          <button type="button" onClick={() => { setShowGameMenu(false); kickIdle(); }} className="mt-6 text-cocoa/70 underline">先不玩，回去聊聊天</button>
        </div>
      )}

      {/* 故事菜单 */}
      {showStoryMenu && (
        <div className="absolute inset-0 z-30 bg-cream/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-whoosh">
          <div className="font-display text-3xl text-cocoa mb-2">小星要开始讲啦～</div>
          <div className="font-body text-cocoa/70 mb-6">翻一翻，看一看，听小星讲故事</div>
          <button
            type="button"
            onClick={() => {
              setShowStoryMenu(false);
              const story = pickStory();
              go("story", { gameId: story.id });
            }}
            className="kid-btn kid-btn-lavender text-3xl"
          >
            <span className="text-4xl">📖</span> 开始听故事
          </button>
          <button type="button" onClick={() => { setShowStoryMenu(false); kickIdle(); }} className="mt-4 text-cocoa/70 underline">先不听</button>
        </div>
      )}

      <ParentPanel
        open={parentOpen}
        onClose={() => setParentOpen(false)}
        onClearHistory={() => {
          setHistory([]);
          stopSpeak();
          onClear();
        }}
      />
    </div>
  );
}

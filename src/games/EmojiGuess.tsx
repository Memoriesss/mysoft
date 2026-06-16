// emoji 猜猜乐
import { useEffect, useMemo, useState } from "react";
import { speak } from "../utils/tts";
import { useSettings } from "../store/useSettings";

type Round = {
  emoji: string;
  word: string;
  hint: string;
  options: { emoji: string; word: string }[];
};

const POOL: { emoji: string; word: string; hint: string }[] = [
  { emoji: "🐶", word: "小狗", hint: "汪汪汪，尾巴摇一摇" },
  { emoji: "🐱", word: "小猫", hint: "喵喵喵，爱抓老鼠" },
  { emoji: "🐰", word: "小兔子", hint: "耳朵长，爱吃萝卜" },
  { emoji: "🐻", word: "小熊", hint: "爱吃蜂蜜，胖乎乎" },
  { emoji: "🐼", word: "熊猫", hint: "黑眼圈，爱吃竹子" },
  { emoji: "🦊", word: "小狐狸", hint: "尖尖的耳朵，大尾巴" },
  { emoji: "🐯", word: "小老虎", hint: "森林之王，嗷呜" },
  { emoji: "🦁", word: "狮子", hint: "头发蓬蓬，吼声大" },
  { emoji: "🐮", word: "奶牛", hint: "给我们牛奶喝" },
  { emoji: "🐷", word: "小猪", hint: "哼哼哼，鼻子圆" },
  { emoji: "🐸", word: "青蛙", hint: "跳得高，呱呱呱" },
  { emoji: "🐵", word: "小猴子", hint: "爱吃香蕉，挠痒痒" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRounds(count: number): Round[] {
  const items = shuffle(POOL).slice(0, count);
  return items.map((it) => {
    const distractors = shuffle(POOL.filter((p) => p.emoji !== it.emoji)).slice(0, 2);
    const options = shuffle([it, ...distractors]).map((p) => ({ emoji: p.emoji, word: p.word }));
    return { emoji: it.emoji, word: it.word, hint: it.hint, options };
  });
}

type Props = { onExit: () => void };

export default function EmojiGuess({ onExit }: Props) {
  const { quietMode } = useSettings();
  const rounds = useMemo(() => buildRounds(6), []);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const round = rounds[idx];

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => {
      speak(`第 ${idx + 1} 关！${round.hint}，猜一猜是哪个？`, { muted: quietMode, rate: 0.9 });
    }, 250);
    return () => clearTimeout(t);
  }, [idx, done, quietMode, round]);

  const onPick = (emoji: string) => {
    if (picked) return;
    setPicked(emoji);
    if (emoji === round.emoji) {
      setScore((s) => s + 1);
      speak("太棒啦！答对啦！", { muted: quietMode, rate: 1 });
    } else {
      speak(`差一点点！是 ${round.word} 哦。`, { muted: quietMode, rate: 1 });
    }
    setTimeout(() => {
      if (idx + 1 < rounds.length) {
        setIdx(idx + 1);
        setPicked(null);
      } else {
        setDone(true);
        speak(`哇，全部玩完啦！你答对了 ${score + (emoji === round.emoji ? 1 : 0)} 题，好厉害！`, { muted: quietMode, rate: 1 });
      }
    }, 1500);
  };

  if (done) {
    return (
      <GameDone score={score} total={rounds.length} onAgain={() => { setIdx(0); setScore(0); setPicked(null); setDone(false); }} onExit={onExit} />
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 px-4">
      <div className="pill">第 {idx + 1} / {rounds.length} 关 · 得分 {score}</div>
      <div className="kid-card px-8 py-6 max-w-md w-full text-center">
        <div className="text-8xl mb-3 animate-pop">❓</div>
        <div className="font-display text-2xl text-cocoa">小星提示：{round.hint}</div>
      </div>
      <div className="grid grid-cols-3 gap-4 w-full max-w-md">
        {round.options.map((o) => {
          const correct = picked && o.emoji === round.emoji;
          const wrong = picked === o.emoji && o.emoji !== round.emoji;
          return (
            <button
              key={o.emoji}
              type="button"
              onClick={() => onPick(o.emoji)}
              className={`kid-btn !rounded-chunk !p-0 h-28 flex-col ${
                correct ? "!bg-mint" : wrong ? "!bg-strawberry/60" : "kid-btn-sun"
              }`}
            >
              <span className="text-5xl leading-none">{o.emoji}</span>
              <span className="text-sm font-bold mt-1">{o.word}</span>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={onExit} className="text-cocoa/60 hover:text-cocoa underline">不玩了，回去聊聊</button>
    </div>
  );
}

function GameDone({ score, total, onAgain, onExit }: { score: number; total: number; onAgain: () => void; onExit: () => void }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-7xl animate-pop">🏆</div>
      <div className="font-display text-4xl text-cocoa text-center">太棒啦！</div>
      <div className="font-body text-xl text-cocoa/80 text-center">这一局你答对了 {score} / {total} 题</div>
      <div className="flex gap-3">
        <button type="button" onClick={onAgain} className="kid-btn kid-btn-mint">再来一局</button>
        <button type="button" onClick={onExit} className="kid-btn">回去聊聊天</button>
      </div>
    </div>
  );
}

// 颜色找一找
import { useEffect, useMemo, useState } from "react";
import { speak } from "../utils/tts";
import { useSettings } from "../store/useSettings";

type Color = { name: string; bg: string };
const COLORS: Color[] = [
  { name: "红色", bg: "bg-strawberry" },
  { name: "黄色", bg: "bg-lemon" },
  { name: "蓝色", bg: "bg-sky" },
  { name: "绿色", bg: "bg-mint" },
  { name: "紫色", bg: "bg-lavender" },
  { name: "橙色", bg: "bg-tangerine" },
];

const ICONS = ["🚗", "🍎", "🐟", "🌷", "🪁", "🐱", "🍌", "🎈", "🐸", "🐻", "🦄", "🍇"];

type Round = {
  color: Color;
  icon: string;
  prompt: string;
  options: { color: Color; icon: string }[];
};

function buildRounds(): Round[] {
  return Array.from({ length: 6 }).map(() => {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const icon = ICONS[Math.floor(Math.random() * ICONS.length)];
    const prompt = `点一点${color.name}的${thingName(icon)}`;
    const otherColors = COLORS.filter((c) => c.name !== color.name);
    const opts = shuffle([color, ...shuffle(otherColors).slice(0, 3)]).map((c) => ({ color: c, icon }));
    return { color, icon, prompt, options: opts };
  });
}

function thingName(icon: string): string {
  const map: Record<string, string> = {
    "🚗": "小汽车",
    "🍎": "苹果",
    "🐟": "小鱼",
    "🌷": "小花",
    "🪁": "风筝",
    "🐱": "小猫",
    "🍌": "香蕉",
    "🎈": "气球",
    "🐸": "青蛙",
    "🐻": "小熊",
    "🦄": "独角兽",
    "🍇": "葡萄",
  };
  return map[icon] || "宝贝";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ColorFind({ onExit }: { onExit: () => void }) {
  const { quietMode } = useSettings();
  const rounds = useMemo(buildRounds, []);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const round = rounds[idx];

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => {
      speak(round.prompt, { muted: quietMode, rate: 0.95 });
    }, 250);
    return () => clearTimeout(t);
  }, [idx, done, quietMode, round]);

  const onPick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const correct = round.options[i].color.name === round.color.name;
    if (correct) {
      setScore((s) => s + 1);
      speak("答对啦！眼力真好～", { muted: quietMode, rate: 1 });
    } else {
      speak(`差一点哦，要找${round.color.name}的呀。`, { muted: quietMode, rate: 1 });
    }
    setTimeout(() => {
      if (idx + 1 < rounds.length) {
        setIdx(idx + 1);
        setPicked(null);
      } else {
        setDone(true);
      }
    }, 1400);
  };

  if (done) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-7xl animate-pop">🎉</div>
        <div className="font-display text-4xl text-cocoa">真厉害！</div>
        <div className="font-body text-xl text-cocoa/80">你答对了 {score} / {rounds.length} 题</div>
        <div className="flex gap-3">
          <button type="button" onClick={() => { setIdx(0); setScore(0); setPicked(null); setDone(false); }} className="kid-btn kid-btn-mint">再来一局</button>
          <button type="button" onClick={onExit} className="kid-btn">回去聊聊天</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 px-4">
      <div className="pill">第 {idx + 1} / {rounds.length} 关 · 得分 {score}</div>
      <div className="kid-card px-8 py-6 max-w-md w-full text-center">
        <div className="font-display text-3xl text-cocoa">小星说：{round.prompt}</div>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {round.options.map((o, i) => {
          const isCorrect = picked !== null && o.color.name === round.color.name;
          const isWrong = picked === i && o.color.name !== round.color.name;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(i)}
              className={`h-32 rounded-chunk border-4 border-cocoa/20 flex flex-col items-center justify-center gap-1 transition-transform ${o.color.bg} ${
                isCorrect ? "ring-4 ring-mint scale-105" : isWrong ? "opacity-60" : "hover:scale-105"
              }`}
            >
              <span className="text-5xl drop-shadow">{o.icon}</span>
              <span className="text-cocoa font-bold text-sm">{o.color.name}</span>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={onExit} className="text-cocoa/60 hover:text-cocoa underline">不玩了，回去聊聊</button>
    </div>
  );
}

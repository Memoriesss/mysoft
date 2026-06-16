// 数字拍拍手
import { useEffect, useMemo, useState } from "react";
import { speak } from "../utils/tts";
import { useSettings } from "../store/useSettings";

type Round = { target: number };

function buildRounds(): Round[] {
  return shuffle([1, 2, 3, 4, 5]).map((t) => ({ target: t }));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function NumberClap({ onExit }: { onExit: () => void }) {
  const { quietMode } = useSettings();
  const rounds = useMemo(buildRounds, []);
  const [idx, setIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  const round = rounds[idx];

  useEffect(() => {
    if (done) return;
    setCount(0);
    const t = setTimeout(() => {
      speak(`拍 ${round.target} 下小手，准备好开始！`, { muted: quietMode, rate: 0.95 });
    }, 250);
    return () => clearTimeout(t);
  }, [idx, done, quietMode, round]);

  const clap = () => {
    if (done) return;
    setCount((c) => {
      const next = c + 1;
      if (next === round.target) {
        speak("太棒啦！刚刚好！", { muted: quietMode, rate: 1 });
        setTimeout(() => {
          if (idx + 1 < rounds.length) {
            setIdx(idx + 1);
          } else {
            setDone(true);
          }
        }, 1200);
      } else if (next > round.target) {
        speak("哎呀，多拍了一下，再来一次！", { muted: quietMode, rate: 1 });
        return 0;
      } else {
        speak(`还差 ${round.target - next} 下！`, { muted: quietMode, rate: 1 });
      }
      return next;
    });
  };

  if (done) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-7xl animate-pop">👏</div>
        <div className="font-display text-4xl text-cocoa">小手动起来！</div>
        <div className="font-body text-xl text-cocoa/80">完成了所有 {rounds.length} 关！</div>
        <div className="flex gap-3">
          <button type="button" onClick={() => { setIdx(0); setCount(0); setDone(false); }} className="kid-btn kid-btn-mint">再来一局</button>
          <button type="button" onClick={onExit} className="kid-btn">回去聊聊天</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 px-4">
      <div className="pill">第 {idx + 1} / {rounds.length} 关</div>
      <div className="kid-card px-8 py-6 max-w-md w-full text-center">
        <div className="font-display text-3xl text-cocoa mb-2">拍 {round.target} 下小手</div>
        <div className="text-6xl font-cute text-cocoa">👏 {count} / {round.target}</div>
      </div>
      <button
        type="button"
        onClick={clap}
        className="kid-btn !rounded-full w-44 h-44 !p-0 kid-btn-strawberry text-7xl active:scale-90 transition-transform"
        aria-label="拍一下小手"
      >
        👏
      </button>
      <button type="button" onClick={onExit} className="text-cocoa/60 hover:text-cocoa underline">不玩了，回去聊聊</button>
    </div>
  );
}

// 数到 N — 纯文字游戏
// 机器人说"我数到 3"（逐个念 1、2、3），小朋友从文字选项里挑出对应数量
// 或：机器人说"找 1 个东西"，小朋友挑对应数量
// 后续可改为：纯语音说"数到 3"，用户语音回答"1 2 3"

import { useEffect, useMemo, useState } from "react";
import { speak } from "../utils/tts";
import { useSettings } from "../store/useSettings";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Round = { target: number; prompt: string; options: number[] };

function buildRounds(): Round[] {
  return shuffle([1, 2, 3, 4, 5]).map((target) => {
    const distractors = shuffle([1, 2, 3, 4, 5].filter((n) => n !== target)).slice(0, 2);
    const options = shuffle([target, ...distractors]);
    const prompt = `小星要数到 ${target}。准备好了吗？1、2、${target === 1 ? "…" : target === 2 ? "3" : target === 3 ? "4" : target === 4 ? "5" : "6"}。一共数了几个？`;
    return { target, prompt, options };
  });
}

type Props = { onExit: () => void };

export default function NumberClap({ onExit }: Props) {
  const { ttsEnabled, voiceRate } = useSettings();
  const rounds = useMemo(buildRounds, []);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const round = rounds[idx];

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => {
      speak(round.prompt, { enabled: ttsEnabled, rate: voiceRate });
    }, 200);
    return () => clearTimeout(t);
  }, [idx, done, ttsEnabled, voiceRate, round]);

  const onPick = (n: number) => {
    if (picked !== null) return;
    setPicked(n);
    if (n === round.target) {
      setScore((s) => s + 1);
      speak("太棒啦！答对啦！", { enabled: ttsEnabled, rate: voiceRate });
    } else {
      speak(`差一点哦，正确答案是${round.target}。`, { enabled: ttsEnabled, rate: voiceRate });
    }
    setTimeout(() => {
      if (idx + 1 < rounds.length) {
        setIdx(idx + 1);
        setPicked(null);
      } else {
        setDone(true);
      }
    }, 1500);
  };

  if (done) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-5 px-4">
        <div className="text-xl font-semibold text-[#2D2A26]">数数游戏结束啦！</div>
        <div className="text-base text-[#6F6A60]">你答对了 {score} / {rounds.length} 题</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setIdx(0); setScore(0); setPicked(null); setDone(false); }}
            className="kb-btn-ghost"
          >
            再来一局
          </button>
          <button type="button" onClick={onExit} className="kb-btn">回去聊聊天</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-sm text-[#6F6A60]">第 {idx + 1} / {rounds.length} 题 · 得分 {score}</div>
      <div className="w-full max-w-xl text-center">
        <div className="text-lg text-[#2D2A26]">小星说：</div>
        <div className="mt-2 text-xl font-medium text-[#2D2A26] leading-relaxed">
          {round.prompt}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
        {round.options.map((n) => {
          const correct = picked !== null && n === round.target;
          const wrong = picked === n && n !== round.target;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onPick(n)}
              className={`px-4 py-3 rounded-lg border text-xl font-medium transition-colors ${
                correct
                  ? "bg-[#E8F1E1] border-[#7BAF6A] text-[#2D2A26]"
                  : wrong
                  ? "bg-[#FCE6E8] border-[#E09AA1] text-[#2D2A26]"
                  : "bg-white border-[#E5DFD3] text-[#2D2A26] hover:bg-[#F4EFE3]"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <button type="button" onClick={onExit} className="text-sm text-[#6F6A60] hover:text-[#2D2A26] underline">
        不玩了，回去聊聊
      </button>
    </div>
  );
}

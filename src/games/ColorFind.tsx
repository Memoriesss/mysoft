// 颜色问答 — 纯文字问答游戏
// 机器人问"什么东西是XX颜色？" / "XX是什么颜色？"，小朋友从 3 个文字选项里选

import { useEffect, useMemo, useState } from "react";
import { speak } from "../utils/tts";
import { useSettings } from "../store/useSettings";

type Color = { name: string; examples: string[] };
const COLORS: Color[] = [
  { name: "红色", examples: ["苹果", "草莓", "太阳", "樱桃", "玫瑰"] },
  { name: "黄色", examples: ["香蕉", "月亮", "小鸭子", "柠檬", "向日葵"] },
  { name: "蓝色", examples: ["大海", "天空", "蓝莓", "鲸鱼", "雨伞"] },
  { name: "绿色", examples: ["草地", "树叶", "青蛙", "西瓜", "青苹果"] },
  { name: "紫色", examples: ["葡萄", "薰衣草", "茄子", "牵牛花", "李子"] },
  { name: "橙色", examples: ["橙子", "胡萝卜", "南瓜", "金鱼", "晚霞"] },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Round = {
  type: "askExample" | "askColor";
  color: Color;
  example: string;
  options: string[];
  correct: string;
  prompt: string;
};

function buildRounds(count: number): Round[] {
  return shuffle(COLORS).slice(0, count).map((c) => {
    const example = shuffle(c.examples)[0];
    const askExample = Math.random() < 0.5;
    if (askExample) {
      // 问：什么东西是XX颜色？答案=example；选项=example + 2 个其它颜色的 examples
      const otherExamples = shuffle(
        COLORS.filter((x) => x.name !== c.name).flatMap((x) => x.examples),
      ).slice(0, 2);
      const options = shuffle([example, ...otherExamples]);
      return {
        type: "askExample" as const,
        color: c,
        example,
        options,
        correct: example,
        prompt: `什么东西是${c.name}的？`,
      };
    } else {
      // 问：XX 是什么颜色？答案=c.name；选项=c.name + 2 个其它颜色
      const others = shuffle(COLORS.filter((x) => x.name !== c.name)).slice(0, 2);
      const options = shuffle([c.name, ...others.map((x) => x.name)]);
      return {
        type: "askColor" as const,
        color: c,
        example,
        options,
        correct: c.name,
        prompt: `${example}是什么颜色的？`,
      };
    }
  });
}

type Props = { onExit: () => void };

export default function ColorFind({ onExit }: Props) {
  const { ttsEnabled, voiceRate } = useSettings();
  const rounds = useMemo(() => buildRounds(5), []);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
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

  const onPick = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    if (opt === round.correct) {
      setScore((s) => s + 1);
      speak("答对啦！眼力真好～", { enabled: ttsEnabled, rate: voiceRate });
    } else {
      speak(`差一点哦，正确答案是${round.correct}。`, { enabled: ttsEnabled, rate: voiceRate });
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
        <div className="text-xl font-semibold text-[#2D2A26]">颜色问答结束啦！</div>
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
        <div className="text-lg text-[#2D2A26]">小星问：</div>
        <div className="mt-2 text-2xl font-medium text-[#2D2A26] leading-snug">
          {round.prompt}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
        {round.options.map((o) => {
          const correct = picked && o === round.correct;
          const wrong = picked === o && o !== round.correct;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onPick(o)}
              className={`px-4 py-3 rounded-lg border text-base transition-colors ${
                correct
                  ? "bg-[#E8F1E1] border-[#7BAF6A] text-[#2D2A26]"
                  : wrong
                  ? "bg-[#FCE6E8] border-[#E09AA1] text-[#2D2A26]"
                  : "bg-white border-[#E5DFD3] text-[#2D2A26] hover:bg-[#F4EFE3]"
              }`}
            >
              {o}
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

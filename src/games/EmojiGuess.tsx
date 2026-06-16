// 猜动物 — 纯文字问答游戏
// 机器人用文字描述一种动物，小朋友从 3 个文字选项里选
// 完全无视觉依赖，未来切到纯语音零改动

import { useEffect, useMemo, useState } from "react";
import { speak } from "../utils/tts";
import { useSettings } from "../store/useSettings";

type Animal = { name: string; hint: string };
const POOL: Animal[] = [
  { name: "小狗", hint: "汪汪汪叫，尾巴会摇一摇" },
  { name: "小猫", hint: "喵喵喵叫，喜欢抓老鼠" },
  { name: "小兔子", hint: "耳朵长长的，爱吃萝卜" },
  { name: "小熊", hint: "胖乎乎的，爱吃蜂蜜" },
  { name: "熊猫", hint: "黑眼圈，爱吃竹子" },
  { name: "小狐狸", hint: "尖尖耳朵，大尾巴" },
  { name: "小老虎", hint: "森林之王，会嗷呜" },
  { name: "小猴子", hint: "爱吃香蕉，会挠痒痒" },
  { name: "小猪", hint: "哼哼哼，鼻子圆圆的" },
  { name: "小青蛙", hint: "跳得高，呱呱呱叫" },
  { name: "大象", hint: "鼻子长长的，能吸水" },
  { name: "长颈鹿", hint: "脖子长长的，吃树叶" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Round = { target: Animal; options: Animal[] };

function buildRounds(count: number): Round[] {
  return shuffle(POOL).slice(0, count).map((it) => {
    const distractors = shuffle(POOL.filter((p) => p.name !== it.name)).slice(0, 2);
    const options = shuffle([it, ...distractors]);
    return { target: it, options };
  });
}

type Props = { onExit: () => void };

export default function EmojiGuess({ onExit }: Props) {
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
      speak(`猜一猜这是什么小动物？${round.target.hint}`, { enabled: ttsEnabled, rate: voiceRate });
    }, 200);
    return () => clearTimeout(t);
  }, [idx, done, ttsEnabled, voiceRate, round]);

  const onPick = (name: string) => {
    if (picked) return;
    setPicked(name);
    if (name === round.target.name) {
      setScore((s) => s + 1);
      speak(`答对啦！就是${round.target.name}。`, { enabled: ttsEnabled, rate: voiceRate });
    } else {
      speak(`差一点点哦，是${round.target.name}。`, { enabled: ttsEnabled, rate: voiceRate });
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
      <div className="h-full w-full flex flex-col items-center justify-center gap-5 px-4">
        <div className="text-xl font-semibold text-[#2D2A26]">猜动物结束啦！</div>
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
        <div className="text-lg text-[#2D2A26] leading-relaxed">小星说：</div>
        <div className="mt-2 text-xl font-medium text-[#2D2A26] leading-relaxed">
          猜一猜这是什么小动物？<br />
          <span className="text-[#4F6BED]">{round.target.hint}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
        {round.options.map((o) => {
          const correct = picked && o.name === round.target.name;
          const wrong = picked === o.name && o.name !== round.target.name;
          return (
            <button
              key={o.name}
              type="button"
              onClick={() => onPick(o.name)}
              className={`px-4 py-3 rounded-lg border text-base transition-colors ${
                correct
                  ? "bg-[#E8F1E1] border-[#7BAF6A] text-[#2D2A26]"
                  : wrong
                  ? "bg-[#FCE6E8] border-[#E09AA1] text-[#2D2A26]"
                  : "bg-white border-[#E5DFD3] text-[#2D2A26] hover:bg-[#F4EFE3]"
              }`}
            >
              {o.name}
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

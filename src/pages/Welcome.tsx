import { useEffect, useState } from "react";
import Robot from "../components/Robot";
import { speak } from "../utils/tts";
import { useSettings } from "../store/useSettings";

type Props = { onEnter: () => void };

export default function Welcome({ onEnter }: Props) {
  const [pressed, setPressed] = useState(false);
  const { quietMode } = useSettings();

  useEffect(() => {
    const t = setTimeout(() => {
      speak("你好呀！我是小星，今天想聊什么呀？", { muted: quietMode, rate: 0.9 });
    }, 400);
    return () => clearTimeout(t);
  }, [quietMode]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="absolute top-10 left-10 animate-sparkle text-3xl">⭐</div>
      <div className="absolute top-24 right-16 animate-sparkle text-2xl" style={{ animationDelay: "0.5s" }}>✨</div>
      <div className="absolute bottom-32 left-20 animate-sparkle text-2xl" style={{ animationDelay: "1s" }}>💫</div>
      <div className="absolute top-32 left-1/3 animate-sparkle text-xl" style={{ animationDelay: "1.5s" }}>🌟</div>

      <Robot size={260} speaking />
      <h1 className="font-display text-5xl md:text-6xl text-cocoa drop-shadow-[0_4px_0_rgba(255,255,255,0.6)]">
        你好呀，我是小星！
      </h1>
      <p className="font-body text-xl text-cocoa/80 max-w-md">
        点一点下面的大按钮，小星会跟你聊天、玩游戏、还会讲故事哦～
      </p>
      <button
        type="button"
        onClick={() => {
          setPressed(true);
          setTimeout(onEnter, 350);
        }}
        className={`kid-btn kid-btn-strawberry text-3xl px-10 py-5 ${pressed ? "animate-wiggle" : ""}`}
      >
        <span className="text-4xl">🌟</span>
        <span>和小星玩</span>
      </button>
    </div>
  );
}

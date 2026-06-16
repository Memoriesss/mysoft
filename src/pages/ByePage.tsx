import { useEffect } from "react";
import Robot from "../components/Robot";
import { speak } from "../utils/tts";
import { useSettings } from "../store/useSettings";

type Props = { onRestart: () => void };

export default function ByePage({ onRestart }: Props) {
  const { quietMode } = useSettings();
  useEffect(() => {
    speak("我们下次再玩吧！小星会想你的～", { muted: quietMode, rate: 0.9 });
  }, [quietMode]);
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 px-6 text-center">
      <Robot size={200} />
      <h1 className="font-display text-4xl text-cocoa">我们下次再玩吧！</h1>
      <p className="font-body text-lg text-cocoa/80 max-w-md">小星的眼睛要休息一下啦～明天再来找小星玩吧，记得多喝水哦！</p>
      <button type="button" onClick={onRestart} className="kid-btn kid-btn-mint text-2xl">明天再来</button>
    </div>
  );
}

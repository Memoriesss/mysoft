import { useEffect } from "react";
import { speak } from "../utils/tts";
import { useSettings } from "../store/useSettings";

type Props = { onRestart: () => void };

export default function ByePage({ onRestart }: Props) {
  const { ttsEnabled, voiceRate } = useSettings();
  useEffect(() => {
    speak("我们下次再玩吧！小星会想你的。", { enabled: ttsEnabled, rate: voiceRate });
  }, [ttsEnabled, voiceRate]);
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl md:text-3xl font-semibold text-[#2D2A26]">我们下次再玩吧！</h1>
      <p className="text-base text-[#6F6A60] max-w-md">
        小星的眼睛要休息一下啦，明天再来找小星玩吧，记得多喝水哦。
      </p>
      <button type="button" onClick={onRestart} className="kb-btn">明天再来</button>
    </div>
  );
}

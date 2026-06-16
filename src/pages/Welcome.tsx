import { useEffect } from "react";
import { speak, warmupTts } from "../utils/tts";
import { useSettings } from "../store/useSettings";

type Props = { onEnter: () => void };

export default function Welcome({ onEnter }: Props) {
  const { ttsEnabled, voiceRate } = useSettings();

  useEffect(() => {
    warmupTts();
    const t = setTimeout(() => {
      speak("你好呀，我是小星。按一下开始，我们来聊聊天。", { enabled: ttsEnabled, rate: voiceRate });
    }, 300);
    return () => clearTimeout(t);
  }, [ttsEnabled, voiceRate]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8 px-4 text-center">
      <h1 className="text-3xl md:text-4xl font-semibold text-[#2D2A26]">
        你好呀，我是小星
      </h1>
      <p className="text-base md:text-lg text-[#6F6A60] max-w-md">
        童语星球 · 和小星聊聊天
      </p>
      <button type="button" onClick={onEnter} className="kb-btn text-base px-6 py-3">
        开始聊天
      </button>
      <p className="text-xs text-[#9A9387]">家长请点上方"家长"设置时长与语音</p>
    </div>
  );
}

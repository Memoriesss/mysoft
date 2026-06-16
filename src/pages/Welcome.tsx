import { useEffect, useState } from "react";
import { speak, warmupTts } from "../utils/tts";
import { useSettings } from "../store/useSettings";
import { clearAllAndReload } from "../utils/clearCache";

type Props = { onEnter: () => void };

export default function Welcome({ onEnter }: Props) {
  const { ttsEnabled, voiceRate } = useSettings();
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    warmupTts();
    const t = setTimeout(() => {
      speak("你好呀，我是小星。按一下开始，我们来聊聊天。", { enabled: ttsEnabled, rate: voiceRate });
    }, 300);
    return () => clearTimeout(t);
  }, [ttsEnabled, voiceRate]);

  async function handleClearCache() {
    if (clearing) return;
    const ok = window.confirm(
      "确定要清除所有缓存吗？\n\n会清掉：\n· 今日已用时长\n· 小星记住的小朋友信息\n· 所有对话记录\n\n（清完会刷新页面）",
    );
    if (!ok) return;
    setClearing(true);
    try {
      await clearAllAndReload();
    } catch (e) {
      console.error("[clear] failed", e);
      window.alert("清除失败：" + (e as Error).message);
      setClearing(false);
    }
  }

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
      <button
        type="button"
        onClick={handleClearCache}
        disabled={clearing}
        className="text-xs text-[#9A9387] hover:text-[#6F6A60] underline underline-offset-2 disabled:opacity-50"
        title="清除时长、长期记忆、对话记录"
      >
        {clearing ? "清除中…" : "清除缓存"}
      </button>
      <p className="text-xs text-[#9A9387]">家长请点上方"家长"设置时长与语音</p>
    </div>
  );
}

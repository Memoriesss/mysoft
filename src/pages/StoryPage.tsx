import { useEffect, useState } from "react";
import { speak, stopSpeak } from "../utils/tts";
import { STORIES, type Story } from "../engine/stories";
import { useSettings } from "../store/useSettings";

type Props = {
  storyId?: string;
  onExit: () => void;
};

export default function StoryPage({ storyId, onExit }: Props) {
  const story: Story = STORIES.find((s) => s.id === storyId) ?? STORIES[0];
  const [page, setPage] = useState(0);
  const { ttsEnabled, voiceRate } = useSettings();

  useEffect(() => {
    stopSpeak();
    if (!ttsEnabled) return;
    const t = setTimeout(() => {
      speak(story.pages[page], { rate: voiceRate });
    }, 200);
    return () => clearTimeout(t);
  }, [page, story, ttsEnabled, voiceRate]);

  const next = () => {
    if (page + 1 < story.pages.length) setPage(page + 1);
    else onExit();
  };
  const prev = () => {
    if (page > 0) setPage(page - 1);
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 gap-6">
      <div className="text-sm text-[#6F6A60]">{story.title} · {page + 1} / {story.pages.length}</div>
      <div className="w-full max-w-2xl bg-white border border-[#E5DFD3] rounded-2xl px-8 py-12 min-h-[240px] flex items-center justify-center text-center">
        <p className="text-2xl md:text-3xl text-[#2D2A26] leading-relaxed font-medium">
          {story.pages[page]}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-[#6F6A60]">
        {story.pages.map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${i === page ? "bg-[#4F6BED]" : "bg-[#D6D0C2]"}`}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={prev} disabled={page === 0} className="kb-btn-ghost disabled:opacity-40">
          上一页
        </button>
        <button type="button" onClick={next} className="kb-btn">
          {page + 1 < story.pages.length ? "下一页" : "讲完啦"}
        </button>
      </div>
      <button type="button" onClick={onExit} className="text-sm text-[#6F6A60] hover:text-[#2D2A26] underline">
        不听了，回去聊聊
      </button>
    </div>
  );
}

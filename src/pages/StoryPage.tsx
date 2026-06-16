import { useEffect, useState } from "react";
import { speak, stopSpeak } from "../utils/tts";
import { pickStory, STORIES, type Story } from "../engine/stories";
import { useSettings } from "../store/useSettings";

type Props = {
  storyId?: string;
  onExit: () => void;
};

export default function StoryPage({ storyId, onExit }: Props) {
  const story: Story = STORIES.find((s) => s.id === storyId) || pickStory();
  const [page, setPage] = useState(0);
  const { quietMode } = useSettings();

  useEffect(() => {
    if (quietMode) return;
    stopSpeak();
    const t = setTimeout(() => {
      speak(`${story.title}。${story.pages[page]}`, { rate: 0.85 });
    }, 200);
    return () => clearTimeout(t);
  }, [page, story, quietMode]);

  const next = () => {
    if (page + 1 < story.pages.length) setPage(page + 1);
    else onExit();
  };
  const prev = () => {
    if (page > 0) setPage(page - 1);
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 pill">{story.title}</div>
      <div className="absolute top-6 right-6 text-3xl">{story.emoji}</div>

      <div
        className="kid-card w-full max-w-2xl aspect-[4/3] flex flex-col items-center justify-center text-center px-10 py-12"
        style={{
          background:
            story.tint === "lavender" ? "#EFE7FF" :
            story.tint === "tangerine" ? "#FFE9D2" :
            story.tint === "sky" ? "#E2F3FB" :
            story.tint === "mint" ? "#E1F6E8" : "#FFF8E7",
        }}
      >
        <div className="text-7xl mb-6 animate-pop">{story.emoji}</div>
        <p className="font-display text-3xl md:text-4xl text-cocoa leading-snug">
          {story.pages[page]}
        </p>
        <div className="mt-8 flex items-center gap-2 text-cocoa/60">
          {story.pages.map((_, i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${i === page ? "bg-strawberry" : "bg-cocoa/20"}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <button type="button" onClick={prev} disabled={page === 0} className="kid-btn kid-btn-sky disabled:opacity-40">
          ← 上一页
        </button>
        <button type="button" onClick={next} className="kid-btn kid-btn-strawberry">
          {page + 1 < story.pages.length ? "翻一页 →" : "讲完啦，回去聊"}
        </button>
      </div>
    </div>
  );
}

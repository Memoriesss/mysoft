import type { ReplyOption } from "../engine/topics";

type ReplyDockProps = {
  options?: ReplyOption[];
  onPick: (value: string, label: string) => void;
  onAskGame: () => void;
  onAskStory: () => void;
  onRecord: () => void;
  isRecording: boolean;
  disabled?: boolean;
};

const COMMON = "kid-btn min-w-[120px]";

export default function ReplyDock({ options, onPick, onAskGame, onAskStory, onRecord, isRecording, disabled }: ReplyDockProps) {
  return (
    <div className="w-full px-4 pb-4 pt-2">
      {/* 候选回复 */}
      {options && options.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-3">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              disabled={disabled}
              onClick={() => onPick(o.value, `${o.icon ?? ""} ${o.label}`.trim())}
              className={`${COMMON} kid-btn-mint text-xl`}
            >
              <span className="text-2xl">{o.icon}</span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 主动操作 */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={onRecord}
          className={`${COMMON} ${isRecording ? "kid-btn-sun animate-wiggle" : "kid-btn-sky"}`}
          aria-label="按着说一句话"
        >
          <span className="text-2xl">{isRecording ? "🟢" : "🎤"}</span>
          <span>{isRecording ? "听到啦～" : "说一说"}</span>
        </button>
        <button type="button" disabled={disabled} onClick={onAskGame} className={`${COMMON} kid-btn-lavender`}>
          <span className="text-2xl">🎮</span>
          <span>玩个游戏</span>
        </button>
        <button type="button" disabled={disabled} onClick={onAskStory} className={`${COMMON} kid-btn-sun`}>
          <span className="text-2xl">📖</span>
          <span>听故事</span>
        </button>
      </div>
    </div>
  );
}

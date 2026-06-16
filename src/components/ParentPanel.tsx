import { useSettings, type LimitMin } from "../store/useSettings";

type ParentPanelProps = {
  open: boolean;
  onClose: () => void;
  onClearHistory: () => void;
};

const LIMIT_OPTS: LimitMin[] = [5, 10, 15, 20, 30];

export default function ParentPanel({ open, onClose, onClearHistory }: ParentPanelProps) {
  const settings = useSettings();
  if (!open) return null;

  const totalSec = settings.dailyLimitMin * 60;
  const pct = Math.min(100, (settings.usedSeconds / totalSec) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#E5DFD3] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#2D2A26]">家长设置</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md text-[#6F6A60] hover:bg-[#F4EFE3]"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <section className="mb-5">
          <div className="text-sm font-medium text-[#2D2A26] mb-2">每日时长：{settings.dailyLimitMin} 分钟</div>
          <div className="flex flex-wrap gap-2">
            {LIMIT_OPTS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => settings.setLimit(m)}
                className={`px-3 py-1.5 rounded-md text-sm border ${
                  settings.dailyLimitMin === m
                    ? "bg-[#4F6BED] text-white border-[#4F6BED]"
                    : "bg-white text-[#2D2A26] border-[#E5DFD3] hover:bg-[#F4EFE3]"
                }`}
              >
                {m} 分
              </button>
            ))}
          </div>
          <div className="mt-3">
            <div className="h-2 w-full bg-[#F4EFE3] rounded-full overflow-hidden">
              <div className="h-full bg-[#4F6BED] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-xs text-[#6F6A60] mt-1">
              今日已用 {Math.floor(settings.usedSeconds / 60)} 分 {settings.usedSeconds % 60} 秒
            </div>
          </div>
        </section>

        <section className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[#2D2A26]">小星语音</div>
            <div className="text-xs text-[#6F6A60]">关闭后只显示文字</div>
          </div>
          <button
            type="button"
            onClick={settings.toggleTts}
            className={`w-12 h-6 rounded-full transition-colors ${settings.ttsEnabled ? "bg-[#4F6BED]" : "bg-[#D6D0C2]"}`}
            aria-pressed={settings.ttsEnabled}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                settings.ttsEnabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </section>

        <section className="mb-5">
          <div className="text-sm font-medium text-[#2D2A26] mb-2">说话速度：{settings.voiceRate.toFixed(2)}x</div>
          <input
            type="range"
            min={0.7}
            max={1.3}
            step={0.05}
            value={settings.voiceRate}
            onChange={(e) => settings.setVoiceRate(parseFloat(e.target.value))}
            className="w-full accent-[#4F6BED]"
          />
        </section>

        <section className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              settings.resetUsed();
              onClearHistory();
            }}
            className="kb-btn-ghost w-full"
          >
            清空对话和今日记录
          </button>
          <button type="button" onClick={onClose} className="kb-btn w-full">
            关闭
          </button>
        </section>
      </div>
    </div>
  );
}

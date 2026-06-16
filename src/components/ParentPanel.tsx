import { useEffect, useState } from "react";
import { useSettings, type LimitMin } from "../store/useSettings";

type ParentPanelProps = {
  open: boolean;
  onClose: () => void;
  onClearHistory: () => void;
};

const LIMIT_OPTS: LimitMin[] = [5, 10, 15, 20, 30];

export default function ParentPanel({ open, onClose, onClearHistory }: ParentPanelProps) {
  const settings = useSettings();
  const [, setHold] = useState(0);

  useEffect(() => {
    if (!open) return;
    setHold(0);
  }, [open]);

  if (!open) return null;

  const totalSec = settings.dailyLimitMin * 60;
  const pct = Math.min(100, (settings.usedSeconds / totalSec) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cocoa/40 backdrop-blur-sm animate-whoosh">
      <div className="kid-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-3xl text-cocoa">家长控制台</h2>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full bg-dusk hover:bg-strawberry hover:text-white text-cocoa text-xl border-2 border-cocoa/15">
            ✕
          </button>
        </div>

        <p className="text-cocoa/70 text-sm mb-4">这里是给爸爸妈妈看的，宝贝可以先去玩哦～</p>

        {/* 时长设置 */}
        <section className="mb-5">
          <div className="font-bold text-cocoa mb-2">每日时长：{settings.dailyLimitMin} 分钟</div>
          <div className="flex flex-wrap gap-2">
            {LIMIT_OPTS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => settings.setLimit(m)}
                className={`px-4 py-2 rounded-chunk font-display text-xl border-2 border-cocoa/15 ${
                  settings.dailyLimitMin === m ? "bg-strawberry text-white" : "bg-white text-cocoa"
                }`}
              >
                {m} 分
              </button>
            ))}
          </div>
          <div className="mt-3">
            <div className="h-3 w-full bg-dusk rounded-full overflow-hidden border-2 border-cocoa/10">
              <div
                className="h-full bg-mint transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-xs text-cocoa/70 mt-1">
              今日已用 {Math.floor(settings.usedSeconds / 60)} 分 {settings.usedSeconds % 60} 秒
            </div>
          </div>
        </section>

        {/* 静音模式 */}
        <section className="mb-5 flex items-center justify-between">
          <div>
            <div className="font-bold text-cocoa">安静模式</div>
            <div className="text-xs text-cocoa/70">关闭所有语音，只显示文字</div>
          </div>
          <button
            type="button"
            onClick={settings.toggleQuiet}
            className={`w-16 h-9 rounded-full border-2 border-cocoa/15 transition-colors ${settings.quietMode ? "bg-mint" : "bg-dusk"}`}
          >
            <span
              className={`block w-7 h-7 rounded-full bg-white border-2 border-cocoa/15 shadow transition-transform ${
                settings.quietMode ? "translate-x-7" : "translate-x-0.5"
              }`}
            />
          </button>
        </section>

        {/* 语速 */}
        <section className="mb-5">
          <div className="font-bold text-cocoa mb-2">小星说话速度：{settings.voiceRate.toFixed(2)}x</div>
          <input
            type="range"
            min={0.7}
            max={1.3}
            step={0.05}
            value={settings.voiceRate}
            onChange={(e) => settings.setVoiceRate(parseFloat(e.target.value))}
            className="w-full accent-strawberry"
          />
        </section>

        {/* 重置 */}
        <section className="flex flex-col gap-2">
          <button
            type="button"
            onMouseDown={() => setHold(1)}
            onMouseUp={() => {
              setHold(0);
              settings.resetUsed();
              onClearHistory();
            }}
            onMouseLeave={() => setHold(0)}
            onTouchStart={() => setHold(1)}
            onTouchEnd={() => {
              setHold(0);
              settings.resetUsed();
              onClearHistory();
            }}
            className="kid-btn kid-btn-sky w-full"
          >
            🧹 点一下清空对话和今日记录
          </button>
          <button type="button" onClick={onClose} className="kid-btn w-full">
            关闭
          </button>
        </section>
      </div>
    </div>
  );
}

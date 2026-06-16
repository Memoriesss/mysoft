import { useEffect, useState } from "react";
import { snapshot, clear, subscribe, type LogEntry } from "../utils/debugLog";

export default function DebugPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [entries, setEntries] = useState<LogEntry[]>(snapshot());
  useEffect(() => subscribe(() => setEntries(snapshot())), []);

  if (!open) return null;

  function copyToClipboard() {
    const text = entries
      .map((e) => {
        const t = new Date(e.ts).toISOString().slice(11, 19);
        return `${t} [${e.tag}] ${e.text}`;
      })
      .join("\n");
    void navigator.clipboard.writeText(text);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#E5DFD3]">
          <h3 className="text-sm font-medium">运行日志（最近 {entries.length} 条）</h3>
          <div className="flex items-center gap-2">
            <button type="button" onClick={copyToClipboard} className="text-xs px-2 py-1 rounded bg-[#4F6BED] text-white">
              复制全部
            </button>
            <button type="button" onClick={() => clear()} className="text-xs px-2 py-1 rounded border border-[#E5DFD3]">
              清空
            </button>
            <button type="button" onClick={onClose} className="text-xs px-2 py-1 rounded border border-[#E5DFD3]">
              关闭
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-snug bg-[#FAF7F0]">
          {entries.length === 0 ? (
            <div className="text-[#9A9387] py-4 text-center">暂无日志</div>
          ) : (
            entries.map((e, i) => {
              const t = new Date(e.ts).toISOString().slice(11, 19);
              return (
                <div key={i} className="flex gap-2 py-0.5">
                  <span className="text-[#9A9387] shrink-0">{t}</span>
                  <span
                    className={`shrink-0 font-semibold ${
                      e.tag === "LLM"
                        ? "text-[#4F6BED]"
                        : e.tag === "chat"
                        ? "text-[#2D2A26]"
                        : "text-[#6F6A60]"
                    }`}
                  >
                    [{e.tag}]
                  </span>
                  <span className="break-all whitespace-pre-wrap">{e.text}</span>
                </div>
              );
            })
          )}
        </div>
        <div className="px-4 py-2 border-t border-[#E5DFD3] text-[10px] text-[#9A9387]">
          提示：把日志复制给我看，我能直接定位问题
        </div>
      </div>
    </div>
  );
}

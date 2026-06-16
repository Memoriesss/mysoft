import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LimitMin = 5 | 10 | 15 | 20 | 30;

type SettingsState = {
  dailyLimitMin: LimitMin;
  usedSeconds: number; // 今日累计（秒）
  ttsEnabled: boolean; // TTS 语音开关
  voiceRate: number; // 0.7-1.3
  lastResetDate: string;
  // actions
  setLimit: (m: LimitMin) => void;
  toggleTts: () => void;
  addUsed: (sec: number) => void;
  resetUsed: () => void;
  setVoiceRate: (r: number) => void;
  rolloverIfNewDay: () => void;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      dailyLimitMin: 15,
      usedSeconds: 0,
      ttsEnabled: true,
      voiceRate: 0.95,
      lastResetDate: todayStr(),
      setLimit: (m) => set({ dailyLimitMin: m }),
      toggleTts: () => set((s) => ({ ttsEnabled: !s.ttsEnabled })),
      addUsed: (sec) => set((s) => ({ usedSeconds: s.usedSeconds + sec })),
      resetUsed: () => set({ usedSeconds: 0, lastResetDate: todayStr() }),
      setVoiceRate: (r) => set({ voiceRate: Math.max(0.7, Math.min(1.3, r)) }),
      rolloverIfNewDay: () => {
        const t = todayStr();
        if (get().lastResetDate !== t) {
          set({ usedSeconds: 0, lastResetDate: t });
        }
      },
    }),
    {
      name: "kidbot:settings",
      version: 2,
      migrate: (persisted, version) => {
        // v1 -> v2: 重命名 quietMode 为 ttsEnabled (取反)
        const p = (persisted ?? {}) as Record<string, unknown>;
        if (version < 2) {
          return {
            ...p,
            ttsEnabled: p.quietMode === undefined ? true : !p.quietMode,
            voiceRate: p.voiceRate ?? 0.95,
            dailyLimitMin: p.dailyLimitMin ?? 15,
            usedSeconds: 0,
            lastResetDate: todayStr(),
          };
        }
        return p;
      },
    },
  ),
);

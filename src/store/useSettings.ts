import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LimitMin = 5 | 10 | 15 | 20 | 30;

type SettingsState = {
  dailyLimitMin: LimitMin;
  usedSeconds: number; // 今日累计（秒）
  quietMode: boolean;
  voiceName?: string;
  voiceRate: number; // 0.7-1.3
  lastResetDate: string;
  // actions
  setLimit: (m: LimitMin) => void;
  toggleQuiet: () => void;
  addUsed: (sec: number) => void;
  resetUsed: () => void;
  setVoice: (name?: string) => void;
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
      quietMode: false,
      voiceName: undefined,
      voiceRate: 0.92,
      lastResetDate: todayStr(),
      setLimit: (m) => set({ dailyLimitMin: m }),
      toggleQuiet: () => set((s) => ({ quietMode: !s.quietMode })),
      addUsed: (sec) => set((s) => ({ usedSeconds: s.usedSeconds + sec })),
      resetUsed: () => set({ usedSeconds: 0, lastResetDate: todayStr() }),
      setVoice: (name) => set({ voiceName: name }),
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
      version: 1,
    },
  ),
);

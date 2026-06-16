// 浏览器内置 SpeechSynthesis 封装
// 用于在"测试版"中朗读机器人话语，方便用耳朵测试对话流

let cachedVoices: SpeechSynthesisVoice[] = [];
let warmed = false;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    if (voices && voices.length > 0) {
      cachedVoices = voices;
      resolve(voices);
      return;
    }
    const handler = () => {
      const v = synth.getVoices();
      cachedVoices = v;
      synth.onvoiceschanged = null;
      resolve(v);
    };
    synth.onvoiceschanged = handler;
    setTimeout(() => {
      const v = synth.getVoices();
      if (v && v.length > 0) {
        cachedVoices = v;
        synth.onvoiceschanged = null;
        resolve(v);
      } else {
        resolve([]);
      }
    }, 1200);
  });
}

function pickZhVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;
  const zh = voices.filter((v) => v.lang?.toLowerCase().startsWith("zh"));
  if (zh.length === 0) return voices[0];
  const female = zh.find((v) => /female|woman|girl|tingting|xiaoxiao|yating|yaoyao|hui|mei/i.test(v.name));
  return female || zh[0];
}

export async function speak(text: string, opts: { rate?: number; enabled?: boolean } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (opts.enabled === false) return;
  if (!text) return;
  try {
    window.speechSynthesis.cancel();
    const voices = cachedVoices.length > 0 ? cachedVoices : await loadVoices();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickZhVoice(voices);
    if (voice) u.voice = voice;
    u.lang = "zh-CN";
    u.rate = opts.rate ?? 0.95;
    u.pitch = 1.15;
    u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch (e) {
    console.debug("[tts] speak failed", e);
  }
}

export function stopSpeak() {
  if (typeof window === "undefined") return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* noop */
  }
}

export function warmupTts() {
  if (warmed) return;
  warmed = true;
  void loadVoices();
}

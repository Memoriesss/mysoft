// 语音合成封装，浏览器内置 SpeechSynthesis
// 对 4 岁小朋友做了语速放缓、优先中文女声

let cachedVoices: SpeechSynthesisVoice[] = [];

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
    // 兜底：1.2s 后取一次
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
  // 优先女声
  const female = zh.find((v) => /female|woman|girl|tingting|xiaoxiao|yating|yaoyao|hui|mei/i.test(v.name));
  return female || zh[0];
}

export async function speak(text: string, opts: { rate?: number; muted?: boolean; voiceName?: string } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (opts.muted) return;
  try {
    window.speechSynthesis.cancel();
    const voices = cachedVoices.length > 0 ? cachedVoices : await loadVoices();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickZhVoice(voices);
    if (voice) u.voice = voice;
    u.lang = "zh-CN";
    u.rate = opts.rate ?? 0.92;
    u.pitch = 1.18;
    u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch (e) {
    // 静默失败
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

export function isSpeaking(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  return window.speechSynthesis.speaking;
}

// 预热：提前加载一次音色
export function warmupTts() {
  void loadVoices();
}

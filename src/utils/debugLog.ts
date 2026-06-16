// 页面内日志：内存里保留最近 N 条，组件可以渲染出来给用户看
// 这样用户不用开 DevTools 也能看到 bot 的运行状态

export type LogEntry = {
  ts: number;
  tag: string;
  text: string;
};

const BUFFER: LogEntry[] = [];
const MAX = 200;
const LISTENERS = new Set<() => void>();

function nowStr() {
  const d = new Date();
  return (
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0") +
    ":" +
    String(d.getSeconds()).padStart(2, "0")
  );
}

export function log(tag: string, text: string) {
  const entry: LogEntry = { ts: Date.now(), tag, text };
  BUFFER.push(entry);
  if (BUFFER.length > MAX) BUFFER.shift();
  // 同时打 console，方便用 DevTools 抓
  console.log(`[${nowStr()}] [${tag}] ${text}`);
  for (const l of LISTENERS) l();
}

export function snapshot(): LogEntry[] {
  return BUFFER.slice();
}

export function clear() {
  BUFFER.length = 0;
  for (const l of LISTENERS) l();
}

export function subscribe(fn: () => void): () => void {
  LISTENERS.add(fn);
  return () => LISTENERS.delete(fn);
}

// 背景装饰：云朵、星星、纸飞机、彩虹

export function Clouds() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Cloud className="left-[8%] top-[12%]" scale={1.1} delay="0s" />
      <Cloud className="left-[70%] top-[8%]" scale={0.9} delay="2s" />
      <Cloud className="left-[40%] top-[28%]" scale={0.7} delay="4s" />
      <Sparkle className="left-[18%] top-[40%]" />
      <Sparkle className="left-[82%] top-[44%]" />
      <Sparkle className="left-[55%] top-[18%]" />
      <PaperPlane />
    </div>
  );
}

function Cloud({ className, scale, delay }: { className: string; scale: number; delay: string }) {
  return (
    <svg
      className={`absolute ${className} animate-float`}
      width={140 * scale}
      height={70 * scale}
      viewBox="0 0 140 70"
      style={{ animationDelay: delay }}
      aria-hidden
    >
      <g fill="white" opacity="0.85">
        <ellipse cx="30" cy="45" rx="26" ry="22" />
        <ellipse cx="60" cy="35" rx="32" ry="26" />
        <ellipse cx="92" cy="40" rx="28" ry="22" />
        <ellipse cx="118" cy="48" rx="20" ry="16" />
        <rect x="14" y="46" width="118" height="22" rx="11" />
      </g>
    </svg>
  );
}

function Sparkle({ className }: { className: string }) {
  return (
    <svg className={`absolute ${className} animate-sparkle`} width="32" height="32" viewBox="0 0 32 32" aria-hidden>
      <path d="M16 0 L19 13 L32 16 L19 19 L16 32 L13 19 L0 16 L13 13 Z" fill="#FFE066" stroke="#5B3A29" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function PaperPlane() {
  return (
    <svg
      className="absolute top-[6%] animate-drift"
      width="60"
      height="60"
      viewBox="0 0 60 60"
      style={{ animationDuration: "30s" }}
      aria-hidden
    >
      <path d="M5 30 L55 5 L40 55 L30 35 L5 30 Z" fill="#FF8FA3" stroke="#5B3A29" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M30 35 L55 5" stroke="#5B3A29" strokeWidth="2" />
    </svg>
  );
}

/** 用于切换主题时切换背景色调 */
export function TopicTint({ tint }: { tint: string }) {
  const map: Record<string, string> = {
    forest: "rgba(156,215,166,0.45)",
    strawberry: "rgba(255,143,163,0.45)",
    tangerine: "rgba(255,192,120,0.45)",
    sky: "rgba(168,216,240,0.45)",
    lavender: "rgba(183,156,237,0.45)",
    mint: "rgba(127,216,164,0.45)",
  };
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-20 transition-colors duration-700"
      style={{
        background: `radial-gradient(60% 50% at 50% 30%, ${map[tint] ?? "rgba(255,255,255,0.2)"}, transparent 60%)`,
      }}
    />
  );
}

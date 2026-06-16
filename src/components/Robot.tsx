import { useEffect, useState } from "react";

type RobotProps = {
  speaking?: boolean;
  className?: string;
  size?: number; // 像素
};

/**
 * 圆胖机器人小星 — 纯 SVG，零外链
 * 说话时嘴巴开合、腮红浮动；每 3 秒眨眼
 */
export default function Robot({ speaking = false, className = "", size = 220 }: RobotProps) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className={`relative animate-float ${className}`}
      style={{ width: size, height: size }}
      aria-label="小星"
    >
      {/* 装饰光晕 */}
      <div className="absolute inset-0 -z-10 blur-2xl rounded-full bg-lemon/60" />

      <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-[0_18px_24px_rgba(91,58,41,0.18)]">
        {/* 触角 */}
        <g>
          <line x1="80" y1="40" x2="60" y2="20" stroke="#5B3A29" strokeWidth="4" strokeLinecap="round" />
          <circle cx="60" cy="20" r="7" fill="#FF8FA3" />
          <line x1="160" y1="40" x2="180" y2="20" stroke="#5B3A29" strokeWidth="4" strokeLinecap="round" />
          <circle cx="180" cy="20" r="7" fill="#7FD8A4" />
        </g>

        {/* 头（圆胖） */}
        <g>
          <ellipse cx="120" cy="130" rx="92" ry="86" fill="#B79CED" stroke="#5B3A29" strokeWidth="5" />
          {/* 高光 */}
          <ellipse cx="86" cy="100" rx="18" ry="12" fill="white" opacity="0.55" />
        </g>

        {/* 屏幕脸 */}
        <g>
          <rect x="58" y="100" width="124" height="86" rx="34" fill="#FFF8E7" stroke="#5B3A29" strokeWidth="4" />
          {/* 腮红 */}
          <ellipse cx="78" cy="160" rx="12" ry="7" fill="#FF8FA3" opacity="0.85" />
          <ellipse cx="162" cy="160" rx="12" ry="7" fill="#FF8FA3" opacity="0.85" />

          {/* 眼睛 */}
          <g
            style={{
              transformOrigin: "92px 138px",
              transform: blink ? "scaleY(0.1)" : "scaleY(1)",
              transition: "transform 0.12s ease",
            }}
          >
            <ellipse cx="92" cy="138" rx="11" ry="14" fill="#5B3A29" />
            <circle cx="96" cy="133" r="3.6" fill="white" />
          </g>
          <g
            style={{
              transformOrigin: "148px 138px",
              transform: blink ? "scaleY(0.1)" : "scaleY(1)",
              transition: "transform 0.12s ease",
            }}
          >
            <ellipse cx="148" cy="138" rx="11" ry="14" fill="#5B3A29" />
            <circle cx="152" cy="133" r="3.6" fill="white" />
          </g>

          {/* 嘴巴 */}
          {speaking ? (
            <ellipse
              cx="120"
              cy="170"
              rx="14"
              ry="9"
              fill="#5B3A29"
              style={{
                transformOrigin: "120px 170px",
                animation: "mouth 0.6s ease-in-out infinite",
              }}
            />
          ) : (
            <path d="M108 168 Q120 180 132 168" stroke="#5B3A29" strokeWidth="4" fill="none" strokeLinecap="round" />
          )}
        </g>

        {/* 身体简化 — 一截梯形 */}
        <path d="M70 210 L170 210 L186 232 L54 232 Z" fill="#B79CED" stroke="#5B3A29" strokeWidth="5" />
        <circle cx="100" cy="222" r="5" fill="#FFE066" stroke="#5B3A29" strokeWidth="2" />
        <circle cx="140" cy="222" r="5" fill="#7FD8A4" stroke="#5B3A29" strokeWidth="2" />
      </svg>

      {/* 说话光波 */}
      {speaking && (
        <div className="absolute -right-3 top-12 flex flex-col gap-1">
          <span className="w-2 h-2 rounded-full bg-strawberry animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-strawberry animate-bounce" style={{ animationDelay: "120ms" }} />
          <span className="w-2 h-2 rounded-full bg-strawberry animate-bounce" style={{ animationDelay: "240ms" }} />
        </div>
      )}
    </div>
  );
}

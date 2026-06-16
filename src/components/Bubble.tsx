type BubbleProps = {
  text: string;
  from: "bot" | "kid";
  /** 文本里的 emoji 不做特殊处理，由用户/机器人话语自然带 */
  hint?: string;
};

export default function Bubble({ text, from }: BubbleProps) {
  if (from === "bot") {
    return (
      <div className="flex justify-start animate-kb-fade-in">
        <div className="kb-bubble-bot">{text}</div>
      </div>
    );
  }
  return (
    <div className="flex justify-end animate-kb-fade-in">
      <div className="kb-bubble-kid">{text}</div>
    </div>
  );
}

type BubbleProps = {
  text: string;
  from: "bot" | "kid";
  icon?: string;
};

export default function Bubble({ text, from, icon }: BubbleProps) {
  const isBot = from === "bot";
  return (
    <div className={`flex items-end gap-2 ${isBot ? "justify-start" : "justify-end"} animate-whoosh`}>
      {isBot && (
        <div className="w-9 h-9 shrink-0 rounded-full bg-lavender text-white grid place-items-center font-display text-lg shadow-pill border-2 border-cocoa/15">
          ✦
        </div>
      )}
      <div className={`chat-bubble ${isBot ? "chat-bubble-bot" : "chat-bubble-kid"}`}>
        {icon && <span className="mr-1.5 text-2xl align-middle">{icon}</span>}
        {text}
      </div>
    </div>
  );
}

type GameCardProps = {
  emoji: string;
  title: string;
  desc: string;
  tint: "lavender" | "mint" | "sun" | "sky" | "strawberry";
  onClick: () => void;
};

const TINT_BG: Record<GameCardProps["tint"], string> = {
  lavender: "bg-lavender",
  mint: "bg-mint",
  sun: "bg-lemon",
  sky: "bg-sky",
  strawberry: "bg-strawberry",
};

const TINT_TEXT: Record<GameCardProps["tint"], string> = {
  lavender: "text-white",
  mint: "text-cocoa",
  sun: "text-cocoa",
  sky: "text-cocoa",
  strawberry: "text-white",
};

export default function GameCard({ emoji, title, desc, tint, onClick }: GameCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative ${TINT_BG[tint]} ${TINT_TEXT[tint]} rounded-chunk border-4 border-cocoa/15 shadow-pill px-5 py-6 w-full text-left transition-transform hover:-translate-y-1 hover:shadow-soft active:translate-y-0.5`}
    >
      <div className="text-5xl mb-2 group-hover:animate-wiggle">{emoji}</div>
      <div className="font-display text-2xl">{title}</div>
      <div className="text-sm opacity-90 mt-1 font-body">{desc}</div>
      <div className="absolute right-4 top-4 text-2xl">→</div>
    </button>
  );
}

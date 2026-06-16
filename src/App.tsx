import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Welcome from "./pages/Welcome";
import ChatPage from "./pages/ChatPage";
import StoryPage from "./pages/StoryPage";
import ByePage from "./pages/ByePage";
import EmojiGuess from "./games/EmojiGuess";
import ColorFind from "./games/ColorFind";
import NumberClap from "./games/NumberClap";
import { useSettings } from "./store/useSettings";
import { stopSpeak } from "./utils/tts";

type Route =
  | { name: "welcome" }
  | { name: "chat" }
  | { name: "game"; gameId: string }
  | { name: "story"; storyId?: string }
  | { name: "bye" };

function readHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, "");
  if (h.startsWith("game/")) return { name: "game", gameId: h.slice(5) };
  if (h === "story") return { name: "story" };
  if (h === "chat") return { name: "chat" };
  if (h === "bye") return { name: "bye" };
  return { name: "welcome" };
}

function writeHash(r: Route) {
  const map: Record<string, string> = {
    welcome: "#/",
    chat: "#/chat",
    bye: "#/bye",
  };
  const next =
    r.name === "game" ? `#/game/${r.gameId}` :
    r.name === "story" ? "#/story" :
    map[r.name];
  if (window.location.hash !== next) window.location.hash = next;
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => readHash());
  const settings = useSettings();

  useEffect(() => {
    const onHash = () => setRoute(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    settings.rolloverIfNewDay();
    const t = window.setInterval(() => settings.rolloverIfNewDay(), 60_000);
    return () => window.clearInterval(t);
  }, [settings]);

  const go = (p: "chat" | "game" | "story", opts?: { gameId?: string }) => {
    if (p === "chat") {
      setRoute({ name: "chat" });
      writeHash({ name: "chat" });
    } else if (p === "game" && opts?.gameId) {
      setRoute({ name: "game", gameId: opts.gameId });
      writeHash({ name: "game", gameId: opts.gameId });
    } else if (p === "story") {
      setRoute({ name: "story", storyId: opts?.gameId });
      writeHash({ name: "story" });
    }
  };

  const restart = () => {
    setRoute({ name: "welcome" });
    writeHash({ name: "welcome" });
  };

  return (
    <div className="h-full w-full bg-[#FAF7F0]">
      {route.name === "welcome" && <Welcome onEnter={() => go("chat")} />}

      {route.name === "chat" && (
        <ChatPage
          go={go}
          onTimeUp={() => {
            stopSpeak();
            setRoute({ name: "bye" });
            writeHash({ name: "bye" });
          }}
          onClear={() => { /* no-op for now */ }}
        />
      )}

      {route.name === "game" && route.gameId === "emoji" && (
        <GameShell title="猜动物" onExit={() => go("chat")}>
          <EmojiGuess onExit={() => go("chat")} />
        </GameShell>
      )}
      {route.name === "game" && route.gameId === "color" && (
        <GameShell title="颜色问答" onExit={() => go("chat")}>
          <ColorFind onExit={() => go("chat")} />
        </GameShell>
      )}
      {route.name === "game" && route.gameId === "clap" && (
        <GameShell title="数到几" onExit={() => go("chat")}>
          <NumberClap onExit={() => go("chat")} />
        </GameShell>
      )}

      {route.name === "story" && (
        <StoryPage storyId={route.storyId} onExit={() => go("chat")} />
      )}

      {route.name === "bye" && <ByePage onRestart={restart} />}
    </div>
  );
}

function GameShell({ title, children }: { title: string; onExit: () => void; children: ReactNode }) {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-[#E5DFD3] bg-white flex items-center">
        <span className="text-sm font-medium text-[#2D2A26]">{title}</span>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

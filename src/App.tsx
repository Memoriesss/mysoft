import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Clouds } from "./components/Decorations";
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
  const next = r.name === "game" ? `#/game/${r.gameId}` : r.name === "story" ? "#/story" : map[r.name];
  if (window.location.hash !== next) window.location.hash = next;
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => readHash());
  const settings = useSettings();
  const [pendingGame, setPendingGame] = useState<string | null>(null);
  const [pendingStory, setPendingStory] = useState<boolean>(false);

  useEffect(() => {
    const onHash = () => setRoute(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    settings.rolloverIfNewDay();
  }, [settings]);

  // 监听跨日重置
  useEffect(() => {
    const t = setInterval(() => settings.rolloverIfNewDay(), 60_000);
    return () => clearInterval(t);
  }, [settings]);

  const go = (p: "chat" | "game" | "story", opts?: { gameId?: string }) => {
    if (p === "chat") {
      setPendingGame(null);
      setPendingStory(false);
      setRoute({ name: "chat" });
      writeHash({ name: "chat" });
    } else if (p === "game") {
      if (opts?.gameId) {
        setRoute({ name: "game", gameId: opts.gameId });
        writeHash({ name: "game", gameId: opts.gameId });
      }
    } else {
      setRoute({ name: "story", storyId: opts?.gameId });
      writeHash({ name: "story" });
    }
  };

  const restart = () => {
    setPendingGame(null);
    setPendingStory(false);
    setRoute({ name: "welcome" });
    writeHash({ name: "welcome" });
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Clouds />

      {route.name === "welcome" && <Welcome onEnter={() => go("chat")} />}

      {route.name === "chat" && (
        <ChatPage
          go={go}
          triggerGame={pendingGame}
          triggerStory={pendingStory}
          onTimeUp={() => {
            stopSpeak();
            setRoute({ name: "bye" });
            writeHash({ name: "bye" });
          }}
          onClear={() => {
            setPendingGame(null);
            setPendingStory(false);
          }}
        />
      )}

      {route.name === "game" && route.gameId === "emoji" && (
        <GameShell title="emoji 猜猜乐" onExit={() => go("chat")}>
          <EmojiGuess onExit={() => go("chat")} />
        </GameShell>
      )}
      {route.name === "game" && route.gameId === "color" && (
        <GameShell title="颜色找一找" onExit={() => go("chat")}>
          <ColorFind onExit={() => go("chat")} />
        </GameShell>
      )}
      {route.name === "game" && route.gameId === "clap" && (
        <GameShell title="数字拍拍手" onExit={() => go("chat")}>
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
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="font-display text-2xl text-cocoa">{title}</div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

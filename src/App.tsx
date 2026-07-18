import { useState } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { LUNCH_BREAK, STANDARD, type Variant } from "@engine/generation";
import type { OnlineReady } from "@/components/home/OnlineLobby";
import { Home } from "@/screens/Home";
import { LocalGame } from "@/screens/LocalGame";
import { OnlineGame } from "@/screens/OnlineGame";

type Screen =
  | { name: "home" }
  | {
      name: "local";
      seed: string;
      variant: Variant;
      opponent: "human" | "agent";
      difficulty: "fair" | "merciless";
    }
  | {
      name: "online";
      session: OnlineReady;
    };

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convex =
  convexUrl && convexUrl.length > 0
    ? new ConvexReactClient(convexUrl)
    : null;

/** Seeded deep link for demos/tests: ?play=lunch|standard&seed=JUDGES-1&vs=agent */
function initialScreen(): Screen {
  const params = new URLSearchParams(window.location.search);
  // ?reset=1: pristine take for demos — forget the intro, the walkthrough,
  // and (mercifully) what you are.
  if (params.get("reset") === "1") {
    try {
      localStorage.removeItem("nfl.blackForestIntroSeen.v1");
      localStorage.removeItem("nfl.forestIntroSeen.v1");
      localStorage.removeItem("nfl.selfAware.v1");
    } catch {
      /* nothing to forget */
    }
  }
  const play = params.get("play");
  if (play === "lunch" || play === "standard") {
    return {
      name: "local",
      seed: params.get("seed") ?? crypto.randomUUID().slice(0, 8),
      variant: play === "lunch" ? LUNCH_BREAK : STANDARD,
      opponent: params.get("vs") === "agent" ? "agent" : "human",
      difficulty: params.get("ai") === "merciless" ? "merciless" : "fair",
    };
  }
  return { name: "home" };
}

function AppRoutes() {
  const [screen, setScreen] = useState<Screen>(initialScreen);

  if (screen.name === "local") {
    return (
      <LocalGame
        seed={screen.seed}
        variant={screen.variant}
        opponent={screen.opponent}
        difficulty={screen.difficulty}
        onExit={() => setScreen({ name: "home" })}
      />
    );
  }

  if (screen.name === "online") {
    return (
      <OnlineGame
        session={screen.session}
        onExit={() => setScreen({ name: "home" })}
      />
    );
  }

  return (
    <Home
      convexReady={convex !== null}
      onStart={(variant, opponent, difficulty) =>
        setScreen({
          name: "local",
          seed: crypto.randomUUID().slice(0, 8),
          variant,
          opponent,
          difficulty,
        })
      }
      onOnlineReady={(session) => setScreen({ name: "online", session })}
    />
  );
}

export default function App() {
  if (!convex) {
    return <AppRoutes />;
  }
  return (
    <ConvexProvider client={convex}>
      <AppRoutes />
    </ConvexProvider>
  );
}

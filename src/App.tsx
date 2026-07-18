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
  const play = params.get("play");
  if (play === "lunch" || play === "standard") {
    return {
      name: "local",
      seed: params.get("seed") ?? crypto.randomUUID().slice(0, 8),
      variant: play === "lunch" ? LUNCH_BREAK : STANDARD,
      opponent: params.get("vs") === "agent" ? "agent" : "human",
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
      onStart={(variant, opponent) =>
        setScreen({
          name: "local",
          seed: crypto.randomUUID().slice(0, 8),
          variant,
          opponent,
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

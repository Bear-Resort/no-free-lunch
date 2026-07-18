import { useState } from "react";
import { LUNCH_BREAK, STANDARD, type Variant } from "@engine/generation";
import { Home } from "@/screens/Home";
import { LocalGame } from "@/screens/LocalGame";

type Screen =
  | { name: "home" }
  | {
      name: "local";
      seed: string;
      variant: Variant;
      opponent: "human" | "agent";
    };

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

export default function App() {
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

  return (
    <Home
      onStart={(variant, opponent) =>
        setScreen({
          name: "local",
          seed: crypto.randomUUID().slice(0, 8),
          variant,
          opponent,
        })
      }
    />
  );
}

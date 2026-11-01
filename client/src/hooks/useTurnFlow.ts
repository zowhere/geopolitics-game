import { useEffect, useEffectEvent, useState } from "react";
import type { Game } from "../game/Game";
import type { AttackDecision } from "../game/NpcStrategy";

type Phase = "start" | "announce" | "thinking" | "decision" | "skipStamp" | "afterHold" | "yourTurn";

const durations: Record<Exclude<Phase, "yourTurn">, number> = {
  start: 1000,
  announce: 3000,
  thinking: 700,
  decision: 4000,
  skipStamp: 1000,
  afterHold: 3000,
};

export function useTurnFlow(game: Game) {
  const [phase, setPhase] = useState<Phase>("start");
  const [decision, setDecision] = useState<AttackDecision | null>(null);

  function endTurn() {
    game.nextTurn();
    setDecision(null);
    setPhase("announce");
  }

  function advance() {
    if (phase === "start") return setPhase("announce");
    if (phase === "announce") {
      const plan = game.current.planTurn(game);
      setDecision(plan);
      return setPhase(plan ? "thinking" : "yourTurn");
    }
    if (phase === "thinking") return setPhase("decision");
    if (phase === "decision" && decision?.kind === "hold") return setPhase("skipStamp");
    if (phase === "skipStamp") return setPhase("afterHold");
    endTurn();
  }

  const timeUp = useEffectEvent(advance);

  useEffect(() => {
    if (phase === "yourTurn") return;
    const timer = setTimeout(timeUp, durations[phase]);
    return () => clearTimeout(timer);
  }, [phase]);

  return { phase, decision, advance };
}

import { useEffect, useEffectEvent, useState } from "react";
import type { Game } from "../game/Game";
import type { TurnPlan } from "../game/Player";

export type Phase =
  | "start"
  | "announce"
  | "thinking"
  | "deploy"
  | "decision"
  | "skipStamp"
  | "afterHold"
  | "war"
  | "afterWar"
  | "airdrop"
  | "yourTurn";

const durations: Record<Exclude<Phase, "war" | "yourTurn">, number> = {
  start: 1000,
  announce: 3000,
  thinking: 700,
  deploy: 4000,
  decision: 4000,
  skipStamp: 1000,
  afterHold: 3000,
  afterWar: 3500,
  airdrop: 3200,
};

export function useTurnFlow(game: Game) {
  const [phase, setPhase] = useState<Phase>("start");
  const [plan, setPlan] = useState<TurnPlan | null>(null);

  function endTurn() {
    game.nextTurn();
    setPlan(null);
    setPhase("announce");
  }

  function endWar() {
    setPhase("afterWar");
  }

  function advance() {
    if (phase === "start") return setPhase("announce");
    if (phase === "announce") {
      const next = game.current.takeTurn(game);
      setPlan(next);
      if (next) return setPhase("thinking");
      return setPhase(game.reserve > 0 ? "airdrop" : "yourTurn");
    }
    if (phase === "thinking") return setPhase(plan?.deployed ? "deploy" : "decision");
    if (phase === "deploy") return setPhase("decision");
    if (phase === "decision") return setPhase(plan?.attack.kind === "attack" ? "war" : "skipStamp");
    if (phase === "skipStamp") return setPhase("afterHold");
    if (phase === "airdrop") return setPhase("yourTurn");
    if (phase === "war" || phase === "yourTurn") return;
    endTurn();
  }

  const timeUp = useEffectEvent(advance);

  useEffect(() => {
    if (phase === "war" || phase === "yourTurn") return;
    const timer = setTimeout(timeUp, durations[phase]);
    return () => clearTimeout(timer);
  }, [phase]);

  return { phase, plan, advance, endWar, endTurn };
}

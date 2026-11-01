import { useEffect, useEffectEvent, useState } from "react";
import { Battle } from "../game/Battle";
import type { Game } from "../game/Game";
import { NpcPlayer } from "../game/NpcPlayer";
import type { Territory } from "../game/Territory";

export type WarPhase = "ready" | "rolling" | "score" | "between" | "conquered" | "failed" | "retreat";

const durations: Record<WarPhase, number> = {
  ready: 1300,
  rolling: 1700,
  score: 2600,
  between: 800,
  conquered: 1800,
  failed: 2200,
  retreat: 1600,
};

export function useWar(game: Game, from: Territory, to: Territory, onEnd: () => void) {
  const npc = game.current instanceof NpcPlayer ? game.current : null;
  const [phase, setPhase] = useState<WarPhase>("ready");
  const [battle, setBattle] = useState<Battle | null>(null);
  const [battleNumber, setBattleNumber] = useState(1);

  function roll() {
    setBattle(Battle.roll(from, to));
    setPhase("rolling");
  }

  function stop() {
    setPhase("retreat");
  }

  function nextBattle() {
    setBattle(null);
    setBattleNumber((count) => count + 1);
    setPhase(npc ? "between" : "ready");
  }

  function advance() {
    if (phase === "ready") {
      if (npc) roll();
    } else if (phase === "rolling" && battle) {
      game.fight(from, to, battle);
      setPhase("score");
    } else if (phase === "score") {
      if (to.soldiers === 0) setPhase("conquered");
      else if (from.soldiers < 2) setPhase("failed");
      else if (npc && !npc.keepAttacking(from)) setPhase("retreat");
      else nextBattle();
    } else if (phase === "between") {
      setPhase("ready");
    } else {
      if (phase === "conquered") game.conquer(npc ? npc.soldiersToMoveIn(game, from, to) : 1);
      onEnd();
    }
  }

  const timeUp = useEffectEvent(advance);

  useEffect(() => {
    if (phase === "ready" && !npc) return;
    const timer = setTimeout(timeUp, durations[phase]);
    return () => clearTimeout(timer);
  }, [phase, npc]);

  return { phase, battle, battleNumber, canRoll: phase === "ready" && !npc, roll, stop, advance };
}

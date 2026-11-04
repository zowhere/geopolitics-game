import { useContext, useEffect, useEffectEvent, useMemo, useState } from "react";
import { Battle } from "../game/Battle";
import type { WarOutcome } from "../game/Commentator";
import type { Game } from "../game/Game";
import { NpcPlayer } from "../game/NpcPlayer";
import type { Territory } from "../game/Territory";
import { PaceContext, PausedContext } from "./PaceContext";

export type WarPhase =
  | "ready"
  | "rolling"
  | "score"
  | "casualties"
  | "regroup"
  | "strike"
  | "between"
  | "occupied"
  | "occupation"
  | "failed"
  | "retreat";

export type Salvo = {
  attackerWins: boolean;
  start: number;
};

export const strike = {
  pairGap: 500,
  missileGap: 240,
  flight: 1700,
  afterHit: 2000,
  shortest: 6000,
};

const durations: Partial<Record<WarPhase, number>> = {
  ready: 1300,
  rolling: 1700,
  score: 2600,
  casualties: 2500,
  regroup: 1000,
  between: 800,
  occupied: 1800,
  failed: 2200,
  retreat: 1600,
};

function salvosFor(battle: Battle): Salvo[] {
  return battle.attackerDice.flatMap((attacker, pair) => {
    const defender = battle.defenderDice[pair];
    if (attacker === defender) return [];
    return [{ attackerWins: attacker > defender, start: pair * strike.pairGap }];
  });
}

function strikeDuration(salvos: Salvo[]) {
  const lastStart = Math.max(...salvos.map((salvo) => salvo.start));
  return Math.max(strike.shortest, lastStart + 2 * strike.missileGap + strike.flight + strike.afterHit);
}

export function useWar(game: Game, from: Territory, to: Territory, onChange: () => void, onEnd: () => void) {
  const npc = game.current instanceof NpcPlayer ? game.current : null;
  const pace = useContext(PaceContext);
  const paused = useContext(PausedContext);
  const [phase, setPhase] = useState<WarPhase>("ready");
  const [battle, setBattle] = useState<Battle | null>(null);
  const [battleNumber, setBattleNumber] = useState(1);
  const [comment, setComment] = useState("");
  const salvos = useMemo(() => (battle ? salvosFor(battle) : []), [battle]);

  function roll() {
    setBattle(Battle.roll(from, to));
    setPhase("rolling");
  }

  function finish(outcome: WarOutcome, reason?: string) {
    game.commentator.warEnded(game.current, outcome, to, reason);
    setPhase(outcome);
  }

  function stop() {
    finish("retreat");
  }

  function endBattle() {
    if (to.soldiers === 0) finish("occupied");
    else if (from.soldiers < 2) finish("failed");
    else if (npc && !npc.keepAttacking(from)) finish("retreat", `Keep ${from.soldiers} soldiers to hold ${from.name}`);
    else nextBattle();
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
      setComment(game.commentator.battle(battle, from, to));
      setPhase("score");
    } else if (phase === "score" && battle) {
      game.fight(from, to, battle);
      onChange();
      setPhase("casualties");
    } else if (phase === "casualties") {
      setPhase("regroup");
    } else if (phase === "regroup" && salvos.length) {
      setPhase("strike");
    } else if (phase === "regroup" || phase === "strike") {
      endBattle();
    } else if (phase === "between") {
      setPhase("ready");
    } else if (phase === "occupied") {
      setPhase("occupation");
    } else if (phase !== "occupation") {
      onEnd();
    }
  }

  function occupy(soldiersMovingIn: number) {
    game.occupy(soldiersMovingIn);
    onEnd();
  }

  const timeUp = useEffectEvent(advance);
  const wait = phase === "strike" ? strikeDuration(salvos) : durations[phase];

  useEffect(() => {
    if (wait === undefined || paused || (phase === "ready" && !npc)) return;
    const timer = setTimeout(timeUp, wait / pace);
    return () => clearTimeout(timer);
  }, [phase, npc, wait, pace, paused]);

  return {
    phase,
    battle,
    battleNumber,
    comment,
    salvos,
    canRoll: phase === "ready" && !npc,
    autoMoveIn: npc ? npc.soldiersToMoveIn(game, from, to) : null,
    roll,
    stop,
    occupy,
    advance,
  };
}

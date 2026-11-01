import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { Battle } from "../game/Battle";
import type { WarOutcome } from "../game/Commentator";
import type { Game } from "../game/Game";
import { NpcPlayer } from "../game/NpcPlayer";
import type { Territory } from "../game/Territory";

export type WarPhase =
  | "ready"
  | "rolling"
  | "score"
  | "strike"
  | "between"
  | "occupied"
  | "occupation"
  | "failed"
  | "retreat";

export type Salvo = {
  pair: number;
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
  between: 800,
  occupied: 1800,
  failed: 2200,
  retreat: 1600,
};

function salvosFor(battle: Battle): Salvo[] {
  return battle.attackerDice.flatMap((attacker, pair) => {
    const defender = battle.defenderDice[pair];
    if (attacker === defender) return [];
    return [{ pair, attackerWins: attacker > defender, start: pair * strike.pairGap }];
  });
}

function strikeDuration(salvos: Salvo[]) {
  const lastStart = Math.max(...salvos.map((salvo) => salvo.start));
  return Math.max(strike.shortest, lastStart + 2 * strike.missileGap + strike.flight + strike.afterHit);
}

export function useWar(game: Game, from: Territory, to: Territory, onHit: () => void, onEnd: () => void) {
  const npc = game.current instanceof NpcPlayer ? game.current : null;
  const [phase, setPhase] = useState<WarPhase>("ready");
  const [battle, setBattle] = useState<Battle | null>(null);
  const [battleNumber, setBattleNumber] = useState(1);
  const [landed, setLanded] = useState(0);
  const [comment, setComment] = useState("");
  const salvos = useMemo(() => (battle ? salvosFor(battle) : []), [battle]);

  function roll() {
    setBattle(Battle.roll(from, to));
    setPhase("rolling");
  }

  function finish(outcome: WarOutcome) {
    game.commentator.warEnded(game.current, outcome, to);
    setPhase(outcome);
  }

  function stop() {
    finish("retreat");
  }

  function land(count: number) {
    if (!battle) return;
    for (const salvo of salvos.slice(landed, count)) game.fight(from, to, battle.pair(salvo.pair));
    setLanded(count);
    onHit();
  }

  function hit() {
    land(landed + 1);
  }

  function endBattle() {
    if (to.soldiers === 0) finish("occupied");
    else if (from.soldiers < 2) finish("failed");
    else if (npc && !npc.keepAttacking(from)) finish("retreat");
    else nextBattle();
  }

  function nextBattle() {
    setBattle(null);
    setLanded(0);
    setBattleNumber((count) => count + 1);
    setPhase(npc ? "between" : "ready");
  }

  function advance() {
    if (phase === "ready") {
      if (npc) roll();
    } else if (phase === "rolling" && battle) {
      setComment(game.commentator.battle(battle, from, to));
      setPhase("score");
    } else if (phase === "score" && salvos.length) {
      setPhase("strike");
    } else if (phase === "score" && battle) {
      game.fight(from, to, battle);
      endBattle();
    } else if (phase === "strike") {
      land(salvos.length);
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
    if (wait === undefined || (phase === "ready" && !npc)) return;
    const timer = setTimeout(timeUp, wait);
    return () => clearTimeout(timer);
  }, [phase, npc, wait]);

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
    hit,
    occupy,
    advance,
  };
}

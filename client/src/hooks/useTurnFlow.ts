import { useEffect, useEffectEvent, useState } from "react";
import type { Game } from "../game/Game";
import type { Transfer } from "../game/NpcStrategy";
import type { Player, TurnPlan } from "../game/Player";
import type { Territory } from "../game/Territory";

export type Phase =
  | "start"
  | "announce"
  | "thinking"
  | "deploy"
  | "decision"
  | "skipStamp"
  | "afterHold"
  | "war"
  | "eliminated"
  | "afterWar"
  | "transfer"
  | "airdrop"
  | "yourTurn"
  | "defeated"
  | "gameOver";

type War = {
  from: Territory;
  to: Territory;
  defender: number;
};

const durations: Partial<Record<Phase, number>> = {
  start: 1000,
  announce: 3000,
  thinking: 700,
  deploy: 4000,
  decision: 5000,
  skipStamp: 1000,
  afterHold: 3000,
  eliminated: 1300,
  afterWar: 3500,
  transfer: 2000,
  airdrop: 3200,
};

export function useTurnFlow(game: Game, fastPace: number) {
  const [phase, setPhase] = useState<Phase>("start");
  const [plan, setPlan] = useState<TurnPlan | null>(null);
  const [war, setWar] = useState<War | null>(null);
  const [out, setOut] = useState<Player | null>(null);
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [fast, setFast] = useState(false);
  const pace = fast ? fastPace : 1;

  function endTurn() {
    game.nextTurn();
    setPlan(null);
    setTransfer(null);
    setPhase("announce");
  }

  function startWar(from: Territory, to: Territory) {
    if (game.current.human) game.commentator.invading(game.current, to);
    setWar({ from, to, defender: to.owner });
    setPhase("war");
  }

  function endWar() {
    game.endWar();
    const loser = war && game.isEliminated(war.defender) ? game.players[war.defender] : null;
    setWar(null);
    setOut(loser);
    if (loser) {
      game.commentator.eliminated(loser);
      setPhase("eliminated");
    } else {
      carryOn();
    }
  }

  function carryOn() {
    if (game.winner) setPhase("gameOver");
    else setPhase(game.current.human ? "yourTurn" : "afterWar");
  }

  function fortify() {
    const move = game.current.fortify(game);
    if (!move) return endTurn();
    game.commentator.transferred(game.current, move);
    setTransfer(move);
    setPhase("transfer");
  }

  function watch() {
    setPhase("afterWar");
  }

  function decide(next: TurnPlan) {
    const { attack } = next;
    if (attack.kind === "attack") game.commentator.invading(game.current, attack.to, attack.reason);
    else game.commentator.holding(game.current, attack.reason);
    setPhase("decision");
  }

  function advance() {
    if (durations[phase] === undefined) return;
    if (phase === "start") return setPhase("announce");
    if (phase === "announce") {
      const next = game.current.takeTurn(game);
      setPlan(next);
      if (next) return setPhase("thinking");
      setFast(false);
      return setPhase(game.reserve > 0 ? "airdrop" : "yourTurn");
    }
    if (phase === "thinking" && plan?.deployed) {
      game.commentator.deployed(game.current, plan.deployed);
      return setPhase("deploy");
    }
    if ((phase === "thinking" || phase === "deploy") && plan) return decide(plan);
    if (phase === "decision" && plan?.attack.kind === "attack") return startWar(plan.attack.from, plan.attack.to);
    if (phase === "decision") return setPhase("skipStamp");
    if (phase === "skipStamp") return setPhase("afterHold");
    if (phase === "airdrop") return setPhase("yourTurn");
    if (phase === "eliminated" && out?.human && !game.winner) return setPhase("defeated");
    if (phase === "eliminated") return carryOn();
    if (phase === "afterHold" || phase === "afterWar") return fortify();
    endTurn();
  }

  const timeUp = useEffectEvent(advance);

  useEffect(() => {
    const wait = durations[phase];
    if (wait === undefined) return;
    const timer = setTimeout(timeUp, wait / pace);
    return () => clearTimeout(timer);
  }, [phase, pace]);

  function toggleFast() {
    setFast(!fast);
  }

  return { phase, plan, war, out, transfer, pace, advance, startWar, endWar, endTurn, watch, toggleFast };
}

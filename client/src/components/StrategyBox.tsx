import { Battle } from "../game/Battle";
import type { Game } from "../game/Game";
import { fewestToAttackFrom, type Transfer } from "../game/NpcStrategy";
import type { TurnPlan } from "../game/Player";
import "./StrategyBox.css";

type StrategyBoxProps = {
  game: Game;
  plan: TurnPlan;
  deploying: boolean;
  transfer: Transfer | null;
};

function linesFor(game: Game, { deployed, attack }: TurnPlan, deploying: boolean, transfer: Transfer | null) {
  if (transfer) {
    const { from, to, count, reason } = transfer;
    const numbers = `${from.name} ${from.soldiers + count} → ${from.soldiers} · ${to.name} ${to.soldiers - count} → ${to.soldiers}`;
    return { reason, target: to.name, numbers };
  }
  if (deploying && deployed) {
    const { to, count, target, reason } = deployed;
    const build = `${to.name} ${to.soldiers - count} + ${count} → ${to.soldiers}`;
    return { reason, target: (target ?? to).name, numbers: target ? `${build} vs ${target.name} ${target.soldiers}` : build };
  }
  if (attack.kind === "attack") {
    const { from, to, reason } = attack;
    const edge = from.soldiers - to.soldiers;
    const dice = Battle.diceCount(from, to);
    return { reason, target: to.name, numbers: `${from.name} ${from.soldiers} ⚔ ${to.name} ${to.soldiers} · edge +${edge} · ${dice} ${dice === 1 ? "die" : "dice"}` };
  }
  const strongest = game
    .territoriesOf(game.currentIndex)
    .reduce((best, territory) => (territory.soldiers > best.soldiers ? territory : best));
  const blocker = strongest.soldiers < fewestToAttackFrom ? `needs ${fewestToAttackFrom} to attack` : "no weaker rival";
  return { reason: attack.reason, target: "None", numbers: `${strongest.name} ${strongest.soldiers} · ${blocker}` };
}

function StrategyBox({ game, plan, deploying, transfer }: StrategyBoxProps) {
  const { reason, target, numbers } = linesFor(game, plan, deploying, transfer);
  return (
    <aside className="strategy-box">
      <h2 className="strategy-title">Strategy</h2>
      <p>{reason}</p>
      <p className="strategy-calculating">Calculating</p>
      <p>
        Target: <b>{target}</b>
      </p>
      <p className="strategy-numbers">{numbers}</p>
    </aside>
  );
}

export default StrategyBox;

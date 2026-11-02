import type { Battle } from "./Battle";
import type { Reinforcement, Transfer } from "./NpcStrategy";
import type { Player } from "./Player";
import type { Territory } from "./Territory";

export type Entry = {
  who: string;
  text: string;
  reason?: string;
  heading?: boolean;
};

export type WarOutcome = "occupied" | "failed" | "retreat";

const outcomeText: Record<WarOutcome, (target: string) => string> = {
  occupied: (target) => `Occupied ${target}`,
  failed: (target) => `Attack on ${target} failed`,
  retreat: (target) => `Retreated from ${target}`,
};

function nameOf(player: Player) {
  return player.human ? "You" : player.country.name;
}

export class Commentator {
  private readonly lines: Entry[] = [];

  get entries(): readonly Entry[] {
    return this.lines;
  }

  round(number: number) {
    this.lines.push({ who: "", text: `Round ${number}`, heading: true });
  }

  deployed(player: Player, { to, count, reason }: Reinforcement) {
    this.lines.push({ who: nameOf(player), text: `Deployed ${count} soldiers to ${to.name}`, reason });
  }

  holding(player: Player, reason: string) {
    this.lines.push({ who: nameOf(player), text: "Holding position", reason });
  }

  invading(player: Player, target: Territory, reason?: string) {
    this.lines.push({ who: nameOf(player), text: `Invading ${target.name}`, reason });
  }

  battle(battle: Battle, from: Territory, to: Territory) {
    const won = battle.defenderLosses;
    const lost = battle.attackerLosses;
    const [attacker, defender] = [battle.attackerDice[0], battle.defenderDice[0]];
    const [high, low] =
      battle.attackerDice.length === 1
        ? [Math.max(attacker, defender), Math.min(attacker, defender)]
        : [Math.max(won, lost), Math.min(won, lost)];
    const text = won === lost ? "Draw" : `${won > lost ? from.name : to.name} wins ${high} to ${low}`;
    this.lines.push({ who: "", text });
    return text;
  }

  warEnded(player: Player, outcome: WarOutcome, target: Territory) {
    this.lines.push({ who: nameOf(player), text: outcomeText[outcome](target.name) });
  }

  transferred(player: Player, { from, to, count, reason }: Transfer) {
    this.lines.push({ who: nameOf(player), text: `Moved ${count} soldiers from ${from.name} to ${to.name}`, reason });
  }

  eliminated(player: Player) {
    this.lines.push({ who: nameOf(player), text: "Out of the game" });
  }
}

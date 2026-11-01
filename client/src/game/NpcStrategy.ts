import { PriorityQueue } from "./PriorityQueue";
import type { Territory } from "./Territory";

export type Reinforcement = {
  to: Territory;
  reason: string;
};

export type AttackDecision =
  | { kind: "attack"; from: Territory; to: Territory; reason: string }
  | { kind: "hold"; reason: string };

type AttackOption = {
  from: Territory;
  to: Territory;
  advantage: number;
};

const fewestToAttackFrom = 3;
const stopAttackingAt = 2;

function isBetterOption(a: AttackOption, b: AttackOption) {
  if (a.advantage !== b.advantage) return a.advantage > b.advantage;
  return a.to.soldiers < b.to.soldiers;
}

export class NpcStrategy {
  private bestOption(territories: readonly Territory[], player: number, extraSoldiers = 0) {
    const options = new PriorityQueue<AttackOption>(isBetterOption);
    const own = territories.filter((territory) => territory.owner === player);
    const enemies = territories.filter((territory) => territory.owner !== player);
    for (const from of own) {
      const soldiers = from.soldiers + extraSoldiers;
      if (soldiers < fewestToAttackFrom) continue;
      for (const to of enemies) {
        if (soldiers > to.soldiers) options.push({ from, to, advantage: soldiers - to.soldiers });
      }
    }
    return options.pop();
  }

  placeReinforcements(territories: readonly Territory[], player: number, count: number): Reinforcement {
    const plan = this.bestOption(territories, player, count);
    if (plan) return { to: plan.from, reason: `Best strategy: mass troops to strike ${plan.to.name}` };
    const strongest = territories
      .filter((territory) => territory.owner === player)
      .reduce((best, territory) => (territory.soldiers > best.soldiers ? territory : best));
    return { to: strongest, reason: "Best strategy: strengthen the strongest position" };
  }

  chooseAttack(territories: readonly Territory[], player: number): AttackDecision {
    const plan = this.bestOption(territories, player);
    if (!plan) return { kind: "hold", reason: "Best strategy: build up before attacking" };
    return { kind: "attack", from: plan.from, to: plan.to, reason: "Best strategy: hit the weakest target first" };
  }

  keepAttacking(from: Territory) {
    return from.soldiers > stopAttackingAt;
  }

  soldiersToMoveIn(attackerSoldiers: number) {
    return Math.max(1, Math.floor((attackerSoldiers - 1) / 2));
  }
}

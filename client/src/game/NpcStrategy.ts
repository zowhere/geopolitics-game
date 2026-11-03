import { PriorityQueue } from "../utils/PriorityQueue"; //npc's need to choose best country to attack
import type { Territory } from "./Territory";

export type Reinforcement = {
  to: Territory;
  count: number;
  target?: Territory;
  reason: string;
};

export type Transfer = {
  from: Territory;
  to: Territory;
  count: number;
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

export const fewestToAttackFrom = 3;
const stopAttackingAt = 2;
const smallestTransfer = 2;

function isBetterOption(a: AttackOption, b: AttackOption) {
  if (a.advantage !== b.advantage) return a.advantage > b.advantage;
  return a.to.soldiers < b.to.soldiers;
}

function strongest(territories: Territory[]) {
  return territories.reduce((best, territory) =>
    territory.soldiers > best.soldiers ? territory : best,
  );
}

function weakest(territories: Territory[]) {
  return territories.reduce((worst, territory) =>
    territory.soldiers < worst.soldiers ? territory : worst,
  );
}

function strengthOf(territories: readonly Territory[], player: number) {
  return territories
    .filter((territory) => territory.owner === player)
    .reduce((total, territory) => total + territory.soldiers, 0);
}

export class NpcStrategy {
  private bestOption(
    territories: readonly Territory[],
    player: number,
    extraSoldiers = 0,
  ) {
    const options = new PriorityQueue<AttackOption>(isBetterOption); //creates priority of possible attacks
    const own = territories.filter((territory) => territory.owner === player); //get all territories owned by the npc
    const strength = strengthOf(territories, player) + extraSoldiers; //calculates npc total soldier strenght

    //Finds enemies with equal or weaker total soldier strength.
    const enemies = territories.filter(
      (territory) =>
        territory.owner !== player &&
        strengthOf(territories, territory.owner) <= strength,
    );
    //loop through all owned territories and check if they have enough soldiers to attack any of the enemies.
    // Yes- add the option to the priority queue.
    for (const from of own) {
      const soldiers = from.soldiers + extraSoldiers;
      if (soldiers < fewestToAttackFrom) continue;
      for (const to of enemies) {
        if (soldiers > to.soldiers)
          options.push({ from, to, advantage: soldiers - to.soldiers });
      }
    }
    return options.pop(); //returns highest priority attack
  }

  placeReinforcements(
    territories: readonly Territory[],
    player: number,
    count: number,
  ): Reinforcement {
    const plan = this.bestOption(territories, player, count);
    if (plan)
      return {
        to: plan.from,
        count,
        target: plan.to,
        reason: `Mass troops to strike ${plan.to.name}`,
      };
    const own = territories.filter((territory) => territory.owner === player);
    return { to: weakest(own), count, reason: "Shore up the weakest country" };
  }

  chooseAttack(
    territories: readonly Territory[],
    player: number,
  ): AttackDecision {
    const plan = this.bestOption(territories, player);
    if (!plan) return { kind: "hold", reason: "Build up before attacking" };
    return {
      kind: "attack",
      from: plan.from,
      to: plan.to,
      reason: "Hit the weakest link",
    };
  }

  planTransfer(
    territories: readonly Territory[],
    player: number,
  ): Transfer | null {
    const own = territories.filter((territory) => territory.owner === player);
    const from = strongest(own);
    const to = weakest(own);
    const count = Math.floor((from.soldiers - to.soldiers) / 2);
    if (from === to || count < smallestTransfer) return null;
    return { from, to, count, reason: "Shore up the weakest country" };
  }

  keepAttacking(from: Territory) {
    return from.soldiers > stopAttackingAt;
  }

  soldiersToMoveIn(attackerSoldiers: number) {
    return Math.max(1, Math.floor((attackerSoldiers - 1) / 2));
  }
}

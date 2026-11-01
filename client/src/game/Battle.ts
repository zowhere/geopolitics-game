import type { Territory } from "./Territory";

export const rollDie = () => 1 + Math.floor(Math.random() * 6);

export class Battle {
  readonly attackerDice: readonly number[];
  readonly defenderDice: readonly number[];

  constructor(attackerDice: number[], defenderDice: number[]) {
    if (attackerDice.length !== defenderDice.length) throw new Error("Both sides roll the same number of dice");
    this.attackerDice = attackerDice;
    this.defenderDice = defenderDice;
  }

  static diceCount(attacker: Territory, defender: Territory) {
    return Math.min(attacker.soldiers - 1, defender.soldiers);
  }

  static roll(attacker: Territory, defender: Territory, roll = rollDie) {
    const count = Battle.diceCount(attacker, defender);
    return new Battle(
      Array.from({ length: count }, roll),
      Array.from({ length: count }, roll),
    );
  }

  pair(index: number) {
    return new Battle([this.attackerDice[index]], [this.defenderDice[index]]);
  }

  get attackerLosses() {
    return this.attackerDice.filter((die, index) => die < this.defenderDice[index]).length;
  }

  get defenderLosses() {
    return this.attackerDice.filter((die, index) => die > this.defenderDice[index]).length;
  }
}

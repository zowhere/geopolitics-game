import type { Country } from "./countries";

export class Territory {
  readonly country: Country;
  private ownerIndex: number;
  private soldierCount: number;

  constructor(country: Country, owner: number, soldiers = country.soldiers) {
    this.country = country;
    this.ownerIndex = owner;
    this.soldierCount = soldiers;
  }

  get name() {
    return this.country.name;
  }

  get value() {
    return this.country.soldiers;
  }

  get owner() {
    return this.ownerIndex;
  }

  get soldiers() {
    return this.soldierCount;
  }

  addSoldiers(count: number) {
    if (count < 1) throw new Error("Add at least 1 soldier");
    this.soldierCount += count;
  }

  loseSoldiers(count: number) {
    this.soldierCount = Math.max(0, this.soldierCount - count);
  }

  moveSoldiersTo(target: Territory, count: number) {
    if (target === this || target.owner !== this.owner) {
      throw new Error("Soldiers can only move to another country you own");
    }
    if (count < 1 || count > this.soldierCount - 1) {
      throw new Error("A country must keep at least 1 soldier");
    }
    this.soldierCount -= count;
    target.soldierCount += count;
  }

  takeOver(newOwner: number) {
    if (this.soldierCount > 0) throw new Error("A country can only be taken once it has no soldiers left");
    this.ownerIndex = newOwner;
  }
}

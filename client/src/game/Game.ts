import { Battle } from "./Battle";
import { Commentator } from "./Commentator";
import type { Country } from "./countries";
import { HumanPlayer } from "./HumanPlayer";
import { NpcPlayer } from "./NpcPlayer";
import type { Player } from "./Player";
import { Territory } from "./Territory";
import { shuffle } from "../utils/shuffle";

type War = {
  from: Territory;
  to: Territory;
};

export class Game {
  readonly players: readonly Player[];
  readonly territories: readonly Territory[];
  readonly commentator = new Commentator();
  private roundNumber = 1;
  private turnIndex = 0;
  private reserveCount = 0;
  private war: War | null = null;
  private warOver = false;
  private readonly losses: number[];

  constructor(humanCountry: string, countries: readonly Country[]) {
    const human = countries.find((country) => country.name === humanCountry)!;
    const rivals = shuffle(countries.filter((country) => country !== human));
    this.players = shuffle([human, ...rivals.slice(0, 9)]).map((country) =>
      country === human ? new HumanPlayer(country) : new NpcPlayer(country),
    );
    this.territories = this.players.map(
      (player, index) => new Territory(player.country, index),
    );
    this.losses = this.players.map(() => 0);
    this.commentator.round(1);
  }

  get round() {
    return this.roundNumber;
  }

  get currentIndex() {
    return this.turnIndex;
  }

  get current() {
    return this.players[this.turnIndex];
  }

  get reserve() {
    return this.reserveCount;
  }

  get attacked() {
    return this.warOver;
  }

  get winner() {
    const owner = this.territories[0].owner;
    return this.territories.every((territory) => territory.owner === owner)
      ? this.players[owner]
      : undefined;
  }

  territoriesOf(player: number) {
    return this.territories.filter((territory) => territory.owner === player);
  }

  soldiersLostBy(player: number) {
    return this.losses[player];
  }

  isEliminated(player: number) {
    return this.territoriesOf(player).length === 0;
  }

  occupationBonus(territory: Territory) {
    return Math.max(2, Math.floor(territory.value / 2));
  }

  placeReinforcements(territory: Territory, count: number) {
    this.mustOwn(territory);
    if (count < 1 || count > this.reserveCount)
      throw new Error("Not enough soldiers in reserve");
    territory.addSoldiers(count);
    this.reserveCount -= count;
  }

  moveSoldiers(from: Territory, to: Territory, count: number) {
    this.mustOwn(from);
    this.mustPlaceReserveFirst();
    from.moveSoldiersTo(to, count);
  }

  canAttack(from: Territory, to: Territory) {
    const sameWar = !this.war || (this.war.from === from && this.war.to === to);
    return (
      sameWar &&
      !this.warOver &&
      this.reserveCount === 0 &&
      from.owner === this.turnIndex &&
      to.owner !== this.turnIndex &&
      from.soldiers >= 2 &&
      to.soldiers > 0
    );
  }

  fight(from: Territory, to: Territory, battle = Battle.roll(from, to)) {
    if (!this.canAttack(from, to))
      throw new Error("That attack is not allowed");
    this.war = { from, to };
    this.losses[from.owner] += battle.attackerLosses;
    this.losses[to.owner] += battle.defenderLosses;
    from.loseSoldiers(battle.attackerLosses);
    to.loseSoldiers(battle.defenderLosses);
    return battle;
  }

  occupy(soldiersMovingIn: number) {
    if (!this.war || this.war.to.soldiers > 0)
      throw new Error("There is no country to occupy");
    const { from, to } = this.war;
    const bonus = this.occupationBonus(to);
    from.addSoldiers(bonus);
    to.takeOver(this.turnIndex);
    from.moveSoldiersTo(to, soldiersMovingIn);
    return bonus;
  }

  endWar() {
    this.warOver = true;
  }

  nextTurn() {
    this.war = null;
    this.warOver = false;
    do {
      this.turnIndex = (this.turnIndex + 1) % this.players.length;
      if (this.turnIndex === 0) this.commentator.round(++this.roundNumber);
    } while (this.isEliminated(this.turnIndex) && !this.winner);
    this.reserveCount =
      this.roundNumber >= 2 ? this.territoriesOf(this.turnIndex).length * 2 : 0;
  }

  private mustOwn(territory: Territory) {
    if (territory.owner !== this.turnIndex)
      throw new Error("You can only use countries you own");
  }

  private mustPlaceReserveFirst() {
    if (this.reserveCount > 0)
      throw new Error("Place all your new soldiers first");
  }
}

import type { Country } from "./countries";
import type { Game } from "./Game";
import type { AttackDecision } from "./NpcStrategy";

export abstract class Player {
  readonly country: Country;

  constructor(country: Country) {
    this.country = country;
  }

  abstract get human(): boolean;

  abstract planTurn(game: Game): AttackDecision | null;
}

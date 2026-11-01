import type { Country } from "./countries";
import type { Game } from "./Game";
import type { AttackDecision, Reinforcement } from "./NpcStrategy";

export type TurnPlan = {
  deployed: Reinforcement | null;
  attack: AttackDecision;
};

export abstract class Player {
  readonly country: Country;

  constructor(country: Country) {
    this.country = country;
  }

  abstract get human(): boolean;

  abstract takeTurn(game: Game): TurnPlan | null;
}

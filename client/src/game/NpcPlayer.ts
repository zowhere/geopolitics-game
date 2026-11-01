import type { Game } from "./Game";
import { NpcStrategy } from "./NpcStrategy";
import { Player } from "./Player";

const strategy = new NpcStrategy();

export class NpcPlayer extends Player {
  get human() {
    return false;
  }

  planTurn(game: Game) {
    return strategy.chooseAttack(game.territories, game.currentIndex);
  }
}

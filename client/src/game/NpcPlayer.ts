import type { Game } from "./Game";
import { NpcStrategy } from "./NpcStrategy";
import { Player } from "./Player";
import type { Territory } from "./Territory";

const strategy = new NpcStrategy();

export class NpcPlayer extends Player {
  get human() {
    return false;
  }

  takeTurn(game: Game) {
    const player = game.currentIndex;
    const deployed = game.reserve > 0 ? strategy.placeReinforcements(game.territories, player, game.reserve) : null;
    if (deployed) game.placeReinforcements(deployed.to, deployed.count);
    return { deployed, attack: strategy.chooseAttack(game.territories, player) };
  }

  keepAttacking(from: Territory) {
    return strategy.keepAttacking(from);
  }

  soldiersToMoveIn(game: Game, from: Territory, to: Territory) {
    return strategy.soldiersToMoveIn(from.soldiers + game.conquestBonus(to));
  }
}

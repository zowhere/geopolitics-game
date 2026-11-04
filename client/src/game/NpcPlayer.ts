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
    const attack = game.attacked
      ? { kind: "hold" as const, reason: "Already attacked this turn" }
      : strategy.chooseAttack(game.territories, player);
    return { deployed, attack };
  }

  fortify(game: Game) {
    const transfer = strategy.planTransfer(game.territories, game.currentIndex);
    if (transfer) game.moveSoldiers(transfer.from, transfer.to, transfer.count);
    return transfer;
  }

  keepAttacking(from: Territory) {
    return strategy.keepAttacking(from);
  }

  soldiersToMoveIn(game: Game, from: Territory, to: Territory) {
    return strategy.soldiersToMoveIn(from.soldiers + game.occupationBonus(to));
  }
}

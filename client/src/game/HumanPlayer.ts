import { Player } from "./Player";

export class HumanPlayer extends Player {
  get human() {
    return true;
  }

  takeTurn() {
    return null;
  }

  fortify() {
    return null;
  }
}

import { Player } from "./Player";

export class HumanPlayer extends Player {
  get human() {
    return true;
  }

  planTurn() {
    return null;
  }
}

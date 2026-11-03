import type { Battle } from "../game/Battle";
import type { Territory } from "../game/Territory";

export class BattleCommentary {
  readonly #url = "/api/commentary";
  readonly #timeout = 4000;

  async describe(battle: Battle, from: Territory, to: Territory): Promise<string | null> {
    try {
      const response = await fetch(this.#url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attacker: from.name,
          defender: to.name,
          attackerDice: [...battle.attackerDice],
          defenderDice: [...battle.defenderDice],
          attackerLosses: battle.attackerLosses,
          defenderLosses: battle.defenderLosses,
        }),
        signal: AbortSignal.timeout(this.#timeout),
      });
      if (!response.ok) return null;
      const { text } = (await response.json()) as { text?: unknown };
      return typeof text === "string" && text ? text : null;
    } catch {
      return null;
    }
  }
}

export const battleCommentary = new BattleCommentary();

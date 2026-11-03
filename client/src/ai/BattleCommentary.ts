import type { Battle } from "../game/Battle";
import type { Territory } from "../game/Territory";

export type Phrases = { attack: string; defend: string; result: string };

const isPhrase = (value: unknown): value is string => typeof value === "string" && value.length > 0;

export class BattleCommentary {
  readonly #url = "/api/commentary";
  readonly #timeout = 4000;
  readonly #perMinute = 25;
  #sent: number[] = [];

  #allow() {
    const now = Date.now();
    this.#sent = this.#sent.filter((time) => now - time < 60_000);
    if (this.#sent.length >= this.#perMinute) return false;
    this.#sent.push(now);
    return true;
  }

  async describe(battle: Battle, from: Territory, to: Territory): Promise<Phrases | null> {
    if (!this.#allow()) return null;
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
      const { phrases } = (await response.json()) as { phrases?: Partial<Record<keyof Phrases, unknown>> };
      if (!phrases || !isPhrase(phrases.attack) || !isPhrase(phrases.defend) || !isPhrase(phrases.result)) return null;
      return { attack: phrases.attack, defend: phrases.defend, result: phrases.result };
    } catch {
      return null;
    }
  }
}

export const battleCommentary = new BattleCommentary();

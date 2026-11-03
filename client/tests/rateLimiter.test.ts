import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BattleCommentary } from "../src/ai/BattleCommentary";
import { Battle } from "../src/game/Battle";
import type { Territory } from "../src/game/Territory";

const battle = new Battle([6, 2], [4, 5]);
const kenya = { name: "Kenya" } as Territory;
const egypt = { name: "Egypt" } as Territory;

describe("request limiter", () => {
  const server = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    server.mockImplementation(async () =>
      Response.json({ phrases: { attack: "Kenya charges in", defend: "Egypt holds firm", result: "each side loses a soldier" } }),
    );
    vi.stubGlobal("fetch", server);
  });

  afterEach(() => {
    server.mockReset();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  async function ask(commentary: BattleCommentary, times: number) {
    const lines = [];
    for (let count = 0; count < times; count++) lines.push(await commentary.describe(battle, kenya, egypt));
    return lines;
  }

  it("allows 25 requests in a minute", async () => {
    const lines = await ask(new BattleCommentary(), 25);
    expect(lines.every((line) => line !== null)).toBe(true);
    expect(server).toHaveBeenCalledTimes(25);
  });

  it("blocks the 26th request in the same minute", async () => {
    const commentary = new BattleCommentary();
    await ask(commentary, 25);
    expect(await commentary.describe(battle, kenya, egypt)).toBeNull();
    expect(server).toHaveBeenCalledTimes(25);
  });

  it("allows requests again once the minute has passed", async () => {
    const commentary = new BattleCommentary();
    await ask(commentary, 25);
    vi.advanceTimersByTime(60_000);
    expect(await commentary.describe(battle, kenya, egypt)).not.toBeNull();
    expect(server).toHaveBeenCalledTimes(26);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../api/commentary";
import { BattleCommentary } from "../src/ai/BattleCommentary";
import { Battle } from "../src/game/Battle";
import type { Territory } from "../src/game/Territory";

const battle = new Battle([6, 2], [4, 5]);
const kenya = { name: "Kenya" } as Territory;
const egypt = { name: "Egypt" } as Territory;

function send() {
  return POST(
    new Request("http://localhost/api/commentary", {
      method: "POST",
      body: JSON.stringify({
        attacker: "Kenya",
        defender: "Egypt",
        attackerDice: [6, 2],
        defenderDice: [4, 5],
        attackerLosses: 1,
        defenderLosses: 1,
      }),
    }),
  );
}

describe("game falls back when groq fails", () => {
  const network = vi.fn();

  beforeEach(() => {
    process.env.GROQ_API_KEY = "test-key";
    vi.stubGlobal("fetch", network);
  });

  afterEach(() => {
    network.mockReset();
    vi.unstubAllGlobals();
  });

  it("server says no commentary when groq is down", async () => {
    network.mockResolvedValue(new Response("down", { status: 500 }));
    expect((await send()).status).toBe(502);
  });

  it("server says no commentary when groq can't be reached", async () => {
    network.mockRejectedValue(new Error("offline"));
    expect((await send()).status).toBe(502);
  });

  it("server says no commentary when groq sends back nothing", async () => {
    network.mockResolvedValue(Response.json({ choices: [{ message: { content: "" } }] }));
    expect((await send()).status).toBe(502);
  });

  it("server says not set up when there is no key", async () => {
    delete process.env.GROQ_API_KEY;
    expect((await send()).status).toBe(503);
    expect(network).not.toHaveBeenCalled();
  });

  it("game gets no ai line when the server fails, so the written line shows", async () => {
    network.mockResolvedValue(Response.json({ error: "no commentary" }, { status: 502 }));
    expect(await new BattleCommentary().describe(battle, kenya, egypt)).toBeNull();
  });

  it("game gets no ai line when it can't reach the server", async () => {
    network.mockRejectedValue(new Error("offline"));
    expect(await new BattleCommentary().describe(battle, kenya, egypt)).toBeNull();
  });

  it("game gets the ai line when everything works", async () => {
    network.mockResolvedValue(Response.json({ text: "Kenya and Egypt each lose a soldier." }));
    expect(await new BattleCommentary().describe(battle, kenya, egypt)).toBe("Kenya and Egypt each lose a soldier.");
  });
});

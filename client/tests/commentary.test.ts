import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../api/commentary";

const goodBattle = {
  attacker: "Kenya",
  defender: "Egypt",
  attackerDice: [6, 2],
  defenderDice: [4, 5],
  attackerLosses: 1,
  defenderLosses: 1,
};

function send(body: unknown) {
  return POST(new Request("http://localhost/api/commentary", { method: "POST", body: JSON.stringify(body) }));
}

describe("commentary server rejects bad battles", () => {
  const groq = vi.fn();

  beforeEach(() => {
    process.env.GROQ_API_KEY = "test-key";
    vi.stubGlobal("fetch", groq);
  });

  afterEach(() => {
    groq.mockReset();
    vi.unstubAllGlobals();
  });

  it("rejects a battle with no attacker", async () => {
    const response = await send({ ...goodBattle, attacker: "" });
    expect(response.status).toBe(400);
    expect(groq).not.toHaveBeenCalled();
  });

  it("rejects a die above 6", async () => {
    const response = await send({ ...goodBattle, attackerDice: [7, 2] });
    expect(response.status).toBe(400);
    expect(groq).not.toHaveBeenCalled();
  });

  it("rejects sides rolling different numbers of dice", async () => {
    const response = await send({ ...goodBattle, defenderDice: [4] });
    expect(response.status).toBe(400);
    expect(groq).not.toHaveBeenCalled();
  });

  it("rejects negative losses", async () => {
    const response = await send({ ...goodBattle, attackerLosses: -1 });
    expect(response.status).toBe(400);
    expect(groq).not.toHaveBeenCalled();
  });

  it("rejects a body that is not a battle", async () => {
    const response = await send("hello");
    expect(response.status).toBe(400);
    expect(groq).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../api/account";

function send(body: unknown) {
  return POST(new Request("http://localhost/api/account", { method: "POST", body: JSON.stringify(body) }));
}

describe("account server keeps emails private", () => {
  const network = vi.fn();

  beforeEach(() => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
    vi.stubGlobal("fetch", network);
  });

  afterEach(() => {
    network.mockReset();
    vi.unstubAllGlobals();
  });

  it("rejects a username with odd characters", async () => {
    expect((await send({ action: "login", username: "../users", password: "secret" })).status).toBe(400);
  });

  it("rejects a login with no password", async () => {
    expect((await send({ action: "login", username: "player_one" })).status).toBe(400);
  });

  it("rejects an unknown action", async () => {
    expect((await send({ action: "email", username: "player_one" })).status).toBe(400);
  });

  it("says not set up when the server has no service account", async () => {
    expect((await send({ action: "login", username: "player_one", password: "secret" })).status).toBe(503);
    expect(network).not.toHaveBeenCalled();
  });

  it("never sends an email back to the browser", async () => {
    const reply = await (await send({ action: "login", username: "player_one", password: "secret" })).json();
    expect(JSON.stringify(reply)).not.toContain("@");
  });
});

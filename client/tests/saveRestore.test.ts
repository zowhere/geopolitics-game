import { describe, expect, it } from "vitest";
import { Battle } from "../src/game/Battle";
import { withSoldiers } from "../src/game/countries";
import { Game } from "../src/game/Game";

const countries = [
  ["Turkey", "tr", 85e6],
  ["Slovakia", "sk", 5.4e6],
  ["Kenya", "ke", 55e6],
  ["Egypt", "eg", 110e6],
  ["Brazil", "br", 215e6],
  ["Chile", "cl", 19e6],
  ["France", "fr", 68e6],
  ["India", "in", 1.4e9],
  ["Indonesia", "id", 280e6],
  ["Zimbabwe", "zw", 16e6],
].map(([name, code, population]) => withSoldiers({ name: name as string, code: code as string, mapName: name as string, population: population as number }));

function attackSetup() {
  const game = Game.start("Kenya", countries);
  const from = game.territories[game.currentIndex];
  const to = game.territories.find((territory) => territory !== from)!;
  from.addSoldiers(20);
  return { game, from, to };
}

describe("saving and resuming a game", () => {
  it("a restored game remembers the attack was already used", () => {
    const { game, from, to } = attackSetup();
    game.fight(from, to, new Battle([6], [6]));
    game.endWar();
    const restored = Game.restore(game.snapshot(), countries);
    const [rFrom, rTo] = [restored.territories[game.territories.indexOf(from)], restored.territories[game.territories.indexOf(to)]];
    expect(restored.attacked).toBe(true);
    expect(restored.canAttack(rFrom, rTo)).toBe(false);
  });

  it("refreshing mid-battle keeps the losses and ends the attack", () => {
    const { game, from, to } = attackSetup();
    game.fight(from, to, new Battle([1], [6]));
    const restored = Game.restore(game.snapshot(), countries);
    expect(restored.territories[game.territories.indexOf(from)].soldiers).toBe(from.soldiers);
    expect(restored.attacked).toBe(true);
  });

  it("refreshing after a conquest hands the country to the attacker", () => {
    const { game, from, to } = attackSetup();
    const dice = Battle.diceCount(from, to);
    game.fight(from, to, new Battle(Array(dice).fill(6), Array(dice).fill(1)));
    expect(to.soldiers).toBe(0);
    const restored = Game.restore(game.snapshot(), countries);
    const taken = restored.territories[game.territories.indexOf(to)];
    expect(taken.owner).toBe(game.currentIndex);
    expect(taken.soldiers).toBeGreaterThan(0);
    expect(restored.attacked).toBe(true);
  });

  it("a restored game keeps unplaced reinforcements", () => {
    const { game } = attackSetup();
    const restored = Game.restore({ ...game.snapshot(), reserve: 4 }, countries);
    expect(restored.reserve).toBe(4);
  });
});

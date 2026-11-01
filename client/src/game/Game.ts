import { countries, type Country } from "./countries";

export type Player = {
  readonly country: Country;
  readonly soldiers: number;
  readonly human: boolean;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export class Game {
  readonly players: readonly Player[];
  private roundNumber = 1;
  private turnIndex = 0;

  constructor(humanCountry: string) {
    const human = countries.find((country) => country.name === humanCountry)!;
    const rivals = shuffle(countries.filter((country) => country !== human));
    this.players = shuffle([human, ...rivals.slice(0, 9)]).map((country) => ({
      country,
      soldiers: country.soldiers,
      human: country === human,
    }));
  }

  get round() {
    return this.roundNumber;
  }

  get current() {
    return this.players[this.turnIndex];
  }

  nextTurn() {
    this.turnIndex = (this.turnIndex + 1) % this.players.length;
    if (this.turnIndex === 0) this.roundNumber++;
  }
}

import { countries, type Country } from "./countries";

export type Player = {
  country: Country;
  soldiers: number;
  human: boolean;
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
  readonly players: Player[];
  round = 1;
  turn = 0;

  constructor(humanCountry: string) {
    const human = countries.find((country) => country.name === humanCountry)!;
    const rivals = shuffle(countries.filter((country) => country !== human));
    this.players = shuffle([human, ...rivals.slice(0, 9)]).map((country) => ({
      country,
      soldiers: country.soldiers,
      human: country === human,
    }));
  }

  get current() {
    return this.players[this.turn];
  }
}

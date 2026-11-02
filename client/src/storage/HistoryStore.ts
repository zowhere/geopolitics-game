export type GameResult = "won" | "lost" | "left";

export type GameRecord = {
  country: string;
  code: string;
  result: GameResult;
  rounds: number;
  soldiersLost: number;
};

export class HistoryStore {
  private readonly key: string;

  constructor(username: string) {
    this.key = `geopolitics-101-history-${username}`;
  }

  load(): GameRecord[] {
    try {
      return JSON.parse(localStorage.getItem(this.key) ?? "[]");
    } catch {
      return [];
    }
  }

  add(record: GameRecord) {
    try {
      localStorage.setItem(this.key, JSON.stringify([...this.load(), record]));
    } catch {
      return;
    }
  }
}

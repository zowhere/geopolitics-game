export type CountryRecord = {
  name: string;
  code: string;
  mapName: string;
  population: number;
};

export type Country = CountryRecord & {
  soldiers: number;
};

const soldierTiers = [5, 10, 25, 50, 75, 100, 125, 150];

export function soldiersFor(population: number) {
  const millions = population / 1_000_000;
  const tier = soldierTiers.findIndex((limit) => millions <= limit);
  return tier === -1 ? 9 : tier + 1;
}

export function withSoldiers(record: CountryRecord): Country {
  return { ...record, soldiers: soldiersFor(record.population) };
}

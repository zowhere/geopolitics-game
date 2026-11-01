type Spot = [number, number];

const probe = document.createElement("canvas").getContext("2d")!;
const spots = new Map<string, Spot[]>();

function findSpots(path: string): Spot[] {
  const shape = new Path2D(path);
  const inside = (x: number, y: number) => probe.isPointInPath(shape, x, y, "evenodd");
  let found: Spot[] = [];
  for (let y = 22; y <= 142; y += 12) {
    for (let x = 8; x <= 192; x += 10) {
      if (inside(x, y) && inside(x, y - 14) && inside(x - 4, y - 7) && inside(x + 4, y - 7)) {
        found.push([x, y]);
      }
    }
  }
  if (found.length < 3) {
    for (let y = 22; y <= 142; y += 8) {
      for (let x = 8; x <= 192; x += 7) {
        if (inside(x, y - 7)) found.push([x, y]);
      }
    }
  }
  if (found.length === 0) found = [[100, 82]];
  const centreX = found.reduce((sum, [x]) => sum + x, 0) / found.length;
  const centreY = found.reduce((sum, [, y]) => sum + y, 0) / found.length;
  return found.sort(
    ([ax, ay], [bx, by]) =>
      Math.hypot(ax - centreX, ay - centreY) - Math.hypot(bx - centreX, by - centreY),
  );
}

export function troopSpots(path: string, count: number): Spot[] {
  if (!spots.has(path)) spots.set(path, findSpots(path));
  const all = spots.get(path)!;
  return Array.from({ length: count }, (_, index) => all[index % all.length]).sort(
    ([, ay], [, by]) => ay - by,
  );
}

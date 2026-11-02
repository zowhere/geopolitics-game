import type { Territory } from "../game/Territory";
import type { Point } from "./StrikeFx";

export function islandCentre(territory: Territory): Point {
  const island = document.querySelector(`[data-territory="${CSS.escape(territory.name)}"] .island`);
  const box = island?.getBoundingClientRect();
  return box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : { x: 0, y: 0 };
}

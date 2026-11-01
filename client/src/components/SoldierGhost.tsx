import type { Point } from "../map/StrikeFx";
import "./SoldierGhost.css";

function SoldierGhost({ at }: { at: Point }) {
  return (
    <svg className="soldier-ghost" style={{ left: at.x, top: at.y }} viewBox="0 0 12 20" aria-hidden="true">
      <use href="#soldier" />
    </svg>
  );
}

export default SoldierGhost;

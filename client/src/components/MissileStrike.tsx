import { useContext, useEffect, useRef } from "react";
import type { Territory } from "../game/Territory";
import { PaceContext, PausedContext } from "../hooks/PaceContext";
import { strike, type Salvo } from "../hooks/useWar";
import { islandCentre } from "../map/islandCentre";
import { StrikeFx } from "../map/StrikeFx";
import "./MissileStrike.css";

type MissileStrikeProps = {
  from: Territory;
  to: Territory;
  salvos: Salvo[];
};

const shake = [
  { transform: "none" },
  { transform: "translate(-9px, 4px)" },
  { transform: "translate(8px, -5px)" },
  { transform: "translate(-6px, 3px)" },
  { transform: "translate(5px, -2px)" },
  { transform: "translate(-3px, 1px)" },
  { transform: "none" },
];

function MissileStrike({ from, to, salvos }: MissileStrikeProps) {
  const svg = useRef<SVGSVGElement>(null);
  const pace = useContext(PaceContext);
  const paused = useContext(PausedContext);

  useEffect(() => {
    if (!svg.current || paused) return;
    const fx = new StrikeFx(svg.current);
    const attacker = islandCentre(from);
    const defender = islandCentre(to);

    const timers = salvos.flatMap((salvo, index) => {
      const [start, end] = salvo.attackerWins ? [attacker, defender] : [defender, attacker];
      const spread = ((index % 3) - 1) * 12;
      const missiles = [0, 1, 2].map((missile) =>
        setTimeout(
          () =>
            fx.missile(
              { x: start.x + spread + (missile - 1) * 8, y: start.y },
              { x: end.x + spread + (missile - 1) * 16, y: end.y + (missile % 2) * 10 },
              { flight: strike.flight / pace, arc: 0.3 + missile * 0.05, blast: missile === 2 ? 2.6 : 1.5 },
            ),
          (salvo.start + missile * strike.missileGap) / pace,
        ),
      );
      const landing = setTimeout(
        () => document.querySelector(".board-map")?.animate(shake, 600),
        (salvo.start + 2 * strike.missileGap + strike.flight) / pace,
      );
      return [...missiles, landing];
    });

    return () => {
      timers.forEach(clearTimeout);
      fx.stop();
    };
  }, [from, to, salvos, pace, paused]);

  return <svg ref={svg} className="missile-strike" aria-hidden="true" />;
}

export default MissileStrike;

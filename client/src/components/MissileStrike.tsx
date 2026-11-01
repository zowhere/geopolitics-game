import { useEffect, useRef } from "react";
import type { Territory } from "../game/Territory";
import { strike, type Salvo } from "../hooks/useWar";
import { StrikeFx, type Point } from "../map/StrikeFx";
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

function centreOf(territory: Territory): Point {
  const island = document.querySelector(`[data-territory="${CSS.escape(territory.name)}"] .island`);
  const box = island?.getBoundingClientRect();
  return box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : { x: 0, y: 0 };
}

function MissileStrike({ from, to, salvos }: MissileStrikeProps) {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svg.current) return;
    const fx = new StrikeFx(svg.current);
    const attacker = centreOf(from);
    const defender = centreOf(to);

    const timers = salvos.flatMap((salvo, index) => {
      const [start, end] = salvo.attackerWins ? [attacker, defender] : [defender, attacker];
      const spread = ((index % 3) - 1) * 12;
      const missiles = [0, 1, 2].map((missile) =>
        setTimeout(
          () =>
            fx.missile(
              { x: start.x + spread + (missile - 1) * 8, y: start.y },
              { x: end.x + spread + (missile - 1) * 16, y: end.y + (missile % 2) * 10 },
              { flight: strike.flight, arc: 0.3 + missile * 0.05, blast: missile === 2 ? 2.6 : 1.5 },
            ),
          salvo.start + missile * strike.missileGap,
        ),
      );
      const landing = setTimeout(
        () => document.querySelector(".board-map")?.animate(shake, 600),
        salvo.start + 2 * strike.missileGap + strike.flight,
      );
      return [...missiles, landing];
    });

    return () => {
      timers.forEach(clearTimeout);
      fx.stop();
    };
  }, [from, to, salvos]);

  return <svg ref={svg} className="missile-strike" aria-hidden="true" />;
}

export default MissileStrike;

import { useEffect, useRef } from "react";
import type { Territory } from "../game/Territory";
import { islandCentre } from "../map/islandCentre";
import "./SoldierMarch.css";

type SoldierMarchProps = {
  from: Territory;
  to: Territory;
  count: number;
};

const mostShown = 5;

function SoldierMarch({ from, to, count }: SoldierMarchProps) {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!layer.current) return;
    const start = islandCentre(from);
    const end = islandCentre(to);
    const peak = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 60 };
    const at = (x: number, y: number) => `translate(${x}px, ${y}px)`;

    const soldiers = [...layer.current.querySelectorAll(".march-soldier")].map((soldier, index) =>
      soldier.animate(
        [
          { transform: at(start.x, start.y), opacity: 0 },
          { transform: at(start.x, start.y - 10), opacity: 1, offset: 0.15 },
          { transform: at(peak.x, peak.y), opacity: 1, offset: 0.5 },
          { transform: at(end.x, end.y), opacity: 1, offset: 0.9 },
          { transform: at(end.x, end.y), opacity: 0 },
        ],
        { duration: 1100, delay: index * 140, fill: "both", easing: "ease-in-out" },
      ),
    );
    const [leaving, arriving] = [...layer.current.querySelectorAll(".march-label")];
    const float = (element: Element, point: typeof start, delay: number) =>
      element.animate(
        [
          { transform: at(point.x, point.y), opacity: 0 },
          { transform: at(point.x, point.y - 20), opacity: 1, offset: 0.2 },
          { transform: at(point.x, point.y - 50), opacity: 0 },
        ],
        { duration: 1400, delay, fill: "both", easing: "ease-out" },
      );
    const labels = [float(leaving, start, 0), float(arriving, end, 900)];

    return () => [...soldiers, ...labels].forEach((animation) => animation.cancel());
  }, [from, to]);

  return (
    <div ref={layer} className="soldier-march" aria-hidden="true">
      {Array.from({ length: Math.min(count, mostShown) }, (_, index) => (
        <svg key={index} className="march-soldier" viewBox="0 0 12 20">
          <use href="#soldier" />
        </svg>
      ))}
      <span className="march-label">−{count}</span>
      <span className="march-label">+{count}</span>
    </div>
  );
}

export default SoldierMarch;

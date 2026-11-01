import { useEffect, useState } from "react";
import { rollDie } from "../game/Battle";
import "./Die.css";

const pips: Record<number, number[]> = {
  0: [],
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

type DieProps = {
  value: number;
  rolling?: boolean;
  className?: string;
};

function Die({ value, rolling = false, className = "" }: DieProps) {
  const [face, setFace] = useState(0);

  useEffect(() => {
    if (!rolling) return;
    const timer = setInterval(() => setFace(rollDie()), 130);
    return () => clearInterval(timer);
  }, [rolling]);

  const shown = rolling ? face : value;
  return (
    <div className={rolling ? "die rolling" : `die ${className}`}>
      {Array.from({ length: 9 }, (_, spot) => (
        <span key={spot} className={pips[shown].includes(spot) ? "on" : ""} />
      ))}
    </div>
  );
}

export default Die;

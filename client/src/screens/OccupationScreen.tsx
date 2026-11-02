import { useContext, useEffect, useEffectEvent, useState } from "react";
import Island from "../components/Island";
import SoldierCount from "../components/SoldierCount";
import SoldierGhost from "../components/SoldierGhost";
import type { Game } from "../game/Game";
import type { Territory } from "../game/Territory";
import { PaceContext } from "../hooks/PaceContext";
import { useSoldierDrag } from "../hooks/useSoldierDrag";
import { countryShape } from "../map/countryShape";
import { flagUrl } from "../map/flagUrl";
import "./OccupationScreen.css";

type OccupationScreenProps = {
  game: Game;
  from: Territory;
  to: Territory;
  autoMoveIn: number | null;
  onDone: (soldiersMovingIn: number) => void;
};

function OccupationScreen({ game, from, to, autoMoveIn, onDone }: OccupationScreenProps) {
  const [moved, setMoved] = useState(0);
  const bonus = game.occupationBonus(to);
  const staying = from.soldiers + bonus - moved;
  const flag = flagUrl(game.players[from.owner].country.code);
  const done = useEffectEvent(onDone);
  const pace = useContext(PaceContext);

  function moveIn() {
    if (staying > 1) setMoved(moved + 1);
  }

  function moveBack() {
    if (moved > 1) setMoved(moved - 1);
  }

  const inward = useSoldierDrag((target) => {
    if (target.closest(".occupation-side")) moveIn();
  });
  const outward = useSoldierDrag((target) => {
    if (target.closest(".occupation-side")) moveBack();
  });
  const ghost = inward.ghost ?? outward.ghost;

  useEffect(() => {
    if (autoMoveIn === null) return;
    const steps = Array.from({ length: autoMoveIn }, (_, step) => setTimeout(() => setMoved(step + 1), (900 + step * 220) / pace));
    const close = setTimeout(() => done(autoMoveIn), (1900 + autoMoveIn * 220) / pace);
    return () => {
      steps.forEach(clearTimeout);
      clearTimeout(close);
    };
  }, [autoMoveIn, pace]);

  return (
    <div className="occupation-screen" onClick={autoMoveIn === null ? undefined : () => onDone(autoMoveIn)}>
      <h1 className="occupation-headline">Occupied</h1>

      <div className="occupation-arena">
        <div className="occupation-side" onPointerDown={autoMoveIn === null && staying > 1 ? inward.startDrag : undefined}>
          <Island shape={countryShape(from.country.mapName)} flag={flag} soldiers={staying} />
          <span className="occupation-bonus">+{bonus}</span>
          <h3 className="occupation-name">
            {from.name}
            <SoldierCount count={staying} />
          </h3>
        </div>

        <svg className="occupation-arrow" viewBox="0 0 40 16" aria-hidden="true">
          <path d="M2 8h32M26 2l8 6-8 6" />
        </svg>

        <div className="occupation-side" onPointerDown={autoMoveIn === null && moved > 1 ? outward.startDrag : undefined}>
          <Island shape={countryShape(to.country.mapName)} flag={flag} soldiers={moved} />
          <h3 className="occupation-name">
            {to.name}
            <SoldierCount count={moved} />
          </h3>
        </div>
      </div>

      {autoMoveIn === null && (
        <div className="occupation-actions">
          <p className="occupation-hint">{moved === 0 && "Drag soldiers in"}</p>
          <button className="btn btn-gold" type="button" disabled={moved < 1} onClick={() => onDone(moved)}>
            Done
          </button>
        </div>
      )}
      {ghost && <SoldierGhost at={ghost} />}
    </div>
  );
}

export default OccupationScreen;

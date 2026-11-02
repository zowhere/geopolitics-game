import { useContext, type CSSProperties } from "react";
import Die from "../components/Die";
import Island from "../components/Island";
import MissileStrike from "../components/MissileStrike";
import SoldierCount from "../components/SoldierCount";
import { Battle } from "../game/Battle";
import type { Game } from "../game/Game";
import type { Territory } from "../game/Territory";
import { PaceContext } from "../hooks/PaceContext";
import { useWar, type WarPhase } from "../hooks/useWar";
import { countryShape } from "../map/countryShape";
import { flagUrl } from "../map/flagUrl";
import OccupationScreen from "./OccupationScreen";
import "./WarScreen.css";

type WarScreenProps = {
  game: Game;
  from: Territory;
  to: Territory;
  onChange: () => void;
  onEnd: () => void;
};

type FighterState = "" | "marked" | "dying" | "gone" | "returning";

function stampText(phase: WarPhase, game: Game) {
  if (phase === "occupied") return "Occupied";
  if (phase === "failed") return "Attack failed";
  if (phase === "retreat") return game.current.human ? "Retreat" : `${game.current.country.name} retreats`;
  return null;
}

function dieResult(attacker: number, defender: number) {
  if (attacker === defender) return ["landed tie", "landed tie"];
  return attacker > defender ? ["landed", "landed lost"] : ["landed lost", "landed"];
}

function fighterState(phase: WarPhase, lost: boolean): FighterState {
  if (phase === "score") return lost ? "marked" : "";
  if (phase === "casualties") return lost ? "dying" : "";
  if (phase === "regroup") return lost ? "gone" : "returning";
  return "";
}

function Fighter({ state }: { state: FighterState }) {
  return (
    <svg className={`war-fighter ${state}`} viewBox="0 0 12 20" aria-hidden="true">
      <use href="#soldier" />
      {(state === "marked" || state === "dying") && <path className="war-x" d="M1 3l10 14M11 3L1 17" />}
    </svg>
  );
}

function WarScreen({ game, from, to, onChange, onEnd }: WarScreenProps) {
  const { phase, battle, battleNumber, comment, salvos, canRoll, autoMoveIn, roll, stop, occupy, advance } =
    useWar(game, from, to, onChange, onEnd);
  const pairs = battle ? battle.attackerDice.length : Battle.diceCount(from, to);
  const stamp = stampText(phase, game);
  const pace = useContext(PaceContext);
  const lossesApplied = phase === "casualties" || phase === "regroup";
  const attackerSurvivors = pairs - (lossesApplied && battle ? battle.attackerLosses : 0);
  const defenderSurvivors = pairs - (lossesApplied && battle ? battle.defenderLosses : 0);
  const showResult = phase === "score" || lossesApplied;

  if (phase === "occupation") {
    return <OccupationScreen game={game} from={from} to={to} autoMoveIn={autoMoveIn} onDone={occupy} />;
  }

  if (phase === "strike" || stamp) {
    return (
      <div className="war-map" onClick={advance}>
        {phase === "strike" && <MissileStrike from={from} to={to} salvos={salvos} />}
        {stamp && <div className={`stamp ${phase}`}>{stamp}</div>}
      </div>
    );
  }

  function side(territory: Territory, survivors: number, lostAt: (index: number) => boolean) {
    const owner = game.players[territory.owner];
    const fighters = Array.from({ length: pairs }, (_, index) => fighterState(phase, lostAt(index)));
    return (
      <div className="war-side">
        <Island
          shape={countryShape(territory.country.mapName)}
          flag={flagUrl(owner.country.code)}
          soldiers={territory.soldiers - survivors}
        />
        <h3 className="war-name">
          {territory.name}
          <SoldierCount count={territory.soldiers} />
        </h3>
        <div className="war-battle-row">
          <div className="war-troops">
            {fighters.map((state, index) => state !== "gone" && <Fighter key={index} state={state} />)}
          </div>
          <b className="war-number">{survivors}</b>
        </div>
      </div>
    );
  }

  return (
    <div className="war-screen" style={{ "--pace": pace } as CSSProperties} onClick={advance}>
      <header className="war-top">
        <span key={battleNumber} className="war-count">Battle {battleNumber}</span>
        <h2 className="war-title">
          {from.name}
          <svg className="war-arrow" viewBox="0 0 40 16" aria-hidden="true">
            <path d="M2 8h32M26 2l8 6-8 6" />
          </svg>
          {to.name}
        </h2>
      </header>

      <div className="war-arena">
        {side(from, attackerSurvivors, (index) => !!battle && battle.attackerDice[index] < battle.defenderDice[index])}
        <div className={canRoll ? "war-dice ready" : "war-dice"} onClick={canRoll ? roll : undefined}>
          <span className="war-label">Battle</span>
          {Array.from({ length: pairs }, (_, index) => {
            const attacker = battle?.attackerDice[index] ?? 0;
            const defender = battle?.defenderDice[index] ?? 0;
            const [attackerClass, defenderClass] = showResult ? dieResult(attacker, defender) : ["", ""];
            return (
              <div key={index} className="war-pair">
                <Die value={attacker} rolling={phase === "rolling"} className={attackerClass} />
                <span className="war-mark">{showResult && `${attacker}–${defender}`}</span>
                <Die value={defender} rolling={phase === "rolling"} className={defenderClass} />
              </div>
            );
          })}
        </div>
        {side(to, defenderSurvivors, (index) => !!battle && battle.defenderDice[index] < battle.attackerDice[index])}
      </div>

      <footer className="war-bottom">
        <p className="war-line">{showResult && comment}</p>
        {canRoll && (
          <div className="war-actions">
            <button className="btn btn-gold" type="button" onClick={roll}>
              {battleNumber === 1 ? "Roll" : "Roll again"}
            </button>
            <button className="btn btn-outline" type="button" onClick={stop}>
              Stop attack
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

export default WarScreen;

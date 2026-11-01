import Die from "../components/Die";
import Island from "../components/Island";
import MissileStrike from "../components/MissileStrike";
import SoldierCount from "../components/SoldierCount";
import { Battle } from "../game/Battle";
import type { Game } from "../game/Game";
import type { Territory } from "../game/Territory";
import { useWar, type WarPhase } from "../hooks/useWar";
import { countryShape } from "../map/countryShape";
import { flagUrl } from "../map/flagUrl";
import "./WarScreen.css";

type WarScreenProps = {
  game: Game;
  from: Territory;
  to: Territory;
  onHit: () => void;
  onEnd: () => void;
};

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

function WarScreen({ game, from, to, onHit, onEnd }: WarScreenProps) {
  const { phase, battle, battleNumber, comment, salvos, canRoll, roll, stop, hit, advance } = useWar(game, from, to, onHit, onEnd);
  const pairs = battle ? battle.attackerDice.length : Battle.diceCount(from, to);
  const stamp = stampText(phase, game);

  if (phase === "strike" || stamp) {
    return (
      <div className="war-map" onClick={advance}>
        {phase === "strike" && <MissileStrike from={from} to={to} salvos={salvos} onHit={hit} />}
        {stamp && <div className={`stamp ${phase}`}>{stamp}</div>}
      </div>
    );
  }

  function side(territory: Territory) {
    const owner = game.players[territory.owner];
    return (
      <div className="war-side">
        <Island
          shape={countryShape(territory.country.mapName)}
          flag={flagUrl(owner.country.code)}
          soldiers={territory.soldiers}
        />
        <h3 className="war-name">
          {territory.name}
          <SoldierCount count={territory.soldiers} />
        </h3>
      </div>
    );
  }

  return (
    <div className="war-screen" onClick={advance}>
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
        {side(from)}
        <div className={canRoll ? "war-dice ready" : "war-dice"} onClick={canRoll ? roll : undefined}>
          {Array.from({ length: pairs }, (_, index) => {
            const attacker = battle?.attackerDice[index] ?? 0;
            const defender = battle?.defenderDice[index] ?? 0;
            const [attackerClass, defenderClass] = phase === "score" ? dieResult(attacker, defender) : ["", ""];
            return (
              <div key={index} className="war-pair">
                <Die value={attacker} rolling={phase === "rolling"} className={attackerClass} />
                <span className="war-mark">{phase === "score" && `${attacker}–${defender}`}</span>
                <Die value={defender} rolling={phase === "rolling"} className={defenderClass} />
              </div>
            );
          })}
          {canRoll && <span className="war-hint">Click to roll</span>}
        </div>
        {side(to)}
      </div>

      <footer className="war-bottom">
        <p className="war-line">{phase === "score" && comment}</p>
        {canRoll && (
          <button className="btn btn-outline" type="button" onClick={stop}>
            Stop attack
          </button>
        )}
      </footer>
    </div>
  );
}

export default WarScreen;

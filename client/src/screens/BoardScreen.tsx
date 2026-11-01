import { useReducer } from "react";
import Island from "../components/Island";
import SoldierCount from "../components/SoldierCount";
import type { Game } from "../game/Game";
import type { TurnPlan } from "../game/Player";
import { useTurnFlow, type Phase } from "../hooks/useTurnFlow";
import { countryShape } from "../map/countryShape";
import { flagUrl, squareFlagUrl } from "../map/flagUrl";
import WarScreen from "./WarScreen";
import "./BoardScreen.css";

type BoardScreenProps = {
  game: Game;
};

const scatter = [
  [-8, 6, -4],
  [10, -10, 3],
  [-4, 12, 5],
  [6, -6, -3],
  [-10, 4, 2],
  [8, 10, -5],
  [-6, -8, 4],
  [4, 8, -2],
  [-12, -4, 6],
  [10, 6, -4],
];

function captionFor(phase: Phase, plan: TurnPlan | null) {
  if (!plan) return null;
  const { deployed, attack } = plan;
  if (phase === "deploy" && deployed) {
    return { text: `Deployed ${deployed.count} soldiers to ${deployed.to.name}`, reason: deployed.reason };
  }
  if (phase === "decision" || phase === "skipStamp" || phase === "afterHold") {
    return { text: attack.kind === "hold" ? "Holding position" : `Invading ${attack.to.name}`, reason: attack.reason };
  }
  return null;
}

function BoardScreen({ game }: BoardScreenProps) {
  const { phase, plan, advance, endWar } = useTurnFlow(game);
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const current = game.current;
  const attack = plan?.attack.kind === "attack" ? plan.attack : null;
  const attackFrom = phase === "decision" ? attack?.from : null;
  const caption = captionFor(phase, plan);

  return (
    <>
      <main className="board-screen" onClick={advance}>
        <header className="board-hud">
          <span className="board-round">Round {game.round}</span>
          <ol className="board-turns" aria-label="Turn order">
            {game.players.map((player) => (
              <li
                key={player.country.name}
                className={player === current ? "board-turn now" : "board-turn"}
                title={player.human ? `${player.country.name} (you)` : player.country.name}
              >
                <img src={squareFlagUrl(player.country.code)} alt={player.country.name} />
              </li>
            ))}
          </ol>
        </header>

        <div className="board-map">
          {game.territories.map((territory, index) => {
            const [x, y, tilt] = scatter[index];
            const owner = game.players[territory.owner];
            const classes = ["board-country"];
            if (owner.human) classes.push("you");
            if (territory === attackFrom) classes.push("attacking");
            if (phase === "war" && territory !== attack?.from && territory !== attack?.to) classes.push("dim");
            return (
              <div key={territory.name} className={classes.join(" ")} data-territory={territory.name}>
                <Island
                  shape={countryShape(territory.country.mapName)}
                  flag={flagUrl(owner.country.code)}
                  soldiers={territory.soldiers}
                  style={{ transform: `translate(${x}px, ${y}px) rotate(${tilt}deg)` }}
                />
                <span className="board-label">
                  {territory.name}
                  <SoldierCount count={territory.soldiers} />
                </span>
              </div>
            );
          })}
          {phase === "skipStamp" && <div className="stamp">Skip turn</div>}
        </div>

        <footer className="board-footer">
          {phase === "announce" && (
            <p className="board-announce">
              {current.human ? "Your turn" : `${current.country.name}'s turn`}
            </p>
          )}
          {caption && (
            <p key={caption.text} className="board-caption">
              {caption.text}
              <span>{caption.reason}</span>
            </p>
          )}
          {phase === "yourTurn" && <p className="board-skip">Click to end turn</p>}
        </footer>
      </main>
      {phase === "war" && attack && (
        <WarScreen game={game} from={attack.from} to={attack.to} onHit={refresh} onEnd={endWar} />
      )}
    </>
  );
}

export default BoardScreen;

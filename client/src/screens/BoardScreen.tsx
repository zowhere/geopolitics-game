import Island from "../components/Island";
import SoldierCount from "../components/SoldierCount";
import type { Game } from "../game/Game";
import { useTurnFlow } from "../hooks/useTurnFlow";
import { countryShape } from "../map/countryShape";
import { flagUrl, squareFlagUrl } from "../map/flagUrl";
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

function BoardScreen({ game }: BoardScreenProps) {
  const { phase, decision, advance } = useTurnFlow(game);
  const current = game.current;
  const attackFrom = phase === "decision" && decision?.kind === "attack" ? decision.from : null;
  const showCaption = decision && phase !== "announce" && phase !== "thinking";

  return (
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
          return (
            <div key={territory.name} className={classes.join(" ")}>
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
        {phase === "skipStamp" && <div className="board-stamp">Skip turn</div>}
      </div>

      <footer className="board-footer">
        {phase === "announce" && (
          <p className="board-announce">
            {current.human ? "Your turn" : `${current.country.name}'s turn`}
          </p>
        )}
        {showCaption && (
          <p className="board-caption">
            {decision.kind === "hold" ? "Holding position" : `Invading ${decision.to.name}`}
            <span>{decision.reason}</span>
          </p>
        )}
        {phase === "yourTurn" && <p className="board-skip">Click to end turn</p>}
      </footer>
    </main>
  );
}

export default BoardScreen;

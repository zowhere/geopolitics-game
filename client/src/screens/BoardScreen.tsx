import { useReducer } from "react";
import Island from "../components/Island";
import SoldierCount from "../components/SoldierCount";
import type { Game } from "../game/Game";
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
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const current = game.current;

  function skip() {
    game.nextTurn();
    refresh();
  }

  return (
    <main className="board-screen" onClick={skip}>
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
          return (
            <div
              key={territory.name}
              className={owner.human ? "board-country you" : "board-country"}
            >
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
      </div>

      <footer className="board-footer">
        <p className="board-announce">
          {current.human ? "Your turn" : `${current.country.name}'s turn`}
        </p>
        <p className="board-skip">Click to continue</p>
      </footer>
    </main>
  );
}

export default BoardScreen;

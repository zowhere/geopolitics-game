import type { CSSProperties } from "react";
import Island from "../components/Island";
import SoldierCount from "../components/SoldierCount";
import type { Game } from "../game/Game";
import { countryShape } from "../map/countryShape";
import { flagUrl, squareFlagUrl } from "../map/flagUrl";
import { scatter } from "./scatter";
import "./BoardScreen.css";
import "./WatchScreen.css";

type WatchScreenProps = {
  game: Game;
  owner: string;
  actionLabel: string;
  onAction: () => void;
};

function headline(game: Game, owner: string) {
  if (game.status === "won") return `${owner} won`;
  if (game.status === "lost") return `${owner} lost`;
  return game.current.human ? `${owner}'s turn` : `${game.current.country.name}'s turn`;
}

function WatchScreen({ game, owner, actionLabel, onAction }: WatchScreenProps) {
  return (
    <main className="board-screen watch-screen">
      <header className="board-hud">
        <span className="watch-label">Watching {owner}</span>
        <span className="board-round">Round {game.round}</span>
        <ol className="board-turns" aria-label="Turn order">
          {game.players.map((player) => (
            <li
              key={player.country.name}
              className={player === game.current ? "board-turn now" : "board-turn"}
              title={player.human ? `${player.country.name} (${owner})` : player.country.name}
            >
              <img src={squareFlagUrl(player.country.code)} alt={player.country.name} />
            </li>
          ))}
        </ol>
      </header>

      <div className="board-map">
        {game.territories.map((territory, index) => {
          const [x, y, tilt, size] = scatter[index];
          const holder = game.players[territory.owner];
          return (
            <div
              key={territory.name}
              className={holder.human ? "board-country you" : "board-country"}
              style={{ "--x": `${x}%`, "--y": `${y}px` } as CSSProperties}
            >
              <Island
                shape={countryShape(territory.country.mapName)}
                flag={flagUrl(holder.country.code)}
                soldiers={territory.soldiers}
                style={{ transform: `rotate(${tilt}deg) scale(${size})` }}
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
        <p className="board-announce">{headline(game, owner)}</p>
        <button className="btn btn-gold" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      </footer>
    </main>
  );
}

export default WatchScreen;

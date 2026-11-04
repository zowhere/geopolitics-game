import { useEffect, useState, type CSSProperties } from "react";
import Die from "../components/Die";
import Island from "../components/Island";
import SoldierCount from "../components/SoldierCount";
import type { News } from "../db/GameStore";
import type { Game, Roll } from "../game/Game";
import { countryShape } from "../map/countryShape";
import { flagUrl, squareFlagUrl } from "../map/flagUrl";
import { scatter } from "./scatter";
import "./BoardScreen.css";
import "./WatchScreen.css";

type WatchScreenProps = {
  game: Game;
  owner: string;
  roll: Roll | null;
  news: News | null;
  actionLabel: string;
  onAction: () => void;
};

function headline(game: Game, owner: string) {
  if (game.status === "waiting") return `Waiting for ${owner} to start the game`;
  if (game.status === "won") return `${owner} won`;
  if (game.status === "lost") return `${owner} lost`;
  return game.current.human ? `${owner}'s turn` : `${game.current.country.name}'s turn`;
}

type Board = { owner: number; soldiers: number }[];

function boardOf(game: Game): Board {
  return game.territories.map((territory) => ({ owner: territory.owner, soldiers: territory.soldiers }));
}

function Dice({ values }: { values: number[] }) {
  const [rolling, setRolling] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setRolling(false), 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <span className="watch-dice">
      {values.map((value, index) => (
        <Die key={index} value={value} rolling={rolling} />
      ))}
    </span>
  );
}

function WatchScreen({ game, owner, roll, news, actionLabel, onAction }: WatchScreenProps) {
  const war = roll && roll.round === game.round && roll.turn === game.currentIndex ? roll : null;
  const [shown, setShown] = useState(game);
  const [before, setBefore] = useState<Board | null>(null);
  if (game !== shown) {
    setBefore(boardOf(shown));
    setShown(game);
  }

  const nameOf = (player: number) => (game.players[player].human ? owner : game.players[player].country.name);
  const occupied = before
    ? game.territories
        .filter((territory, index) => territory.owner !== before[index].owner)
        .map((territory) => `${nameOf(territory.owner)} occupied ${territory.name}`)
    : [];
  const update = `${game.round}-${game.currentIndex}`;
  const current = game.current.human ? "You" : game.current.country.name;
  const move = news && !(game.current.human && news.who !== "You" && news.who !== current) ? news : null;
  const newsLine = move ? `${move.who === "You" ? owner : move.who} ${move.text}`.toLowerCase() : "";

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
          const change = before ? territory.soldiers - before[index].soldiers : 0;
          const classes = ["board-country"];
          if (holder.human) classes.push("you");
          if (war && (index === war.from || index === war.to)) classes.push("attacking");
          if (war && index !== war.from && index !== war.to) classes.push("dim");
          if (before && territory.owner !== before[index].owner) classes.push("watch-taken");
          return (
            <div
              key={`${territory.name}-${update}`}
              className={classes.join(" ")}
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
              {change !== 0 && (
                <span className={change > 0 ? "watch-change up" : "watch-change down"}>
                  {change > 0 ? `+${change}` : `−${-change}`}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <footer className="board-footer">
        {war && (
          <div key={war.count} className="watch-roll">
            <span>{game.territories[war.from].name}</span>
            <Dice values={war.attackerDice} />
            <span className="watch-vs">vs</span>
            <Dice values={war.defenderDice} />
            <span>{game.territories[war.to].name}</span>
          </div>
        )}
        {occupied.filter((line) => line.toLowerCase() !== newsLine).slice(0, 3).map((line) => (
          <p key={`${line}-${update}`} className="watch-news">
            {line}
          </p>
        ))}
        {move && (
          <p key={`${move.who}-${move.text}`} className="watch-move">
            {move.who === "You" ? owner : move.who} {move.text}
            {move.reason && <em>Best strategy: {move.reason}</em>}
          </p>
        )}
        <p className="board-announce">{headline(game, owner)}</p>
        <button className="btn btn-gold" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      </footer>
    </main>
  );
}

export default WatchScreen;

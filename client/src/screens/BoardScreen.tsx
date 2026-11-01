import { useReducer, useState } from "react";
import Island from "../components/Island";
import ReserveBox from "../components/ReserveBox";
import SoldierCount from "../components/SoldierCount";
import type { Game } from "../game/Game";
import type { TurnPlan } from "../game/Player";
import type { Territory } from "../game/Territory";
import { useTurnFlow, type Phase } from "../hooks/useTurnFlow";
import { countryShape } from "../map/countryShape";
import { flagUrl, squareFlagUrl } from "../map/flagUrl";
import EndScreen from "./EndScreen";
import WarScreen from "./WarScreen";
import "./BoardScreen.css";

type BoardScreenProps = {
  game: Game;
  onNewGame: () => void;
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

function strongest(territories: Territory[]) {
  return territories.reduce<Territory | null>(
    (best, territory) => (!best || territory.soldiers > best.soldiers ? territory : best),
    null,
  );
}

function BoardScreen({ game, onNewGame }: BoardScreenProps) {
  const { phase, plan, war, out, advance, startWar, endWar, endTurn, watch } = useTurnFlow(game);
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const [chosen, setChosen] = useState<Territory | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const placing = phase === "yourTurn" && game.reserve > 0;
  const current = game.current;
  const npcAttack = phase === "decision" && plan?.attack.kind === "attack" ? plan.attack.from : null;
  const caption = captionFor(phase, plan);

  const armies = phase === "yourTurn" ? game.territoriesOf(game.currentIndex).filter((territory) => territory.soldiers >= 2) : [];
  const source = chosen && armies.includes(chosen) ? chosen : strongest(armies);
  const targets = source ? game.territories.filter((territory) => game.canAttack(source, territory)) : [];
  const attacker = targets.length ? source : npcAttack;

  function place(territory: Territory) {
    if (territory.owner !== game.currentIndex) return;
    game.placeReinforcements(territory, 1);
    refresh();
  }

  function choose(territory: Territory) {
    if (placing) place(territory);
    else if (source && targets.includes(territory)) startWar(source, territory);
    else if (armies.includes(territory)) setChosen(territory);
  }

  function placeOn(territoryName: string) {
    const territory = game.territories.find((candidate) => candidate.name === territoryName);
    if (territory && placing) place(territory);
  }

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
          <button
            className="board-log-button"
            type="button"
            aria-expanded={logOpen}
            onClick={(event) => {
              event.stopPropagation();
              setLogOpen(!logOpen);
            }}
          >
            Log
          </button>
          {logOpen && (
            <ol className="board-log" onClick={(event) => event.stopPropagation()}>
              {[...game.commentator.entries].reverse().map((entry, index) => (
                <li key={game.commentator.entries.length - index} className={entry.heading ? "heading" : undefined}>
                  {entry.who && <b>{entry.who}</b>} {entry.text}
                  {entry.reason && <em>{entry.reason}</em>}
                </li>
              ))}
            </ol>
          )}
        </header>

        <div className="board-map">
          {game.territories.map((territory, index) => {
            const [x, y, tilt] = scatter[index];
            const owner = game.players[territory.owner];
            const classes = ["board-country"];
            if (owner.human) classes.push("you");
            if (territory === attacker) classes.push("attacking");
            if (targets.includes(territory)) classes.push("target");
            if (war && territory !== war.from && territory !== war.to) classes.push("dim");
            if (placing && territory.owner === game.currentIndex) classes.push("droppable");
            return (
              <div
                key={territory.name}
                className={classes.join(" ")}
                data-territory={territory.name}
                onClick={() => choose(territory)}
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
          {phase === "skipStamp" && <div className="stamp">Skip turn</div>}
          {phase === "eliminated" && out && (
            <div className="stamp failed">{out.human ? "You are out" : `${out.country.name} is out`}</div>
          )}
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
          {phase === "yourTurn" && (
            <button className="btn btn-gold board-end" type="button" disabled={placing} onClick={endTurn}>
              End turn
            </button>
          )}
        </footer>
      </main>
      {(phase === "airdrop" || placing) && (
        <ReserveBox count={game.reserve} dropping={phase === "airdrop"} onDrop={placeOn} />
      )}
      {war && <WarScreen game={game} from={war.from} to={war.to} onChange={refresh} onEnd={endWar} />}
      {phase === "defeated" && (
        <EndScreen headline="Defeated" tone="lose" player={current} onNewGame={onNewGame} onWatch={watch} />
      )}
      {phase === "gameOver" && game.winner && (
        <EndScreen
          headline={game.winner.human ? "Victory" : `${game.winner.country.name} wins`}
          tone={game.winner.human ? "win" : "lose"}
          player={game.winner}
          onNewGame={onNewGame}
        />
      )}
    </>
  );
}

export default BoardScreen;

import type { Game } from "../game/Game";
import { squareFlagUrl } from "../map/flagUrl";
import { HistoryStore } from "../storage/HistoryStore";
import "./AnalyticsPanel.css";

type AnalyticsPanelProps = {
  username: string;
  game: Game | null;
  onClose: () => void;
};

const mostFallenShown = 12;

function Fallen({ count }: { count: number }) {
  return (
    <span className="record-fallen">
      {Array.from({ length: Math.min(count, mostFallenShown) }, (_, index) => (
        <svg key={index} viewBox="0 0 20 12" aria-hidden="true">
          <ellipse cx="9" cy="9" rx="9" ry="3" fill="#7a1114" opacity="0.8" />
          <g transform="rotate(-90 6 19) translate(-1 7)">
            <use href="#soldier" width="12" height="20" />
          </g>
        </svg>
      ))}
    </span>
  );
}

function AnalyticsPanel({ username, game, onClose }: AnalyticsPanelProps) {
  const history = new HistoryStore(username).load();
  const wins = history.filter((record) => record.result === "won");
  const winRate = history.length ? Math.round((wins.length / history.length) * 100) : 0;
  const averageRounds = wins.length
    ? (wins.reduce((total, record) => total + record.rounds, 0) / wins.length).toFixed(1)
    : "–";
  const you = game ? game.players.findIndex((player) => player.human) : -1;
  const lostThisGame = game ? game.soldiersLostBy(you) : 0;
  const lostEver = history.reduce((total, record) => total + record.soldiersLost, 0) + lostThisGame;

  return (
    <div className="record-backdrop" onClick={onClose}>
      <section className="record" onClick={(event) => event.stopPropagation()}>
        <button className="record-close" type="button" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        <p className="record-tab">Service record</p>
        <h2 className="record-name">{username}</h2>

        <div className="record-overall">
          <p>
            <b>{history.length}</b>games played
          </p>
          <p>
            <b>{winRate}%</b>win rate
          </p>
          <p>
            <b>
              {averageRounds}
              {wins.length > 0 && <small> rounds</small>}
            </b>
            average win
          </p>
          <p>
            <b>{lostEver}</b>soldiers lost
          </p>
        </div>

        {game && (
          <div className="record-section">
            <h3>This game</h3>
            <p className="record-line">
              <img src={squareFlagUrl(game.players[you].country.code)} alt="" />
              {game.players[you].country.name}, round {game.round}
            </p>
            <p className="record-line">
              Soldiers lost: {lostThisGame}
              <Fallen count={lostThisGame} />
            </p>
          </div>
        )}

        {history.length > 0 && (
          <div className="record-section">
            <h3>Past games</h3>
            <ol className="record-games">
              {[...history].reverse().map((record, index) => (
                <li key={history.length - index}>
                  <img src={squareFlagUrl(record.code)} alt="" />
                  <span>{record.country}</span>
                  <span>{record.rounds} rounds</span>
                  <span>{record.soldiersLost} lost</span>
                  <span className={`record-stamp ${record.result}`}>{record.result}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}

export default AnalyticsPanel;

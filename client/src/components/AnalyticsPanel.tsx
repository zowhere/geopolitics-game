import { HistoryStore } from "../storage/HistoryStore";
import "./AnalyticsPanel.css";

type AnalyticsPanelProps = {
  username: string;
  onClose: () => void;
};

function AnalyticsPanel({ username, onClose }: AnalyticsPanelProps) {
  const history = new HistoryStore(username).load();
  const wins = history.filter((record) => record.result === "won");
  const winRate = history.length ? Math.round((wins.length / history.length) * 100) : 0;
  const averageRounds = wins.length
    ? (wins.reduce((total, record) => total + record.rounds, 0) / wins.length).toFixed(1)
    : "–";
  const tiles = [
    { value: history.length, label: "Games played" },
    { value: `${winRate}%`, label: "Win rate" },
    { value: averageRounds, label: "Average rounds to win" },
  ];

  return (
    <div className="analytics-backdrop" onClick={onClose}>
      <section className="analytics-panel" onClick={(event) => event.stopPropagation()}>
        <header className="analytics-header">
          <h2>Analytics</h2>
          <button className="analytics-close" type="button" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="analytics-grid">
          {tiles.map((tile) => (
            <div key={tile.label} className="analytics-tile">
              <b>{tile.value}</b>
              <span>{tile.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AnalyticsPanel;

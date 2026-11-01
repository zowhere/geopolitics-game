import Island from "../components/Island";
import SoldierCount from "../components/SoldierCount";
import type { Game } from "../game/Game";
import { countryShape } from "../map/countryShape";
import { flagUrl } from "../map/flagUrl";
import "./RoundScreen.css";

type RoundScreenProps = {
  game: Game;
  onStart: () => void;
};

function RoundScreen({ game, onStart }: RoundScreenProps) {
  return (
    <main className="round-screen">
      <h1 className="round-title">Round {game.round}</h1>

      <ol className="round-order">
        {game.players.map((player, index) => (
          <li
            key={player.country.name}
            className={player.human ? "round-player you" : "round-player"}
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <span className="round-turn">{index + 1}</span>
            <Island
              shape={countryShape(player.country.mapName)}
              flag={flagUrl(player.country.code)}
            />
            <span className="round-name">
              {player.country.name}
              <SoldierCount count={player.soldiers} />
            </span>
            {player.human && <span className="round-you">You</span>}
          </li>
        ))}
      </ol>

      <button className="btn btn-gold round-start" type="button" onClick={onStart}>
        Start
      </button>
    </main>
  );
}

export default RoundScreen;

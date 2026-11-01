import Island from "../components/Island";
import type { Player } from "../game/Player";
import { countryShape } from "../map/countryShape";
import { flagUrl } from "../map/flagUrl";
import "./EndScreen.css";

type EndScreenProps = {
  headline: string;
  tone: "win" | "lose";
  player: Player;
  onNewGame: () => void;
  onWatch?: () => void;
};

function EndScreen({ headline, tone, player, onNewGame, onWatch }: EndScreenProps) {
  return (
    <div className="end-screen">
      <h1 className={`end-headline ${tone}`}>{headline}</h1>
      <Island shape={countryShape(player.country.mapName)} flag={flagUrl(player.country.code)} />
      <div className="end-actions">
        {onWatch && (
          <button className="btn btn-outline" type="button" onClick={onWatch}>
            Watch the rest
          </button>
        )}
        <button className="btn btn-gold" type="button" onClick={onNewGame}>
          New game
        </button>
      </div>
    </div>
  );
}

export default EndScreen;

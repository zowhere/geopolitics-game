import type { CSSProperties } from "react";
import type { Game } from "../game/Game";
import type { Territory } from "../game/Territory";
import { countryShape } from "../map/countryShape";
import { flagUrl } from "../map/flagUrl";
import { scatter } from "../screens/scatter";
import Island from "./Island";
import SoldierCount from "./SoldierCount";
import "./MiniMap.css";
type MiniMapProps = { game: Game; fighting: readonly Territory[] };
function MiniMap({ game, fighting }: MiniMapProps) {
  return (
    <ol className="mini-map" aria-label="All countries">
      {game.territories.map((territory, index) => {
        const owner = game.players[territory.owner];
        const [x, y, tilt] = scatter[index];
        return (
          <li key={territory.name} className={fighting.includes(territory) ? "fighting" : undefined} style={{ "--x": `${x}%`, "--y": `${y / 4}px`, "--tilt": `${tilt}deg` } as CSSProperties}>
            <Island shape={countryShape(territory.country.mapName)} flag={flagUrl(owner.country.code)} />
            <SoldierCount count={territory.soldiers} />
          </li>
        );
      })}
    </ol>
  );
}

export default MiniMap;

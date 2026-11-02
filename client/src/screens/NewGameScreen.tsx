import type { SavedGame } from "../db/GameStore";
import { squareFlagUrl } from "../map/flagUrl";
import "./NewGameScreen.css";

type NewGameScreenProps = {
  savedGames: readonly SavedGame[];
  onNewGame: () => void;
  onResume: (saved: SavedGame) => void;
};

function NewGameScreen({ savedGames, onNewGame, onResume }: NewGameScreenProps) {
  return (
    <main className="new-game-screen">
      <div className="new-game-menu">
        <button
          className="btn btn-gold new-game-button"
          type="button"
          onClick={onNewGame}
        >
          New game
        </button>
        {savedGames.length > 0 && (
          <div className="saved-games">
            {savedGames.map((saved) => {
              const { human, nations, round } = saved.snapshot;
              const held = nations.filter((nation) => nation.owner === human).length;
              return (
                <button
                  key={saved.id}
                  className="saved-game"
                  type="button"
                  title={`Continue: round ${round}, ${held} of 10 countries`}
                  onClick={() => onResume(saved)}
                >
                  <img src={squareFlagUrl(nations[human].code)} alt="" />
                  <span>R{round}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default NewGameScreen;

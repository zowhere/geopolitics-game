import "./NewGameScreen.css";

type NewGameScreenProps = {
  onNewGame: () => void;
};

function NewGameScreen({ onNewGame }: NewGameScreenProps) {
  return (
    <main className="new-game-screen">
      <button
        className="btn btn-gold new-game-button"
        type="button"
        onClick={onNewGame}
      >
        New game
      </button>
    </main>
  );
}

export default NewGameScreen;

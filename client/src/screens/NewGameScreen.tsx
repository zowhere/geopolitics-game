import "./NewGameScreen.css";

type NewGameScreenProps = {
  username: string;
  onLogout: () => void;
  onNewGame: () => void;
};

function NewGameScreen({ username, onLogout, onNewGame }: NewGameScreenProps) {
  return (
    <main className="new-game-screen">
      <header className="new-game-header">
        <span className="new-game-username">{username}</span>
        <button className="btn btn-outline" type="button" onClick={onLogout}>
          Log out
        </button>
      </header>

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

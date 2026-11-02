import "./PauseScreen.css";

type PauseScreenProps = {
  onResume: () => void;
  onNewGame: () => void;
};

function PauseScreen({ onResume, onNewGame }: PauseScreenProps) {
  return (
    <div className="pause-screen">
      <h1 className="pause-headline">Paused</h1>
      <div className="pause-actions">
        <button className="btn btn-gold" type="button" onClick={onResume}>
          Resume
        </button>
        <button className="btn btn-outline" type="button" onClick={onNewGame}>
          New game
        </button>
      </div>
    </div>
  );
}

export default PauseScreen;

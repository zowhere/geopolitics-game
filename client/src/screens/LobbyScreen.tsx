import "./LobbyScreen.css";

type LobbyScreenProps = {
  username: string;
  onLogout: () => void;
};

function LobbyScreen({ username, onLogout }: LobbyScreenProps) {
  return (
    <main className="lobby-screen">
      <header className="lobby-header">
        <span className="lobby-username">{username}</span>
        <button className="btn btn-outline" type="button" onClick={onLogout}>
          Log out
        </button>
      </header>

      <button className="btn btn-gold lobby-new-game" type="button">
        New game
      </button>
    </main>
  );
}

export default LobbyScreen;

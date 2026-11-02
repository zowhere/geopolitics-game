import { useState } from "react";
import MapFilters from "./components/MapFilters";
import ProfileMenu from "./components/ProfileMenu";
import { Game } from "./game/Game";
import BoardScreen from "./screens/BoardScreen";
import ChooseCountryScreen from "./screens/ChooseCountryScreen";
import NewGameScreen from "./screens/NewGameScreen";
import LoginScreen from "./screens/LoginScreen";
import RoundScreen from "./screens/RoundScreen";
import { defaultSettings } from "./settings";
import { HistoryStore, type GameResult } from "./storage/HistoryStore";

type Screen = "newGame" | "choose" | "round" | "board";

function resultOf(game: Game): GameResult {
  const you = game.players.findIndex((player) => player.human);
  if (game.winner?.human) return "won";
  if (game.winner || game.isEliminated(you)) return "lost";
  return "left";
}

function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("newGame");
  const [game, setGame] = useState<Game | null>(null);
  const [settings, setSettings] = useState(defaultSettings);

  function leaveGame() {
    if (game && username && screen === "board") {
      const country = game.players.find((player) => player.human)!.country.name;
      new HistoryStore(username).add({ country, result: resultOf(game), rounds: game.round });
    }
    setGame(null);
  }

  function logout() {
    leaveGame();
    setUsername(null);
    setScreen("newGame");
  }

  function newGame() {
    leaveGame();
    setScreen("choose");
  }

  function play(country: string) {
    setGame(new Game(country));
    setScreen("round");
  }

  function currentScreen() {
    if (!username) return <LoginScreen onLogin={setUsername} />;
    if (screen === "board" && game) {
      return (
        <BoardScreen
          game={game}
          settings={settings}
          onSettingsChange={setSettings}
          onNewGame={newGame}
        />
      );
    }
    if (screen === "round" && game) {
      return <RoundScreen game={game} onStart={() => setScreen("board")} />;
    }
    if (screen === "choose") {
      return (
        <ChooseCountryScreen
          onBack={() => setScreen("newGame")}
          onPlay={play}
        />
      );
    }
    return (
      <NewGameScreen onNewGame={() => setScreen("choose")} />
    );
  }

  return (
    <>
      <MapFilters />
      {currentScreen()}
      {username && (
        <div className="app-profile">
          <ProfileMenu game={game} username={username} onNewGame={newGame} onLogout={logout} />
        </div>
      )}
    </>
  );
}

export default App;

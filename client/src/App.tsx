import { useState } from "react";
import MapFilters from "./components/MapFilters";
import { Game } from "./game/Game";
import BoardScreen from "./screens/BoardScreen";
import ChooseCountryScreen from "./screens/ChooseCountryScreen";
import NewGameScreen from "./screens/NewGameScreen";
import LoginScreen from "./screens/LoginScreen";
import RoundScreen from "./screens/RoundScreen";
import { defaultSettings } from "./settings";

type Screen = "newGame" | "choose" | "round" | "board";

function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("newGame");
  const [game, setGame] = useState<Game | null>(null);
  const [settings, setSettings] = useState(defaultSettings);

  function logout() {
    setUsername(null);
    setGame(null);
    setScreen("newGame");
  }

  function newGame() {
    setGame(null);
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
          username={username}
          settings={settings}
          onSettingsChange={setSettings}
          onNewGame={newGame}
          onLogout={logout}
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
      <NewGameScreen
        username={username}
        onLogout={logout}
        onNewGame={() => setScreen("choose")}
      />
    );
  }

  return (
    <>
      <MapFilters />
      {currentScreen()}
    </>
  );
}

export default App;

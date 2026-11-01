import { useState } from "react";
import MapFilters from "./components/MapFilters";
import { Game } from "./game/Game";
import BoardScreen from "./screens/BoardScreen";
import ChooseCountryScreen from "./screens/ChooseCountryScreen";
import NewGameScreen from "./screens/NewGameScreen";
import LoginScreen from "./screens/LoginScreen";
import RoundScreen from "./screens/RoundScreen";

type Screen = "newGame" | "choose" | "round" | "board";

function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("newGame");
  const [game, setGame] = useState<Game | null>(null);

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
    if (screen === "board" && game) return <BoardScreen game={game} onNewGame={newGame} />;
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

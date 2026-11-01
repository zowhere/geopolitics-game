import { useState } from "react";
import MapFilters from "./components/MapFilters";
import ChooseCountryScreen from "./screens/ChooseCountryScreen";
import NewGameScreen from "./screens/NewGameScreen";
import LoginScreen from "./screens/LoginScreen";

type Screen = "newGame" | "choose";

function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("newGame");

  function logout() {
    setUsername(null);
    setScreen("newGame");
  }

  function currentScreen() {
    if (!username) return <LoginScreen onLogin={setUsername} />;
    if (screen === "choose") {
      return <ChooseCountryScreen onBack={() => setScreen("newGame")} />;
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

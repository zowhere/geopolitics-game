import { useEffect, useState } from "react";
import MapFilters from "./components/MapFilters";
import ProfileMenu from "./components/ProfileMenu";
import { accounts } from "./db/AccountStore";
import { countryStore } from "./db/CountryStore";
import { gameStore, type SavedGame } from "./db/GameStore";
import type { Country } from "./game/countries";
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
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [screen, setScreen] = useState<Screen>("newGame");
  const [game, setGame] = useState<Game | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [settings, setSettings] = useState(defaultSettings);

  function leaveGame() {
    setGame(null);
    setGameId(null);
  }

  function saveGame() {
    if (!game || !gameId) return;
    gameStore.save(gameId, game).catch((error) => console.error("Couldn't save the game", error));
  }

  useEffect(
    () =>
      accounts.onChange((account) => {
        setUsername(account?.username ?? null);
        setCheckedLogin(true);
      }),
    [],
  );

  useEffect(() => {
    if (screen !== "choose" || countries) return;
    countryStore
      .load()
      .then(setCountries)
      .catch(() => setLoadError("Couldn't reach the database"));
  }, [screen, countries]);

  useEffect(() => {
    if (screen !== "newGame" || !username) return;
    gameStore
      .list()
      .then((games) => setSavedGames(games.filter((saved) => saved.status === "playing")))
      .catch(() => setSavedGames([]));
  }, [screen, username]);

  function logout() {
    leaveGame();
    void accounts.logOut();
    setUsername(null);
    setScreen("newGame");
  }

  function newGame() {
    leaveGame();
    setScreen("choose");
  }

  function play(country: string) {
    if (!countries) return;
    setGame(Game.start(country, countries));
    setGameId(gameStore.newId());
    setScreen("round");
  }

  async function resume(saved: SavedGame) {
    try {
      const list = countries ?? (await countryStore.load());
      setCountries(list);
      setGame(Game.restore(saved.snapshot, list));
      setGameId(saved.id);
      setScreen("board");
    } catch {
      setLoadError("Couldn't load that game");
    }
  }

  function currentScreen() {
    if (!checkedLogin) return null;
    if (!username) return <LoginScreen onLogin={setUsername} />;
    if (screen === "board" && game) {
      return (
        <BoardScreen
          game={game}
          settings={settings}
          onSettingsChange={setSettings}
          onNewGame={newGame}
          onSave={saveGame}
        />
      );
    }
    if (screen === "round" && game) {
      return <RoundScreen game={game} onStart={() => setScreen("board")} />;
    }
    if (screen === "choose") {
      if (loadError) return <p className="app-message">{loadError}</p>;
      if (!countries) return null;
      return (
        <ChooseCountryScreen
          countries={countries}
          onBack={() => setScreen("newGame")}
          onPlay={play}
        />
      );
    }
    return (
      <NewGameScreen
        savedGames={savedGames}
        onNewGame={() => setScreen("choose")}
        onResume={resume}
      />
    );
  }

  return (
    <>
      <MapFilters />
      {currentScreen()}
      {username && (
        <div className="app-profile">
          <ProfileMenu game={game} gameId={gameId} username={username} onNewGame={newGame} onLogout={logout} />
        </div>
      )}
    </>
  );
}

export default App;

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
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import RoundScreen from "./screens/RoundScreen";
import WatchScreen from "./screens/WatchScreen";
import { defaultSettings } from "./settings";

type Screen = "newGame" | "choose" | "round" | "board";

type Watched = {
  saved: SavedGame;
  game: Game;
  owner: string;
};

function resetCodeFromLink() {
  const params = new URLSearchParams(window.location.search);
  return params.get("mode") === "resetPassword" ? params.get("oobCode") : null;
}

function watchIdFromLink() {
  return new URLSearchParams(window.location.search).get("watch");
}

function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [resetCode, setResetCode] = useState(resetCodeFromLink);
  const [watchId, setWatchId] = useState(watchIdFromLink);
  const [watched, setWatched] = useState<Watched | null>(null);
  const [signUpFirst, setSignUpFirst] = useState(false);
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
        setUid(account?.uid ?? null);
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

  useEffect(() => {
    if (!watchId) return;
    let owner = "";
    return gameStore.watch(
      watchId,
      async (saved) => {
        if (!saved) return setLoadError("That game doesn't exist");
        const list = await countryStore.load();
        owner ||= await gameStore.ownerName(saved.ownerId);
        setWatched({ saved, game: Game.restore(saved.snapshot, list), owner });
      },
      () => setLoadError("Couldn't load that game"),
    );
  }, [watchId]);

  function leaveWatch() {
    window.history.replaceState(null, "", "/");
    setWatchId(null);
    setWatched(null);
    setLoadError("");
  }

  function watchAction() {
    if (!watched) return;
    const { saved } = watched;
    leaveWatch();
    if (saved.ownerId === uid && saved.status === "playing") return void resume(saved);
    if (!username) setSignUpFirst(true);
    setScreen("newGame");
  }

  function watchActionLabel() {
    if (!username) return "Sign up to play your own game";
    if (watched?.saved.ownerId === uid && watched?.saved.status === "playing") return "Continue playing";
    return "Play your own game";
  }

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
    if (resetCode) {
      return (
        <ResetPasswordScreen
          code={resetCode}
          onDone={() => {
            window.history.replaceState(null, "", "/");
            setResetCode(null);
          }}
        />
      );
    }
    if (watchId) {
      if (loadError) return <p className="app-message">{loadError}</p>;
      if (!watched) return null;
      return (
        <WatchScreen
          game={watched.game}
          owner={watched.owner}
          actionLabel={watchActionLabel()}
          onAction={watchAction}
        />
      );
    }
    if (!checkedLogin) return null;
    if (!username) return <LoginScreen startMode={signUpFirst ? "signup" : "login"} onLogin={setUsername} />;
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

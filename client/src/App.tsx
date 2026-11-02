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

function unfinished(saved: SavedGame) {
  return saved.status === "waiting" || saved.status === "playing";
}

function restoreSaved(saved: SavedGame, countries: readonly Country[]) {
  const game = Game.restore(saved.snapshot, countries);
  if (saved.status === "waiting") game.wait();
  return game;
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

  function saveGame(id = gameId, current = game) {
    if (!id || !current) return;
    gameStore.save(id, current).catch((error) => console.error("Couldn't save the game", error));
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
      .then((games) => setSavedGames(games.filter(unfinished)))
      .catch(() => setSavedGames([]));
  }, [screen, username]);

  useEffect(() => {
    if (!game || !gameId) return;
    return game.listenToRolls(() => gameStore.saveRoll(gameId, game));
  }, [game, gameId]);

  useEffect(() => {
    if (!watchId) return;
    let owner = "";
    return gameStore.watch(
      watchId,
      async (saved) => {
        if (!saved) return setLoadError("Looking for this game…");
        const list = await countryStore.load();
        owner ||= await gameStore.ownerName(saved.ownerId);
        setLoadError("");
        setWatched({ saved, game: restoreSaved(saved, list), owner });
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
    if (saved.ownerId === uid && unfinished(saved)) return void resume(saved);
    if (!username) setSignUpFirst(true);
    setScreen("newGame");
  }

  function watchActionLabel() {
    if (!username) return "Sign up to play your own game";
    if (watched && watched.saved.ownerId === uid && unfinished(watched.saved)) return "Continue playing";
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
    const started = Game.start(country, countries);
    const id = gameStore.newId();
    started.wait();
    setGame(started);
    setGameId(id);
    saveGame(id, started);
    setScreen("round");
  }

  function beginGame() {
    if (!game) return;
    game.begin();
    saveGame();
    setScreen("board");
  }

  async function resume(saved: SavedGame) {
    try {
      const list = countries ?? (await countryStore.load());
      setCountries(list);
      setGame(restoreSaved(saved, list));
      setGameId(saved.id);
      setScreen(saved.status === "waiting" ? "round" : "board");
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
          roll={watched.saved.roll}
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
          onSave={() => saveGame()}
        />
      );
    }
    if (screen === "round" && game) {
      return <RoundScreen game={game} gameId={gameId} onStart={beginGame} />;
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

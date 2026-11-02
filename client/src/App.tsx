import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import MapFilters from "./components/MapFilters";
import ProfileMenu from "./components/ProfileMenu";
import {
  auth,
  fetchCountries,
  getUserProfile,
  signOutCurrentUser,
} from "./db/firebase";
import { Game } from "./game/Game";
import type { Country } from "./game/countries";
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
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("newGame");
  const [game, setGame] = useState<Game | null>(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [countryLoadAttempt, setCountryLoadAttempt] = useState(0);

  useEffect(() => {
    let activeUid: string | null = null;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      activeUid = user?.uid ?? null;
      setAuthUser(user);
      if (!user) {
        setUsername(null);
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);
      const fallbackUsername =
        user.displayName ?? user.email?.split("@")[0] ?? "Player";
      void getUserProfile(user.uid)
        .then((profile) => {
          if (activeUid === user.uid) {
            setUsername(profile?.username || fallbackUsername);
          }
        })
        .catch(() => {
          if (activeUid === user.uid) setUsername(fallbackUsername);
        })
        .finally(() => {
          if (activeUid === user.uid) setAuthLoading(false);
        });
    });

    return () => {
      activeUid = null;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchCountries()
      .then((loadedCountries) => {
        if (!cancelled) setCountries(loadedCountries);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setCountriesError(
            error instanceof Error
              ? error.message
              : "Unable to load countries from Firestore.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [countryLoadAttempt]);

  function retryCountryLoad() {
    setCountriesError(null);
    setCountryLoadAttempt((attempt) => attempt + 1);
  }

  function leaveGame() {
    if (game && authUser && screen === "board") {
      const you = game.players.findIndex((player) => player.human);
      const { name, code } = game.players[you].country;
      new HistoryStore(authUser.uid).add({
        country: name,
        code,
        result: resultOf(game),
        rounds: game.round,
        soldiersLost: game.soldiersLostBy(you),
      });
    }
    setGame(null);
  }

  async function logout() {
    leaveGame();
    await signOutCurrentUser();
    setScreen("newGame");
  }

  function newGame() {
    leaveGame();
    setScreen("choose");
  }

  function play(country: string) {
    if (!countries) return;
    setGame(new Game(country, countries));
    setScreen("round");
  }

  function currentScreen() {
    if (authLoading) {
      return (
        <main className="login-screen">
          <p role="status">Checking your session...</p>
        </main>
      );
    }
    if (!authUser || !username) return <LoginScreen />;
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
      if (countriesError) {
        return (
          <main className="choose-screen">
            <header className="choose-header">
              <h1 className="choose-title">Choose your country</h1>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => setScreen("newGame")}
              >
                Back
              </button>
            </header>
            <p role="alert">{countriesError}</p>
            <button
              className="btn btn-gold"
              type="button"
              onClick={retryCountryLoad}
            >
              Retry
            </button>
          </main>
        );
      }
      if (!countries) {
        return (
          <main className="choose-screen">
            <p role="status">Loading countries...</p>
          </main>
        );
      }
      return (
        <ChooseCountryScreen
          countries={countries}
          onBack={() => setScreen("newGame")}
          onPlay={play}
        />
      );
    }
    return <NewGameScreen onNewGame={() => setScreen("choose")} />;
  }

  return (
    <>
      <MapFilters />
      {currentScreen()}
      {authUser && username && (
        <div className="app-profile">
          <ProfileMenu
            game={game}
            userId={authUser.uid}
            username={username}
            onNewGame={newGame}
            onLogout={logout}
          />
        </div>
      )}
    </>
  );
}

export default App;

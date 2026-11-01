import { useState } from "react";
import MapFilters from "./components/MapFilters";
import LobbyScreen from "./screens/LobbyScreen";
import LoginScreen from "./screens/LoginScreen";

function App() {
  const [username, setUsername] = useState<string | null>(null);

  return (
    <>
      <MapFilters />
      {username ? (
        <LobbyScreen username={username} onLogout={() => setUsername(null)} />
      ) : (
        <LoginScreen onLogin={setUsername} />
      )}
    </>
  );
}

export default App;

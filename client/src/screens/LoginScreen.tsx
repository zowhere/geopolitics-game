import { useState, type FormEvent } from "react";
import Island from "../components/Island";
import { countryShape } from "../map/countryShape";
import "./LoginScreen.css";

type Mode = "login" | "signup";

type LoginScreenProps = {
  onLogin: (username: string) => void;
};

const drifters = [
  { name: "South Africa", color: "#c4553f", left: "0%", top: "6%" },
  {
    name: "United States of America",
    color: "#5e9150",
    left: "60%",
    top: "2%",
  },
  { name: "Egypt", color: "#d8b44a", left: "10%", top: "66%" },
  { name: "Chile", color: "#3f6fae", left: "42%", top: "72%" },
  { name: "Brazil", color: "#c46b8f", left: "74%", top: "56%" },
].map((drifter) => ({ ...drifter, shape: countryShape(drifter.name) }));

function validate(username: string, password: string) {
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username))
    return "Username: 3 to 20 letters, numbers or _";
  if (password.length < 6) return "Password: at least 6 characters";
  return "";
}

function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const name = username.trim();
    const problem = validate(name, password);
    setError(problem);
    if (!problem) onLogin(name);
  }

  return (
    <main className="login-screen">
      <div className="login-drifters">
        {drifters.map((drifter, index) => (
          <Island
            key={drifter.name}
            shape={drifter.shape}
            color={drifter.color}
            className="login-drifter"
            style={{
              left: drifter.left,
              top: drifter.top,
              animationDelay: `${index * -1.4}s`,
            }}
          />
        ))}
      </div>

      <div className="login-panel">
        <h1 className="login-logo">
          GEOPOLITICS <em>101</em>
        </h1>

        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => switchMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            onClick={() => switchMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form className="login-form" onSubmit={submit} noValidate>
          <input
            className="line-input"
            placeholder="Username"
            aria-label="Username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <input
            className="line-input"
            type="password"
            placeholder="Password"
            aria-label="Password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="login-error">{error}</p>}
          <button className="btn btn-gold" type="submit">
            {mode === "login" ? "Play" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default LoginScreen;

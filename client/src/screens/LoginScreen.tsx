import { useState, type FormEvent } from "react";
import Island from "../components/Island";
import { accounts } from "../db/AccountStore";
import { countryShape } from "../map/countryShape";
import { flagUrl } from "../map/flagUrl";
import "./LoginScreen.css";

type Mode = "login" | "signup";

type LoginScreenProps = {
  onLogin: (username: string) => void;
};

const drifters = [
  { name: "South Africa", code: "za", left: "0%", top: "6%" },
  { name: "United States of America", code: "us", left: "60%", top: "2%" },
  { name: "Egypt", code: "eg", left: "10%", top: "66%" },
  { name: "Chile", code: "cl", left: "42%", top: "72%" },
  { name: "Brazil", code: "br", left: "74%", top: "56%" },
].map((drifter) => ({ ...drifter, shape: countryShape(drifter.name) }));

function validate(mode: Mode, email: string, username: string, password: string) {
  if (mode === "login")
    return username && password ? "" : "Enter your username and password";
  if (!/^\S+@\S+\.\S+$/.test(email)) return "That email doesn't look right";
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username))
    return "Username: 3 to 20 letters, numbers or _";
  if (password.length < 8) return "Password: at least 8 characters";
  return "";
}

function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const name = username.trim();
    const problem = validate(mode, email.trim(), name, password);
    setError(problem);
    if (problem) return;

    setBusy(true);
    try {
      const account =
        mode === "signup"
          ? await accounts.signUp(email.trim(), name, password)
          : await accounts.logIn(name, password);
      onLogin(account.username);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <main className="login-screen">
      <div className="login-drifters">
        {drifters.map((drifter, index) => (
          <Island
            key={drifter.name}
            shape={drifter.shape}
            flag={flagUrl(drifter.code)}
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
          {mode === "signup" && (
            <input
              className="line-input"
              type="email"
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          )}
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
          <button className="btn btn-gold" type="submit" disabled={busy}>
            {mode === "login" ? "Play" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default LoginScreen;

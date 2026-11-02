import { useState, type FormEvent } from "react";
import Island from "../components/Island";
import PasswordInput from "../components/PasswordInput";
import { accounts } from "../db/AccountStore";
import { countryShape } from "../map/countryShape";
import { flagUrl } from "../map/flagUrl";
import "./LoginScreen.css";

type Mode = "login" | "signup" | "reset";

const submitLabel: Record<Mode, string> = {
  login: "Play",
  signup: "Create account",
  reset: "Reset password",
};

type LoginScreenProps = {
  startMode?: Mode;
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
  if (mode === "reset") return username ? "" : "Enter your username";
  if (mode === "login")
    return username && password ? "" : "Enter your username and password";
  if (!/^\S+@\S+\.\S+$/.test(email)) return "That email doesn't look right";
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username))
    return "Username: 3 to 20 letters, numbers or _";
  if (password.length < 6) return "Password: at least 6 characters";
  return "";
}

function LoginScreen({ startMode = "login", onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<Mode>(startMode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setNote("");
  }

  async function sendResetLink(name: string) {
    try {
      await accounts.resetPassword(name);
      setNote("If that account exists, a reset link is in its email");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Something went wrong");
    }
    setBusy(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const name = username.trim();
    const problem = validate(mode, email.trim(), name, password);
    setError(problem);
    setNote("");
    if (problem) return;

    setBusy(true);
    if (mode === "reset") return sendResetLink(name);
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
            aria-selected={mode !== "signup"}
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
          {mode !== "reset" && (
            <PasswordInput
              placeholder="Password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={setPassword}
            />
          )}
          {error && <p className="login-error">{error}</p>}
          {note && <p className="login-note">{note}</p>}
          <button className="btn btn-gold" type="submit" disabled={busy}>
            {submitLabel[mode]}
          </button>
          {mode !== "signup" && (
            <button
              className="login-forgot"
              type="button"
              onClick={() => switchMode(mode === "login" ? "reset" : "login")}
            >
              {mode === "login" ? "Forgot password?" : "Back to log in"}
            </button>
          )}
        </form>
      </div>
    </main>
  );
}

export default LoginScreen;

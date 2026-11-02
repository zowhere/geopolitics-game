import { useState, type FormEvent } from "react";
import { createAccount, loginWithEmail } from "../db/firebase";
import Island from "../components/Island";
import { countryShape } from "../map/countryShape";
import { flagUrl } from "../map/flagUrl";
import "./LoginScreen.css";

type Mode = "login" | "signup";

const drifters = [
  { name: "South Africa", code: "za", left: "0%", top: "6%" },
  { name: "United States of America", code: "us", left: "60%", top: "2%" },
  { name: "Egypt", code: "eg", left: "10%", top: "66%" },
  { name: "Chile", code: "cl", left: "42%", top: "72%" },
  { name: "Brazil", code: "br", left: "74%", top: "56%" },
].map((drifter) => ({ ...drifter, shape: countryShape(drifter.name) }));

function authErrorMessage(error: unknown, mode: Mode) {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email or password is incorrect.";
    case "auth/invalid-email":
      return mode === "login"
        ? "Use the email address linked to your account. Usernames are display names."
        : "Enter a valid email address.";
    case "auth/weak-password":
      return "Choose a stronger password with at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return error instanceof Error ? error.message : "Unable to authenticate.";
  }
}

function LoginScreen() {
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
    const normalizedEmail = email.trim();
    const normalizedUsername = username.trim();

    if (!normalizedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError(
        mode === "login"
          ? "Use the email address linked to your account. Usernames are display names."
          : "Enter a valid email address.",
      );
      return;
    }
    if (mode === "signup" && !/^[A-Za-z0-9_]{3,20}$/.test(normalizedUsername)) {
      setError("Username: 3 to 20 letters, numbers or _");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password: at least 6 characters");
      return;
    }

    setBusy(true);
    setError("");
    try {
      if (mode === "signup") {
        await createAccount(normalizedEmail, password, normalizedUsername);
      } else {
        await loginWithEmail(normalizedEmail, password);
      }
    } catch (authError) {
      setError(authErrorMessage(authError, mode));
    } finally {
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
            disabled={busy}
            onClick={() => switchMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            disabled={busy}
            onClick={() => switchMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form className="login-form" onSubmit={submit} noValidate>
          {mode === "signup" && (
            <input
              className="line-input"
              placeholder="Username"
              aria-label="Username"
              autoComplete="nickname"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={busy}
            />
          )}
          <input
            className="line-input"
            type="email"
            placeholder="Email address"
            aria-label="Email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
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
            disabled={busy}
          />
          {error && <p className="login-error">{error}</p>}
          <button className="btn btn-gold" type="submit" disabled={busy}>
            {busy
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default LoginScreen;

import { useEffect, useState, type FormEvent } from "react";
import { accounts } from "../db/AccountStore";
import "./LoginScreen.css";

type Stage = "checking" | "ready" | "done" | "broken";

type ResetPasswordScreenProps = {
  code: string;
  onDone: () => void;
};

function messageOf(failure: unknown) {
  return failure instanceof Error ? failure.message : "Something went wrong";
}

function ResetPasswordScreen({ code, onDone }: ResetPasswordScreenProps) {
  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    accounts
      .checkResetLink(code)
      .then(() => setStage("ready"))
      .catch((failure) => {
        setError(messageOf(failure));
        setStage("broken");
      });
  }, [code]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 6) return setError("Password: at least 6 characters");
    if (password !== again) return setError("The passwords don't match");

    setError("");
    setBusy(true);
    try {
      await accounts.setNewPassword(code, password);
      setStage("done");
    } catch (failure) {
      setError(messageOf(failure));
    }
    setBusy(false);
  }

  return (
    <main className="login-screen">
      <div className="login-panel">
        <h1 className="login-logo">
          GEOPOLITICS <em>101</em>
        </h1>

        {stage === "ready" && (
          <form className="login-form" onSubmit={submit} noValidate>
            <p className="reset-title">Choose a new password</p>
            <input
              className="line-input"
              type="password"
              placeholder="New password"
              aria-label="New password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <input
              className="line-input"
              type="password"
              placeholder="New password again"
              aria-label="New password again"
              autoComplete="new-password"
              value={again}
              onChange={(event) => setAgain(event.target.value)}
            />
            {error && <p className="login-error">{error}</p>}
            <button className="btn btn-gold" type="submit" disabled={busy}>
              Save password
            </button>
          </form>
        )}

        {stage === "done" && (
          <div className="login-form">
            <p className="reset-title">Password changed</p>
            <button className="btn btn-gold" type="button" onClick={onDone}>
              Log in
            </button>
          </div>
        )}

        {stage === "broken" && (
          <div className="login-form">
            <p className="login-error">{error}</p>
            <button className="btn btn-gold" type="button" onClick={onDone}>
              Back to log in
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default ResetPasswordScreen;

import { useCallback, useRef, useState } from "react";
import { useDismiss } from "../hooks/useDismiss";
import { speeds, type Settings } from "../settings";
import "./SettingsMenu.css";

type SettingsMenuProps = {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onTransfer?: () => void;
  onHowToPlay?: () => void;
};

function SettingsMenu({ settings, onChange, onTransfer, onHowToPlay }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useDismiss(root, open, useCallback(() => setOpen(false), []));

  function transfer() {
    setOpen(false);
    onTransfer?.();
  }

  function howToPlay() {
    setOpen(false);
    onHowToPlay?.();
  }

  return (
    <div ref={root} className="settings" onClick={(event) => event.stopPropagation()}>
      <button
        className="settings-button"
        type="button"
        aria-label="Settings"
        data-tip="Menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      {open && (
        <div className="settings-panel">
          <h2 className="settings-title">Settings</h2>
          <button className="settings-transfer" type="button" disabled={!onTransfer} onClick={transfer}>
            Transfer soldiers
          </button>
          {!onTransfer && <p className="settings-note">On your turn, after placing new soldiers</p>}
          <p className="settings-label">Fast-forward speed</p>
          <div className="settings-choices">
            {speeds.map((speed) => (
              <button
                key={speed.label}
                type="button"
                aria-pressed={settings.speed === speed.pace}
                onClick={() => onChange({ ...settings, speed: speed.pace })}
              >
                {speed.label}
              </button>
            ))}
          </div>
          <p className="settings-label">AI commentary</p>
          <div className="settings-choices">
            {[true, false].map((on) => (
              <button
                key={String(on)}
                type="button"
                aria-pressed={settings.commentary === on}
                onClick={() => onChange({ ...settings, commentary: on })}
              >
                {on ? "On" : "Off"}
              </button>
            ))}
          </div>
          <button className="settings-help" type="button" onClick={howToPlay}>
            How to play
          </button>
        </div>
      )}
    </div>
  );
}

export default SettingsMenu;

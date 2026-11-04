import { useState } from "react";
import "./HowToPlay.css";

type Step = { at: string; text: string; tap?: boolean; when?: string };

const steps: Step[] = [
  { at: ".choose-grid", text: "Tap a country to play as it.", tap: true },
  { at: ".choose-bar .btn", text: "Press Next.", tap: true },
  { at: ".round-start", text: "Press Start to begin.", tap: true },
  { at: ".board-country.you", text: "This is you. Win by taking all 10 countries." },
  { at: ".board-country .soldier-count", text: "The helmet shows how many soldiers a country has." },
  { at: ".board-actions .btn-gold", text: "On your turn, tap Attack.", tap: true },
  { at: ".board-country.target", text: "Tap a country pulsing red to invade it.", when: ".war-screen" },
  { at: ".war-actions .btn-gold", text: "Tap Roll. One die per soldier, higher roll wins, ties lose nothing.", tap: true },
  { at: ".war-bottom", text: "The AI commentator calls every battle." },
  { at: ".settings-button", text: "Open the menu.", tap: true },
  { at: ".settings-panel", text: "Move soldiers, set fast-forward speed, turn commentary on or off." },
  { at: ".board-pause", text: "The bomb pauses the game." },
  { at: ".board-fast", text: "On rival turns, fast-forward speeds them up." },
  { at: ".profile-button", text: "Your profile: share a game, see your stats or start a new one." },
];

type HowToPlayProps = { onDone: () => void; onPractice: () => void };

function HowToPlay({ onDone, onPractice }: HowToPlayProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  return (
    <div className="tour" role="dialog" aria-label="How to play" onClick={(event) => event.stopPropagation()}>
      <div key={step} className="tour-card">
        <p>{current ? current.text : "Try a practice game. It isn't saved and won't count in your stats."}</p>
        <div className="tour-actions">
          <button className="tour-skip" type="button" onClick={onDone}>{current ? "Skip" : "Not now"}</button>
          {step > 0 && <button className="btn btn-outline" type="button" onClick={() => setStep(step - 1)}>Back</button>}
          <button className="btn btn-gold" type="button" onClick={current ? () => setStep(step + 1) : onPractice}>
            {current ? "Next" : "Practice"}
          </button>
        </div>
        <span className="tour-count">{Math.min(step + 1, steps.length)} / {steps.length}</span>
      </div>
    </div>
  );
}

export default HowToPlay;

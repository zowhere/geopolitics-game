import { useEffect, useEffectEvent, useState } from "react";
import "./HowToPlay.css";

type Step = { at: string; text: string; tap?: boolean; when?: string; delay?: number };

const steps: Step[] = [
  { at: ".choose-grid", text: "Tap a country to play as it.", tap: true },
  { at: ".choose-bar .btn", text: "Press Next.", tap: true },
  { at: ".round-start", text: "Press Start to begin.", tap: true },
  { at: ".board-country.you", text: "This is you. Win by taking all 10 countries." },
  { at: ".board-country .soldier-count", text: "The helmet shows how many soldiers a country has." },
  { at: ".board-fast", text: "Rivals are taking their turns. Tap Fast-forward to speed them up.", tap: true, delay: 6000 },
  { at: '.board-fast[aria-pressed="true"]', text: "Now tap it again to slow down and watch how the game plays.", tap: true, delay: 3000 },
  { at: ".board-fast", text: "Fast-forward shows up here on every rival turn." },
  { at: ".board-actions .btn-gold", text: "On your turn, tap Attack.", tap: true },
  { at: ".board-country.target", text: "Tap a country pulsing red to invade it.", when: ".war-screen" },
  { at: ".war-actions .btn-gold", text: "Tap Roll. One die per soldier, higher roll wins, ties lose nothing.", tap: true },
  { at: ".war-bottom", text: "The AI commentator calls every battle." },
  { at: ".settings-button", text: "Open the menu.", tap: true },
  { at: ".settings-panel", text: "Move soldiers, set fast-forward speed, turn commentary on or off." },
  { at: ".board-pause", text: "The bomb pauses the game." },
  { at: ".profile-button", text: "Your profile: share a game, see your stats or start a new one." },
];

type HowToPlayProps = { onDone: () => void };

function HowToPlay({ onDone }: HowToPlayProps) {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<DOMRect | null>(null);
  const step = steps[index];
  const advance = () => (index + 1 < steps.length ? setIndex(index + 1) : onDone());
  const next = useEffectEvent(advance);

  useEffect(() => {
    let seenAt = 0;
    const timer = setInterval(() => {
      const target = document.querySelector(step.at);
      seenAt = target ? seenAt || Date.now() : 0;
      setBox(target && Date.now() - seenAt >= (step.delay ?? 0) ? target.getBoundingClientRect() : null);
      if (step.when && document.querySelector(step.when)) next();
    }, 250);
    const onTap = (event: MouseEvent) => {
      if (step.tap && (event.target as Element).closest(step.at)) setTimeout(next, 0);
    };
    document.addEventListener("click", onTap, true);
    return () => (clearInterval(timer), document.removeEventListener("click", onTap, true));
  }, [step]);
  const below = box ? box.bottom + 150 < window.innerHeight : true;
  return (
    <>
      {box && <div className="coach-ring" style={{ left: box.left - 6, top: box.top - 6, width: box.width + 12, height: box.height + 12 }} />}
      <div className="coach-bubble" style={box ? (below ? { top: box.bottom + 16 } : { bottom: window.innerHeight - box.top + 16 }) : { bottom: 24 }}>
        {box && <p>{step.text}</p>}
        <div className="coach-actions">
          <button className="coach-skip" type="button" onClick={onDone}>Skip tour</button>
          {box && !step.tap && !step.when && <button className="btn btn-gold" type="button" onClick={advance}>Got it</button>}
        </div>
      </div>
    </>
  );
}

export default HowToPlay;

import { useState, type ReactNode } from "react";
import { countryShape } from "../map/countryShape";
import { flagUrl } from "../map/flagUrl";
import Die from "./Die";
import Island from "./Island";
import SoldierCount from "./SoldierCount";
import "./HowToPlay.css";

const tourSteps = [
  { title: "Conquer the world", text: "Take all 10 countries to win." },
  { title: "Soldiers", text: "The helmet shows how many soldiers a country has." },
  { title: "Your turn", text: "Your countries glow gold. Drag new soldiers from the crate onto them." },
  { title: "Attack", text: "Tap Attack, then a country pulsing red. Or tap Skip." },
  { title: "Dice", text: "One die per soldier. Higher roll wins. Ties lose nothing." },
  { title: "Commentary", text: "An AI commentator calls every battle." },
  { title: "Stop and move", text: "Stop an attack, then move soldiers between your countries." },
  { title: "World map", text: "In battle, the map keeps every country in view." },
  { title: "Menu", text: "Move soldiers, set fast-forward speed, turn commentary on or off." },
  { title: "Fast-forward and pause", text: "Speed up rival turns. The bomb pauses the game." },
  { title: "Profile", text: "Share your game, see your stats or start a new one." },
];

const tourArt: Record<number, ReactNode> = {
  0: ["South Africa:za", "Brazil:br", "India:in"].map((pair) => {
    const [name, code] = pair.split(":");
    return <Island key={code} shape={countryShape(name)} flag={flagUrl(code)} />;
  }),
  1: <SoldierCount count={7} />,
  4: [<Die key="win" value={6} />, <Die key="lose" value={3} />],
};

type HowToPlayProps = { onDone: () => void; onPractice: () => void };

function HowToPlay({ onDone, onPractice }: HowToPlayProps) {
  const [step, setStep] = useState(0);
  const current = tourSteps[step];
  return (
    <div className="tour" role="dialog" aria-label="How to play" onClick={(event) => event.stopPropagation()}>
      <div key={step} className="tour-card">
        {current && tourArt[step] && <div className="tour-art">{tourArt[step]}</div>}
        <h2>{current ? current.title : "Ready to play?"}</h2>
        <p>{current ? current.text : "Try a practice game. It isn't saved and won't count in your stats."}</p>
        <div className="tour-actions">
          <button className="tour-skip" type="button" onClick={onDone}>{current ? "Skip" : "Not now"}</button>
          {step > 0 && <button className="btn btn-outline" type="button" onClick={() => setStep(step - 1)}>Back</button>}
          <button className="btn btn-gold" type="button" onClick={current ? () => setStep(step + 1) : onPractice}>
            {current ? "Next" : "Practice"}
          </button>
        </div>
        <span className="tour-count">{Math.min(step + 1, tourSteps.length)} / {tourSteps.length}</span>
      </div>
    </div>
  );
}

export default HowToPlay;

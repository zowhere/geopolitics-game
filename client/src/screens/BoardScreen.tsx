import { useCallback, useEffect, useEffectEvent, useReducer, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import Island from "../components/Island";
import ReserveBox from "../components/ReserveBox";
import SettingsMenu from "../components/SettingsMenu";
import SoldierGhost from "../components/SoldierGhost";
import SoldierMarch from "../components/SoldierMarch";
import StrategyBox from "../components/StrategyBox";
import SoldierCount from "../components/SoldierCount";
import type { Game } from "../game/Game";
import type { Transfer } from "../game/NpcStrategy";
import type { TurnPlan } from "../game/Player";
import type { Territory } from "../game/Territory";
import { PaceContext, PausedContext } from "../hooks/PaceContext";
import { useDismiss } from "../hooks/useDismiss";
import { useSoldierDrag } from "../hooks/useSoldierDrag";
import { useTurnFlow, type Phase } from "../hooks/useTurnFlow";
import { countryShape } from "../map/countryShape";
import { flagUrl, squareFlagUrl } from "../map/flagUrl";
import EndScreen from "./EndScreen";
import PauseScreen from "./PauseScreen";
import { scatter } from "./scatter";
import WarScreen from "./WarScreen";
import type { Settings } from "../settings";
import "./BoardScreen.css";

type BoardScreenProps = {
  game: Game;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onNewGame: () => void;
  onSave: () => void;
  onHowToPlay?: () => void;
};

const homeRule = "At least 1 soldier must stay home during an attack";

function captionFor(phase: Phase, plan: TurnPlan | null, transfer: Transfer | null) {
  if (phase === "transfer" && transfer) return `Moved ${transfer.count} soldiers to ${transfer.to.name}`;
  if (!plan) return null;
  const { deployed, attack } = plan;
  if (phase === "deploy" && deployed) return `Deployed ${deployed.count} soldiers to ${deployed.to.name}`;
  if (phase === "decision" || phase === "skipStamp" || phase === "afterHold") {
    return attack.kind === "hold" ? "Holding position" : `Invading ${attack.to.name}`;
  }
  return null;
}

function strongest(territories: Territory[]) {
  return territories.reduce<Territory | null>(
    (best, territory) => (!best || territory.soldiers > best.soldiers ? territory : best),
    null,
  );
}

function BoardScreen({ game, settings, onSettingsChange, onNewGame, onSave, onHowToPlay }: BoardScreenProps) {
  const { phase, plan, war, out, transfer, pace, paused, setPaused, advance, startWar, endWar, endTurn, watch, toggleFast } =
    useTurnFlow(game, settings.speed);
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const [chosen, setChosen] = useState<Territory | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  useDismiss(log, logOpen, useCallback(() => setLogOpen(false), []));
  const [aiming, setAiming] = useState(false);
  const [notice, setNotice] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [moves, setMoves] = useState<{ from: Territory; to: Territory }[]>([]);
  const dragFrom = useRef<Territory | null>(null);
  const placing = phase === "yourTurn" && game.reserve > 0;
  const current = game.current;
  const npcAttack = phase === "decision" && plan?.attack.kind === "attack" ? plan.attack.from : null;
  const caption = captionFor(phase, plan, transfer);
  const moving = phase === "transfer" ? transfer : null;

  const armies = phase === "yourTurn" ? game.territoriesOf(game.currentIndex).filter((territory) => territory.soldiers >= 2) : [];
  const source = chosen && armies.includes(chosen) ? chosen : strongest(armies);
  const targets = source ? game.territories.filter((territory) => game.canAttack(source, territory)) : [];
  const attacker = aiming && targets.length ? source : npcAttack;

  const save = useEffectEvent(onSave);
  useEffect(() => {
    const npcMove = phase === "deploy" || phase === "decision" || phase === "afterWar" || phase === "transfer";
    if (phase === "announce" || phase === "gameOver" || phase === "defeated" || npcMove || (game.current.human && phase === "yourTurn")) save();
  }, [phase, game]);

  function changed() {
    refresh();
    if (game.current.human) onSave();
  }

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  function aim() {
    if (placing) setNotice("Place your new soldiers first");
    else if (!armies.length) setNotice(homeRule);
    else setAiming(!aiming);
  }

  function skip() {
    if (placing) return setNotice("Place your new soldiers first");
    setAiming(false);
    endTurn();
  }

  function attack(target: Territory) {
    if (!source) return;
    setAiming(false);
    startWar(source, target);
  }

  function place(territory: Territory) {
    if (territory.owner !== game.currentIndex) return;
    game.placeReinforcements(territory, 1);
    changed();
  }

  const transferDrag = useSoldierDrag((target) => {
    const name = target.closest<HTMLElement>("[data-territory]")?.dataset.territory;
    const to = game.territories.find((territory) => territory.name === name);
    const from = dragFrom.current;
    if (!from || !to || to === from || to.owner !== game.currentIndex) return;
    game.moveSoldiers(from, to, 1);
    setMoves([...moves, { from, to }]);
    changed();
  });

  function startTransfer() {
    setAiming(false);
    setTransferring(true);
  }

  function grab(event: PointerEvent, territory: Territory) {
    if (!transferring || territory.owner !== game.currentIndex || territory.soldiers < 2) return;
    dragFrom.current = territory;
    transferDrag.startDrag(event);
  }

  function finishTransfer() {
    const grouped = new Map<string, { from: Territory; to: Territory; count: number }>();
    for (const { from, to } of moves) {
      const key = `${from.name}>${to.name}`;
      const move = grouped.get(key) ?? { from, to, count: 0 };
      grouped.set(key, { ...move, count: move.count + 1 });
    }
    for (const move of grouped.values()) game.commentator.moved(current, move.from, move.to, move.count);
    setMoves([]);
    setTransferring(false);
  }

  function choose(territory: Territory) {
    if (transferring) return;
    if (placing) place(territory);
    else if (targets.includes(territory)) attack(territory);
    else if (armies.includes(territory)) setChosen(territory);
    else if (phase === "yourTurn" && territory.owner !== game.currentIndex && !game.attacked) setNotice(homeRule);
  }

  function placeOn(territoryName: string) {
    const territory = game.territories.find((candidate) => candidate.name === territoryName);
    if (territory && placing) place(territory);
  }

  return (
    <PaceContext value={pace}>
      <PausedContext value={paused}>
        <div className={paused ? "game game-paused" : "game"}>
          <main className="board-screen" onClick={advance}>
            <header className="board-hud">
              <button
                className="board-pause"
                type="button"
                aria-label="Pause"
                data-tip="Pause"
                onClick={(event) => {
                  event.stopPropagation();
                  setPaused(true);
                }}
              >
                <svg viewBox="0 0 48 48" aria-hidden="true">
                  <defs>
                    <radialGradient id="bomb-body" cx="0.35" cy="0.3" r="0.75">
                      <stop offset="0" stopColor="#6e777d" />
                      <stop offset="0.45" stopColor="#262b2f" />
                      <stop offset="1" stopColor="#07090a" />
                    </radialGradient>
                    <linearGradient id="bomb-cap" x1="0" x2="1">
                      <stop offset="0" stopColor="#5a6267" />
                      <stop offset="0.5" stopColor="#b5bdc1" />
                      <stop offset="1" stopColor="#3b4246" />
                    </linearGradient>
                  </defs>
                  <path className="bomb-fuse" d="M34.5 11.5 C36 6 40 5.5 42 8 S44 13 41 13" />
                  <g className="bomb-spark">
                    <path d="M41 9.5 l1.2-3.3 0.9 3 3.2-1.1-2.2 2.6 3 1.4-3.3 0.4 0.6 3.3-2.3-2.4-2.1 2.6 0.3-3.4-3.3-0.2 2.9-1.6z" fill="#f08a3c" />
                    <circle cx="42.2" cy="11" r="1.6" fill="#ffe08a" />
                  </g>
                  <rect x="27.5" y="9" width="8" height="6" rx="1" fill="url(#bomb-cap)" transform="rotate(40 31.5 12)" />
                  <circle cx="22" cy="28" r="16" fill="url(#bomb-body)" />
                  <ellipse cx="15.5" cy="20" rx="4.5" ry="2.6" fill="#fff" opacity="0.28" transform="rotate(-35 15.5 20)" />
                  <rect x="17.6" y="22" width="3.4" height="12" rx="1" fill="var(--cream)" />
                  <rect x="23" y="22" width="3.4" height="12" rx="1" fill="var(--cream)" />
                </svg>
              </button>
              <span className="board-round">Round {game.round}</span>
              <ol className="board-turns" aria-label="Turn order">
                {game.players.map((player) => (
                  <li
                    key={player.country.name}
                    className={player === current ? "board-turn now" : "board-turn"}
                    title={player.human ? `${player.country.name} (you)` : player.country.name}
                  >
                    <img src={squareFlagUrl(player.country.code)} alt={player.country.name} />
                  </li>
                ))}
              </ol>
              <div ref={log} className="board-log-wrap">
                <button
                  className="board-log-button"
                  type="button"
                  aria-expanded={logOpen}
                  onClick={(event) => {
                    event.stopPropagation();
                    setLogOpen(!logOpen);
                  }}
                >
                  Log
                </button>
                {logOpen && (
                  <ol className="board-log" onClick={(event) => event.stopPropagation()}>
                    {[...game.commentator.entries].reverse().map((entry, index) => (
                      <li key={game.commentator.entries.length - index} className={entry.heading ? "heading" : undefined}>
                        {entry.who && <b>{entry.who}</b>} {entry.text}
                        {entry.reason && <em>{entry.reason}</em>}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              <SettingsMenu
                settings={settings}
                onChange={onSettingsChange}
                onTransfer={phase === "yourTurn" && !placing && !transferring ? startTransfer : undefined}
                onHowToPlay={() => {
                  setPaused(true);
                  onHowToPlay?.();
                }}
              />
            </header>

            <div className="board-map">
              {game.territories.map((territory, index) => {
                const [x, y, tilt, size] = scatter[index];
                const owner = game.players[territory.owner];
                const classes = ["board-country"];
                if (owner.human) classes.push("you");
                if (territory === attacker || territory === moving?.from || territory === moving?.to) classes.push("attacking");
                if (aiming && targets.includes(territory)) classes.push("target");
                if (!aiming && !placing && !transferring && !game.attacked && armies.includes(territory)) classes.push("ready");
                if (war && territory !== war.from && territory !== war.to) classes.push("dim");
                if ((placing || transferring) && territory.owner === game.currentIndex) classes.push("droppable");
                if (transferring && territory.owner === game.currentIndex && territory.soldiers >= 2) classes.push("movable");
                return (
                  <div
                    key={territory.name}
                    className={classes.join(" ")}
                    data-territory={territory.name}
                    style={{ "--x": `${x}%`, "--y": `${y}px` } as CSSProperties}
                    onClick={() => choose(territory)}
                    onPointerDown={(event) => grab(event, territory)}
                  >
                    <Island
                      shape={countryShape(territory.country.mapName)}
                      flag={flagUrl(owner.country.code)}
                      soldiers={territory.soldiers}
                      style={{ transform: `rotate(${tilt}deg) scale(${size})` }}
                    />
                    <span className="board-label">
                      {territory.name}
                      <SoldierCount count={territory.soldiers} />
                    </span>
                  </div>
                );
              })}
              {phase === "skipStamp" && <div className="stamp">Skip turn</div>}
              {phase === "eliminated" && out && (
                <div className="stamp failed">{out.human ? "You are out" : `${out.country.name} is out`}</div>
              )}
            </div>

            <footer className="board-footer">
              {phase === "announce" && (
                <p className="board-announce">
                  {current.human ? "Your turn" : `${current.country.name}'s turn`}
                </p>
              )}
              {caption && (
                <p key={caption} className="board-caption">
                  {caption}
                </p>
              )}
              {notice && <p className="board-notice">{notice}</p>}
              {transferring && <p className="board-hint">Drag soldiers between your countries</p>}
              {phase === "yourTurn" && (
                <div className="board-actions">
                  {transferring ? (
                    <button className="btn btn-gold" type="button" onClick={finishTransfer}>
                      Done
                    </button>
                  ) : game.attacked ? (
                    <button className="btn btn-gold" type="button" onClick={endTurn}>
                      End turn
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn btn-gold"
                        type="button"
                        aria-disabled={placing || !armies.length}
                        aria-pressed={aiming}
                        onClick={aim}
                      >
                        Attack
                      </button>
                      <button className="btn btn-outline" type="button" aria-disabled={placing} onClick={skip}>
                        Skip
                      </button>
                    </>
                  )}
                </div>
              )}
            </footer>
          </main>
          {transferDrag.ghost && <SoldierGhost at={transferDrag.ghost} />}
          {caption && plan && (
            <StrategyBox key={caption} game={game} plan={plan} deploying={phase === "deploy"} transfer={moving} />
          )}
          {moving && <SoldierMarch from={moving.from} to={moving.to} count={moving.count} />}
          {(phase === "airdrop" || placing) && (
            <ReserveBox count={game.reserve} dropping={phase === "airdrop"} onDrop={placeOn} />
          )}
          {war && (
            <WarScreen
              game={game}
              from={war.from}
              to={war.to}
              commentary={settings.commentary}
              onChange={changed}
              onEnd={endWar}
            />
          )}
          {phase === "defeated" && (
            <EndScreen headline="Defeated" tone="lose" player={current} onNewGame={onNewGame} onWatch={watch} />
          )}
          {phase === "gameOver" && game.winner && (
            <EndScreen
              headline={game.winner.human ? "Victory" : `${game.winner.country.name} wins`}
              tone={game.winner.human ? "win" : "lose"}
              player={game.winner}
              onNewGame={onNewGame}
            />
          )}
          {!current.human && phase !== "gameOver" && phase !== "defeated" && (
            <button className="btn btn-gold board-fast" type="button" aria-pressed={pace > 1} onClick={toggleFast}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 5l9 7-9 7zM12 5l9 7-9 7z" />
              </svg>
              Fast-forward
            </button>
          )}
        </div>
        {paused && <PauseScreen onResume={() => setPaused(false)} onNewGame={onNewGame} />}
      </PausedContext>
    </PaceContext>
  );
}

export default BoardScreen;

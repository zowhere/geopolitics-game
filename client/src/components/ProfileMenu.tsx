import { useCallback, useId, useRef, useState } from "react";
import { useDismiss } from "../hooks/useDismiss";
import type { Game } from "../game/Game";
import AnalyticsPanel from "./AnalyticsPanel";
import ShareButton from "./ShareButton";
import "./ProfileMenu.css";

type ProfileMenuProps = {
  game: Game | null;
  gameId: string | null;
  username: string;
  onNewGame: () => void;
  onHowToPlay: () => void;
  onLogout: () => void;
};

const mostSoldiersShown = 12;

function Avatar() {
  const clipId = `avatar${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg className="profile-avatar" viewBox="0 0 40 40" aria-hidden="true">
      <clipPath id={clipId}>
        <circle cx="20" cy="20" r="18" />
      </clipPath>
      <circle cx="20" cy="20" r="18" fill="#2a6283" />
      <g clipPath={`url(#${clipId})`} stroke="#24180f" strokeWidth="1.1" strokeLinejoin="round">
        <path fill="#5f6d34" d="M6 41 Q7 31 15 30 L25 30 Q33 31 34 41 Z" />
        <path fill="none" stroke="#3e4824" d="M16 30 L20 34.5 L24 30" />
        <circle cx="10.6" cy="23.5" r="2.2" fill="#e8955c" />
        <circle cx="29.4" cy="23.5" r="2.2" fill="#e8955c" />
        <ellipse cx="20" cy="23" rx="9.6" ry="9.2" fill="#f2a66c" />
        <path fill="#dc8a52" stroke="none" d="M24 15.5 Q30 19 28.6 26 Q27 31 21 32 Q27 27 26.6 21 Z" />
        <path fill="#5f6d34" d="M8.6 20.5 Q8.4 6.4 20 6.2 Q31.6 6.4 31.4 20.5 Q20 16.4 8.6 20.5 Z" />
        <path fill="none" stroke="#93a457" strokeWidth="1.8" strokeLinecap="round" d="M12.4 13.6 Q15 9.2 20.6 8.6" />
        <path fill="#4a5428" d="M7.4 20.6 Q20 16 32.6 20.6 L32.4 22.8 Q20 18.6 7.6 22.8 Z" />
        <g className="avatar-eyes">
          <ellipse cx="15.6" cy="24.6" rx="2.1" ry="2" fill="#fff" />
          <ellipse cx="24.4" cy="24.6" rx="2.1" ry="2" fill="#fff" />
          <circle cx="16.2" cy="24.9" r="1.05" fill="#24180f" stroke="none" />
          <circle cx="23.8" cy="24.9" r="1.05" fill="#24180f" stroke="none" />
        </g>
        <path fill="none" strokeWidth="1.9" strokeLinecap="round" d="M12.6 21.6 L18.2 23.4 M27.4 21.6 L21.8 23.4" />
        <g className="avatar-mouth">
          <path fill="#7a1f22" d="M15.6 28 Q20 26.6 24.4 28 Q23.8 33 20 33 Q16.2 33 15.6 28 Z" />
          <path fill="#fff" strokeWidth="0.6" d="M16.2 28.1 Q20 27 23.8 28.1 L23.5 29.2 Q20 28.4 16.5 29.2 Z" />
          <ellipse cx="20" cy="31.6" rx="2.2" ry="1" fill="#e2676a" stroke="none" />
        </g>
      </g>
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
    </svg>
  );
}

function ProfileMenu({ game, gameId, username, onNewGame, onHowToPlay, onLogout }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useDismiss(root, open, useCallback(() => setOpen(false), []));
  const held = game ? game.territoriesOf(game.players.findIndex((player) => player.human)) : [];
  const soldiers = held.reduce((total, territory) => total + territory.soldiers, 0);

  function openAnalytics() {
    setOpen(false);
    setShowAnalytics(true);
  }

  return (
    <div ref={root} className="profile" onClick={(event) => event.stopPropagation()}>
      <button
        className="profile-button"
        type="button"
        aria-label="Profile"
        data-tip="Profile"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Avatar />
      </button>
      {open && (
        <div className="profile-panel">
          <div className="profile-who">
            <Avatar />
            <b>{username}</b>
          </div>
          {game && (
            <>
              <p className="profile-label">Your empire</p>
              <p className="profile-empire">
                Round {game.round}: {held.length ? `${held.length} out of 10 countries` : "out of the game"}
              </p>
              {held.length > 0 && (
                <p className="profile-empire">
                  Soldiers: {soldiers}
                  <span className="profile-soldiers">
                    {Array.from({ length: Math.min(soldiers, mostSoldiersShown) }, (_, index) => (
                      <svg key={index} viewBox="0 0 12 20" aria-hidden="true">
                        <use href="#soldier" />
                      </svg>
                    ))}
                  </span>
                </p>
              )}
            </>
          )}
          {gameId && game && <ShareButton gameId={gameId} className="profile-action" />}
          <button className="profile-action" type="button" onClick={openAnalytics}>
            Analytics
          </button>
          <button className="profile-action" type="button" onClick={onNewGame}>
            New game
          </button>
          <button className="profile-action" type="button" onClick={() => (setOpen(false), onHowToPlay())}>
            How to play
          </button>
          <button className="profile-action" type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      )}
      {showAnalytics && <AnalyticsPanel username={username} game={game} gameId={gameId} onClose={() => setShowAnalytics(false)} />}
    </div>
  );
}

export default ProfileMenu;

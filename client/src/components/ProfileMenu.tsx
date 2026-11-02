import { useState } from "react";
import type { Game } from "../game/Game";
import "./ProfileMenu.css";

type ProfileMenuProps = {
  game: Game;
  username: string;
  onNewGame: () => void;
  onLogout: () => void;
};

function Avatar() {
  return (
    <svg className="profile-avatar" viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <radialGradient id="avatar-sea" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#2f6584" />
          <stop offset="1" stopColor="#0d2a3c" />
        </radialGradient>
        <linearGradient id="avatar-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3e7c9" />
          <stop offset="1" stopColor="#bfae87" />
        </linearGradient>
        <clipPath id="avatar-circle">
          <circle cx="20" cy="20" r="18" />
        </clipPath>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#avatar-sea)" />
      <g clipPath="url(#avatar-circle)">
        <path fill="#4f5a2e" d="M5 40c0-9 6.5-14 15-14s15 5 15 14z" />
        <path fill="#3f4825" d="M15.5 26.6 20 31l4.5-4.4c-1.4-.4-2.9-.6-4.5-.6s-3.1.2-4.5.6z" />
        <circle cx="20" cy="16.5" r="7" fill="url(#avatar-skin)" />
        <path fill="#4f5a2e" d="M12.6 15.2c0-5 3.3-8.2 7.4-8.2s7.4 3.2 7.4 8.2z" />
        <rect x="11.6" y="14.4" width="16.8" height="2" rx="1" fill="#3f4825" />
      </g>
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
    </svg>
  );
}

function ProfileMenu({ game, username, onNewGame, onLogout }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const you = game.players.findIndex((player) => player.human);
  const held = game.territoriesOf(you);
  const soldiers = held.reduce((total, territory) => total + territory.soldiers, 0);

  return (
    <div className="profile" onClick={(event) => event.stopPropagation()}>
      <button
        className="profile-button"
        type="button"
        aria-label="Profile"
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
          <p className="profile-label">Your empire</p>
          <p className="profile-empire">
            {held.length ? `${held.length} of 10 countries · ${soldiers} soldiers · Round ${game.round}` : "Out of the game"}
          </p>
          <button className="profile-action" type="button" onClick={onNewGame}>
            New game
          </button>
          <button className="profile-action" type="button" onClick={onLogout}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;

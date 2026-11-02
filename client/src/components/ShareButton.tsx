import { useState } from "react";

type ShareButtonProps = {
  gameId: string;
  className: string;
};

function ShareButton({ gameId, className }: ShareButtonProps) {
  const [shared, setShared] = useState("");

  async function share() {
    const url = `${window.location.origin}/?watch=${gameId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Watch my Geopolitics 101 game", url });
        setShared("Shared");
      } else {
        await navigator.clipboard.writeText(url);
        setShared("Link copied");
      }
      setTimeout(() => setShared(""), 2000);
    } catch {
      return;
    }
  }

  return (
    <button className={className} type="button" onClick={share}>
      {shared || "Share game"}
    </button>
  );
}

export default ShareButton;

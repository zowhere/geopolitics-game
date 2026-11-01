import { useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Point } from "../map/StrikeFx";

export function useSoldierDrag(onDrop: (target: Element) => void) {
  const [ghost, setGhost] = useState<Point | null>(null);

  function startDrag(event: ReactPointerEvent) {
    event.preventDefault();
    setGhost({ x: event.clientX, y: event.clientY });
    const move = (moved: PointerEvent) => setGhost({ x: moved.clientX, y: moved.clientY });
    const release = (released: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      setGhost(null);
      const target = document.elementFromPoint(released.clientX, released.clientY);
      if (target) onDrop(target);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", release, { once: true });
  }

  return { ghost, startDrag };
}

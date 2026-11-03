import { useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Point } from "../map/StrikeFx";

const fingerLift = 44;

export function useSoldierDrag(onDrop: (target: Element) => void) {
  const [ghost, setGhost] = useState<Point | null>(null);

  function startDrag(event: ReactPointerEvent) {
    event.preventDefault();
    const lift = event.pointerType === "touch" ? fingerLift : 0;
    let over: Element | null = null;

    function hover(x: number, y: number) {
      const next = document.elementFromPoint(x, y)?.closest("[data-territory]") ?? null;
      if (next === over) return;
      over?.classList.remove("drag-over");
      next?.classList.add("drag-over");
      over = next;
    }

    function finish() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", finish);
      over?.classList.remove("drag-over");
      setGhost(null);
    }

    function move(moved: PointerEvent) {
      setGhost({ x: moved.clientX, y: moved.clientY - lift });
      hover(moved.clientX, moved.clientY);
    }

    function release(released: PointerEvent) {
      finish();
      const target = document.elementFromPoint(released.clientX, released.clientY);
      if (target) onDrop(target);
    }

    setGhost({ x: event.clientX, y: event.clientY - lift });
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", finish);
  }

  return { ghost, startDrag };
}

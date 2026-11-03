import { useEffect, type RefObject } from "react";

export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      const target = event.target as Element;
      if (ref.current?.contains(target)) return;
      onClose();
      if (!target.closest("button, a, input, select, textarea, label")) {
        event.stopPropagation();
        event.preventDefault();
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [ref, open, onClose]);
}

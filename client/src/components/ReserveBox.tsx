import type { PointerEvent as ReactPointerEvent } from "react";
import { useSoldierDrag } from "../hooks/useSoldierDrag";
import SoldierCount from "./SoldierCount";
import SoldierGhost from "./SoldierGhost";
import "./ReserveBox.css";

type ReserveBoxProps = {
  count: number;
  dropping: boolean;
  onDrop: (territoryName: string) => void;
};

function Plane() {
  return (
    <svg className="reserve-plane" viewBox="0 0 200 70" aria-hidden="true">
      <defs>
        <linearGradient id="plane-paint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a8455" />
          <stop offset="0.55" stopColor="#5d6640" />
          <stop offset="1" stopColor="#3f4529" />
        </linearGradient>
      </defs>
      <path fill="#4c5332" d="M20 30L9 5h15l22 21z" />
      <path fill="#3f4529" d="M8 33h40l-6 5H14z" />
      <path fill="url(#plane-paint)" d="M14 34c0-8 16-12 46-12h90c20 0 36 6 44 14-8 6-24 10-44 10H40c-14 0-26-4-26-12z" />
      <path fill="#3f4529" opacity={0.5} d="M18 38c6 5 14 8 22 8h110c14 0 27-3 36-7z" />
      <path fill="#1f2a2b" d="M172 29h11l7 5h-18z" />
      {[70, 82, 94, 106, 118, 130, 142].map((x) => (
        <circle key={x} cx={x} cy={30} r={1.8} fill="#2a3324" />
      ))}
      <path fill="#454b2e" d="M78 21h56l-6-5H86z" />
      <path fill="#565e3a" d="M96 17h22a4 4 0 0 1 0 8H96z" />
      <ellipse className="reserve-prop" cx={123} cy={21} rx={1.6} ry={13} fill="rgba(225, 222, 205, 0.45)" />
    </svg>
  );
}

function ReserveBox({ count, dropping, onDrop }: ReserveBoxProps) {
  const { ghost, startDrag } = useSoldierDrag((target) => {
    const territory = target.closest<HTMLElement>("[data-territory]")?.dataset.territory;
    if (territory) onDrop(territory);
  });

  function grab(event: ReactPointerEvent) {
    if (!dropping) startDrag(event);
  }

  return (
    <>
      {dropping && <Plane />}
      <div className={dropping ? "reserve-box dropping" : "reserve-box"} onPointerDown={grab}>
        <div className="reserve-crate">
          {dropping && (
            <svg className="reserve-chute" viewBox="0 0 84 80" aria-hidden="true">
              <path
                fill="none"
                stroke="#cfc6ad"
                strokeWidth={0.8}
                d="M6 34L8 80M28 31L8 80M56 31L76 80M78 34L76 80"
              />
              <path fill="#ddd3b8" d="M4 34C4 6 80 6 80 34c-10-6-24-4-38 0C28 30 14 28 4 34z" />
              <path fill="#b8ab88" d="M28 31C28 12 36 8 42 8s14 4 14 23c-5-2-9-2-14 3-5-5-9-5-14-3z" />
            </svg>
          )}
          <svg viewBox="0 0 84 64" aria-hidden="true">
            <ellipse cx={42} cy={61} rx={40} ry={3} fill="rgba(3, 12, 18, 0.45)" />
            <rect x={6} y={20} width={72} height={8} fill="#3d2d1b" />
            {Array.from({ length: Math.min(count, 6) }, (_, index) => (
              <use key={index} href="#soldier" x={9 + index * 11} y={4} width={13} height={22} />
            ))}
            <rect x={4} y={26} width={76} height={34} rx={2} fill="#8a6a3f" />
            <path stroke="#5e4527" strokeWidth={1.2} d="M4 37h76M4 48h76" />
            <path stroke="#6b4f2c" strokeWidth={4} d="M12 57L72 29" />
            <rect x={4} y={26} width={7} height={34} fill="#6b4f2c" />
            <rect x={73} y={26} width={7} height={34} fill="#6b4f2c" />
            <rect x={4} y={24} width={76} height={4} fill="#9b7a4a" />
          </svg>
        </div>
        <SoldierCount count={count} />
      </div>
      {ghost && <SoldierGhost at={ghost} />}
    </>
  );
}

export default ReserveBox;

import { useId, type CSSProperties } from "react";
import { useLoadedImage } from "../hooks/useLoadedImage";
import type { CountryShape } from "../map/countryShape";
import { troopSpots } from "../map/troopSpots";
import "./Island.css";

type IslandProps = {
  shape: CountryShape;
  flag: string;
  soldiers?: number;
  className?: string;
  style?: CSSProperties;
};

const flagRatio = 4 / 3;
const mostSoldiersShown = 12;

function flagArea({ x, y, width, height }: CountryShape["box"]) {
  const boxRatio = width / height;
  const ratio = Math.min(Math.max(boxRatio, flagRatio / 2), flagRatio * 2);
  if (ratio < boxRatio) {
    const flagHeight = width / ratio;
    return { x, y: y + (height - flagHeight) / 2, width, height: flagHeight };
  }
  return { x, y, width: height * ratio, height };
}

function Island({ shape, flag, soldiers, className, style }: IslandProps) {
  const clipId = `coast${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const flagReady = useLoadedImage(flag);
  const { path, box } = shape;
  const area = flagArea(box);

  return (
    <svg
      viewBox="0 0 200 150"
      className={className ? `island ${className}` : "island"}
      style={style}
      aria-hidden="true"
    >
      <path className="island-halo" d={path} />
      <g className="island-land">
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
        <path className="island-ground" d={path} />
        {flagReady && (
          <image
            key={flag}
            href={flag}
            clipPath={`url(#${clipId})`}
            x={area.x}
            y={area.y}
            width={area.width}
            height={area.height}
            preserveAspectRatio="none"
          />
        )}
      </g>
      <path className="island-coast" d={path} />
      {soldiers !== undefined &&
        troopSpots(path, Math.min(soldiers, mostSoldiersShown)).map(([x, y], index) => (
          <use
            key={index}
            href="#soldier"
            className="island-soldier"
            x={x - 5}
            y={y - 16}
            width={10}
            height={16}
          />
        ))}
    </svg>
  );
}

export default Island;

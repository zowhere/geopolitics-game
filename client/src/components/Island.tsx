import type { CSSProperties } from 'react'
import './Island.css'

type IslandProps = {
  path: string
  color: string
  className?: string
  style?: CSSProperties
}

function Island({ path, color, className, style }: IslandProps) {
  return (
    <svg
      viewBox="0 0 200 150"
      className={className ? `island ${className}` : 'island'}
      style={style}
      aria-hidden="true"
    >
      <path className="island-halo" d={path} />
      <path className="island-land" d={path} fill={color} />
      <path className="island-coast" d={path} />
    </svg>
  )
}

export default Island

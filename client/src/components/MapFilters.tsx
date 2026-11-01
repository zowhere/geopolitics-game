function MapFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="island-texture" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={4} seed={7} result="noise" />
          <feColorMatrix in="noise" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="grain" />
          <feComposite in="SourceGraphic" in2="grain" operator="arithmetic" k1={0.85} k2={0.6} k3={0} k4={0} />
        </filter>
        <filter id="island-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={3} />
        </filter>
      </defs>
    </svg>
  )
}

export default MapFilters

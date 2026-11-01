function MapFilters() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <filter
          id="island-texture"
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.04"
            numOctaves={5}
            seed={7}
            result="terrain"
          />
          <feDiffuseLighting
            in="terrain"
            surfaceScale={3}
            diffuseConstant={1}
            lightingColor="#ffffff"
            result="relief"
          >
            <feDistantLight azimuth={235} elevation={38} />
          </feDiffuseLighting>
          <feComposite
            in="SourceGraphic"
            in2="relief"
            operator="arithmetic"
            k1={1}
            k2={0.3}
            k3={0.08}
            k4={-0.12}
            result="lit"
          />
          <feGaussianBlur in="SourceAlpha" stdDeviation={4} result="soft" />
          <feComposite
            in="SourceAlpha"
            in2="soft"
            operator="arithmetic"
            k2={1}
            k3={-1}
            result="rim"
          />
          <feFlood floodColor="#0b2232" floodOpacity={0.45} />
          <feComposite in2="rim" operator="in" result="shade" />
          <feMerge result="shaded">
            <feMergeNode in="lit" />
            <feMergeNode in="shade" />
          </feMerge>
          <feComposite in="shaded" in2="SourceAlpha" operator="in" />
        </filter>
        <filter id="island-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={3} />
        </filter>
        <symbol id="soldier" viewBox="0 0 12 20">
          <g stroke="#161a12" strokeWidth={0.35} strokeLinejoin="round">
            <path fill="#2a2a26" d="M9.9 2.6l0.9 0.2-1.6 11.4-0.9-0.2z" />
            <path fill="#5c6834" d="M3.5 6.3h5l0.5 5.4H3z" />
            <path fill="#5c6834" d="M3.5 6.5L2.2 10.8l1 0.3 1.1-3.4zM8.5 6.5l1.2 2.6-0.6 1.4-1.3-1.8z" />
            <path fill="#3a3f22" d="M3 10.7h6v0.9H3z" />
            <path fill="#4b5530" d="M3.3 11.6h2.5l-0.3 6.2H3.6zM6.2 11.6h2.5l-0.3 6.2H6.5z" />
            <path fill="#1e1e1c" d="M3.4 17.6h2.3v1.6H3zM6.4 17.6h2.3l0.3 1.6H6.4z" />
            <ellipse fill="#c99a74" cx="6" cy="4.7" rx="1.6" ry="1.4" />
            <path fill="#4f5a2e" d="M3.2 4C3.2 1.9 4.4 0.7 6 0.7S8.8 1.9 8.8 4z" />
            <path fill="#3f4825" d="M2.7 3.7h6.6v0.7H2.7z" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}

export default MapFilters;

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
      </defs>
    </svg>
  );
}

export default MapFilters;

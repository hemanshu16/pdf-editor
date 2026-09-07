/** Shared SVG filter that gives flat black rectangles a marker-stroke edge. */
export default function InkFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id="ink-rough" x="-20%" y="-60%" width="140%" height="220%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9 0.35" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

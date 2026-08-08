function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g>
        <path d="M32 6 A26 26 0 0 1 55.5 22.5 L45 27 A15 15 0 0 0 32 17 Z" fill="var(--corail)" />
        <path d="M55.5 22.5 A26 26 0 0 1 55.5 41.5 L45 37 A15 15 0 0 0 45 27 Z" fill="var(--dore)" />
        <path d="M55.5 41.5 A26 26 0 0 1 32 58 L32 47 A15 15 0 0 0 45 37 Z" fill="var(--vert-paye)" />
        <path d="M32 58 A26 26 0 0 1 8.5 41.5 L19 37 A15 15 0 0 0 32 47 Z" fill="var(--bleu-moyen)" />
        <path d="M8.5 22.5 A26 26 0 0 1 32 6 L32 17 A15 15 0 0 0 19 27 Z" fill="var(--corail)" opacity="0.85" />
      </g>
      <circle cx="32" cy="32" r="9" fill="var(--dore)" />
    </svg>
  );
}

export default Logo;
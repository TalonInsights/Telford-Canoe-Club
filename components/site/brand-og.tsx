/**
 * DR-02 — the badge for generated images (`apple-icon`, `opengraph-image`).
 * Satori rasterises inline SVG, so this variant avoids clipPath, ids and text:
 * every stroke is pre-shortened to sit inside the ring. Same geometry as
 * `ClubBadge` in brand.tsx — change one, change both.
 */
export function OgBadge({ size, color = '#ffffff' }: { size: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="50" cy="50" r="47.5" strokeWidth="3.5" />
      <path d="M11 34H89" strokeWidth="2.4" />
      <path d="M13 29.5H87" strokeWidth="1.1" />
      <path d="M17 68A33 33 0 0 1 83 68" strokeWidth="2.4" />
      <path d="M24 68A26 26 0 0 1 76 68" strokeWidth="1.4" />
      <path d="M17 68V78M83 68V78" strokeWidth="2.4" />
      <path d="M23 82c6-2.8 12-2.8 18 0s12 2.8 18 0 12-2.8 18 0" strokeWidth="1.5" />
      <path d="M32 88.5c6-2.8 12-2.8 18 0s12 2.8 18 0" strokeWidth="1.5" opacity="0.7" />
      <g fill={color} stroke="none">
        <path d="M20 77Q50 68 84 71.5Q52 83 20 77Z" />
        <path d="M45.5 58.5h9a3 3 0 0 1 3 3v11h-15v-11a3 3 0 0 1 3-3Z" />
        <circle cx="50" cy="51.5" r="4.6" />
        <ellipse cx="29" cy="73" rx="5.2" ry="2.5" transform="rotate(-34 29 73)" />
        <ellipse cx="71" cy="44.5" rx="5.2" ry="2.5" transform="rotate(-34 71 44.5)" />
      </g>
      <path d="M32 71L68 46.5" strokeWidth="2.6" />
      <path d="M47 62L41 65.5M54 61.5L61 51.5" strokeWidth="2.4" />
    </svg>
  )
}

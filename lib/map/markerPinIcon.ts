export type MarkerIconConfig = {
  url: string;
  scaledSize: { width: number; height: number };
  anchor: { x: number; y: number };
};

export type PinVariant = 'cliente' | 'empresa' | 'pending';

const PIN_WIDTH = 34;
const PIN_HEIGHT = 44;

const MARKER_COLORS = {
  gris: '#94A3B8',
  empresa: '#F59E0B',
} as const;

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildPinSvg(fillColor: string, variant: PinVariant): string {
  const innerSymbol =
    variant === 'empresa'
      ? `<path d="M12.5 17.5V14.5L16 12L19.5 14.5V17.5H17.5V21H14.5V17.5H12.5Z" fill="${fillColor}" opacity="0.85"/>`
      : variant === 'pending'
        ? `<circle cx="16" cy="14" r="2.2" fill="#64748B"/>`
        : `<circle cx="16" cy="14" r="4.5" fill="#FFFFFF" opacity="0.95"/>`;

  const fillOpacity = variant === 'pending' ? '0.88' : '1';
  const strokeColor = variant === 'pending' ? '#CBD5E1' : '#FFFFFF';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_WIDTH}" height="${PIN_HEIGHT}" viewBox="0 0 34 44">
  <ellipse cx="17" cy="40" rx="7" ry="2.2" fill="#0F172A" opacity="0.12"/>
  <path
    d="M17 2C10.1 2 5 7.4 5 14.2C5 23.1 17 41 17 41C17 41 29 23.1 29 14.2C29 7.4 23.9 2 17 2Z"
    fill="${fillColor}"
    fill-opacity="${fillOpacity}"
    stroke="${strokeColor}"
    stroke-width="2"
    stroke-linejoin="round"
  />
  ${innerSymbol}
</svg>`;
}

export function createPinIcon(fillColor: string, variant: PinVariant = 'cliente'): MarkerIconConfig {
  return {
    url: svgToDataUrl(buildPinSvg(fillColor, variant)),
    scaledSize: { width: PIN_WIDTH, height: PIN_HEIGHT },
    anchor: { x: PIN_WIDTH / 2, y: PIN_HEIGHT },
  };
}

export const PIN_ICONS = {
  gris: createPinIcon(MARKER_COLORS.gris, 'pending'),
  empresa: createPinIcon(MARKER_COLORS.empresa, 'empresa'),
} as const;

export const REPARTIDOR_PIN_COLORS = [
  '#2563EB',
  '#16A34A',
  '#DC2626',
  '#9333EA',
  '#EA580C',
  '#DB2777',
  '#0891B2',
  '#4F46E5',
] as const;

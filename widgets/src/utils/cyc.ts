export interface SwatchPalette {
  swatch: string;
  onLight: string;
  onDark: string;
}

const BLUE: SwatchPalette = {
  swatch: '#0868f7',
  onLight: '#0864ed',
  onDark: '#4b91f9',
};

const GREEN: SwatchPalette = {
  swatch: '#079455',
  onLight: '#067f49',
  onDark: '#2fa570',
};

const SKY: SwatchPalette = {
  swatch: '#0ea5e9',
  onLight: '#0a77a8',
  onDark: '#0ea5e9',
};

const ORANGE: SwatchPalette = {
  swatch: '#f97316',
  onLight: '#b35310',
  onDark: '#f97316',
};

const PURPLE: SwatchPalette = {
  swatch: '#7c3aed',
  onLight: '#7c3aed',
  onDark: '#a577f3',
};

const RED: SwatchPalette = {
  swatch: '#ef4444',
  onLight: '#c93939',
  onDark: '#f15e5e',
};

const PINK: SwatchPalette = {
  swatch: '#ec4899',
  onLight: '#bf3a7c',
  onDark: '#ee57a1',
};

const MUTED: SwatchPalette = {
  swatch: '#5f6e83',
  onLight: '#5f6e83',
  onDark: '#8591a1',
};

export const TRACK_PALETTES: Record<string, SwatchPalette> = {
  AI: BLUE,
  JavaScript: GREEN,
  Cloud: SKY,
  Java: ORANGE,
  Leadership: PURPLE,
  Workshops: RED,
  Keynote: BLUE,
  CYC26: MUTED,
};

export const ROOM_PALETTES: Record<string, SwatchPalette> = {
  'Room 1D': PINK,
  'Room 2A': BLUE,
  'Room 2B': GREEN,
  'Room 2C': ORANGE,
  'Room 2D': RED,
  'Room 2E': PURPLE,
  'Main Hall': BLUE,
};

export const TRACK_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(TRACK_PALETTES).map(([name, palette]) => [
    name,
    palette.swatch,
  ])
);

export const ROOM_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(ROOM_PALETTES).map(([name, palette]) => [name, palette.swatch])
);

export function trackPalette(track: string): SwatchPalette {
  return TRACK_PALETTES[track] ?? BLUE;
}

export function roomPalette(room: string): SwatchPalette {
  return ROOM_PALETTES[room] ?? MUTED;
}

export function trackColor(track: string): string {
  return trackPalette(track).swatch;
}

export function roomColor(room: string): string {
  return roomPalette(room).swatch;
}

export function formatClock(iso: string | null): string {
  if (!iso) return 'TBA';
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}

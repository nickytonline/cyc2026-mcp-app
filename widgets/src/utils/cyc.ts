export const TRACK_COLORS: Record<string, string> = {
  AI: '#0868f7',
  JavaScript: '#079455',
  Cloud: '#0ea5e9',
  Java: '#f97316',
  Leadership: '#7c3aed',
  Workshops: '#ef4444',
  Keynote: '#0868f7',
  CYC26: '#5f6e83',
};

export const ROOM_COLORS: Record<string, string> = {
  'Room 1D': '#ec4899',
  'Room 2A': '#0868f7',
  'Room 2B': '#079455',
  'Room 2C': '#f97316',
  'Room 2D': '#ef4444',
  'Room 2E': '#7c3aed',
  'Main Hall': '#0868f7',
};

export function trackColor(track: string): string {
  return TRACK_COLORS[track] ?? '#0868f7';
}

export function roomColor(room: string): string {
  return ROOM_COLORS[room] ?? '#5f6e83';
}

export function formatClock(iso: string | null): string {
  if (!iso) return 'TBA';
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
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

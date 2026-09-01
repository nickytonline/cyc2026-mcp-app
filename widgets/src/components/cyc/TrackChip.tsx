import type { CSSProperties } from 'react';
import { cn } from '../../utils/cn';
import { roomPalette, trackPalette, type SwatchPalette } from '../../utils/cyc';

const SWATCH_TEXT =
  'text-[var(--cyc-swatch-on-light)] dark:text-[var(--cyc-swatch-on-dark)]';

function swatchTextStyle(palette: SwatchPalette): CSSProperties {
  return {
    '--cyc-swatch-on-light': palette.onLight,
    '--cyc-swatch-on-dark': palette.onDark,
  } as CSSProperties;
}

export function TrackChip({ track }: { track: string }) {
  const palette = trackPalette(track);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[0.6875rem] font-bold uppercase tracking-wider',
        SWATCH_TEXT
      )}
      style={{
        ...swatchTextStyle(palette),
        borderColor: `${palette.swatch}40`,
        backgroundColor: `${palette.swatch}14`,
      }}
    >
      <span
        className="inline-block size-1.5 rounded-full"
        style={{ backgroundColor: palette.swatch }}
        aria-hidden="true"
      />
      {track}
    </span>
  );
}

export function RoomLabel({
  room,
  className,
}: {
  room: string;
  className?: string;
}) {
  const palette = roomPalette(room);
  return (
    <span
      className={cn(
        'font-mono text-[0.6875rem] font-bold uppercase',
        SWATCH_TEXT,
        className
      )}
      style={swatchTextStyle(palette)}
    >
      {room}
    </span>
  );
}

import { trackColor } from '../../utils/cyc';

export function TrackChip({ track }: { track: string }) {
  const color = trackColor(track);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[0.6875rem] font-bold uppercase tracking-wider"
      style={{
        color,
        borderColor: `${color}40`,
        backgroundColor: `${color}14`,
      }}
    >
      <span
        className="inline-block size-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {track}
    </span>
  );
}

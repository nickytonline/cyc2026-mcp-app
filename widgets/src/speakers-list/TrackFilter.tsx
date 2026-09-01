'use client';

import { ChevronDown } from 'lucide-react';
import type { TrackInfo } from 'mcp-app-server/types';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { TRACK_COLORS } from '../utils/cyc';

const FALLBACK_TRACKS: TrackInfo[] = Object.keys(TRACK_COLORS)
  .filter((name) => name !== 'CYC26')
  .map((shortName) => ({
    id: shortName.toLowerCase(),
    name: shortName,
    shortName,
    color: TRACK_COLORS[shortName] ?? '#0868f7',
    blurb: '',
  }));

export function TrackFilter({
  tracks,
  selected,
  onChange,
}: {
  tracks?: TrackInfo[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const options = tracks && tracks.length > 0 ? tracks : FALLBACK_TRACKS;
  const label =
    selected.length === 0
      ? 'All tracks'
      : selected.length === 1
        ? selected[0]
        : `${selected.length} tracks`;

  function toggle(track: string) {
    if (selected.includes(track)) {
      onChange(selected.filter((value) => value !== track));
      return;
    }
    onChange([...selected, track]);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-[8px] border-[var(--cyc-line)] bg-[var(--cyc-paper)] px-2.5 font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--cyc-ink)] hover:bg-[var(--cyc-cloud)] hover:text-[var(--cyc-ink)] data-[state=open]:bg-[var(--cyc-cloud)] data-[state=open]:text-[var(--cyc-ink)]"
          aria-label={`Filter by track, ${label}`}
        >
          {label}
          <ChevronDown className="size-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Tracks</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((track) => (
          <DropdownMenuCheckboxItem
            key={track.id}
            checked={selected.includes(track.shortName)}
            onCheckedChange={() => toggle(track.shortName)}
            onSelect={(event) => event.preventDefault()}
          >
            {track.shortName}
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[var(--cyc-muted)]"
              onSelect={() => onChange([])}
            >
              Clear
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

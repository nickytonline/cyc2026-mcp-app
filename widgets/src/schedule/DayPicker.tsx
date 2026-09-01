'use client';

import type { ScheduleDayOption } from 'mcp-app-server/types';
import { cn } from '../utils/cn';
import { formatShortDate } from '../utils/cyc';

export const CONFERENCE_DAYS: ScheduleDayOption[] = [
  { day: 0, date: '2026-09-02', label: 'Day 0', slots: [], events: [] },
  { day: 1, date: '2026-09-03', label: 'Day 1', slots: [], events: [] },
  { day: 2, date: '2026-09-04', label: 'Day 2', slots: [], events: [] },
];

export function DayPicker({
  days,
  selected,
  onChange,
}: {
  days?: ScheduleDayOption[];
  selected: number;
  onChange: (day: number) => void;
}) {
  const options = days && days.length > 0 ? days : CONFERENCE_DAYS;

  return (
    <div
      role="radiogroup"
      aria-label="Conference day"
      className="grid shrink-0 grid-cols-3 gap-1 rounded-[8px] border border-[var(--cyc-line)] bg-[var(--cyc-paper)] p-1"
    >
      {options.map((option) => {
        const checked = option.day === selected;
        return (
          <button
            key={option.day}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => {
              if (!checked) onChange(option.day);
            }}
            className={cn(
              'rounded-[6px] px-2 py-1.5 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cyc-blue)]',
              checked
                ? 'bg-[var(--cyc-navy)] text-white dark:bg-[var(--cyc-blue)]'
                : 'text-[var(--cyc-ink)] hover:bg-[var(--cyc-cloud)]'
            )}
          >
            <span className="block font-mono text-[0.6875rem] font-bold uppercase tracking-wider">
              {option.label}
            </span>
            <span
              className={cn(
                'block text-[0.6875rem]',
                checked ? 'text-white/80' : 'text-[var(--cyc-muted)]'
              )}
            >
              {formatShortDate(option.date)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

import { useState } from 'react';
import { initials } from '../../utils/cyc';

export function SpeakerPhoto({
  name,
  photoUrl,
  className,
  alt,
}: {
  name: string;
  photoUrl: string | null;
  className?: string;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);
  const label = alt ?? name;
  if (!photoUrl || failed) {
    return (
      <div
        className={`grid place-items-center bg-[var(--cyc-navy)] font-mono text-xs font-bold text-white ${className ?? ''}`}
        aria-hidden="true"
      >
        {initials(name)}
      </div>
    );
  }
  return (
    <img
      src={photoUrl}
      alt={label}
      className={`object-cover ${className ?? ''}`}
      onError={() => setFailed(true)}
    />
  );
}

export function SessionSpeakerByline({
  speakers,
  className,
}: {
  speakers: Array<{ id: string; name: string; photoUrl?: string | null }>;
  className?: string;
}) {
  if (speakers.length === 0) {
    return (
      <p className={`text-[0.75rem] text-[var(--cyc-muted)] ${className ?? ''}`}>
        Speakers TBA
      </p>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className ?? ''}`}
    >
      {speakers.map((speaker) => (
        <span
          key={speaker.id}
          className="flex min-w-0 items-center gap-2 text-[0.75rem] text-[var(--cyc-muted)]"
        >
          <SpeakerPhoto
            name={speaker.name}
            photoUrl={speaker.photoUrl ?? null}
            alt=""
            className="size-7 shrink-0 overflow-hidden rounded-[6px]"
          />
          {speaker.name}
        </span>
      ))}
    </div>
  );
}

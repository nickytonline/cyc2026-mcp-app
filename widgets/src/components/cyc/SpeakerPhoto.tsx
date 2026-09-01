import { useState } from 'react';
import { initials } from '../../utils/cyc';

export function SpeakerPhoto({
  name,
  photoUrl,
  className,
}: {
  name: string;
  photoUrl: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
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
      alt={name}
      className={`object-cover ${className ?? ''}`}
      onError={() => setFailed(true)}
    />
  );
}

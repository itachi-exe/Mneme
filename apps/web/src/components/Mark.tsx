export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="6.2" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
      <circle cx="16" cy="16" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="wordmark">
      <span className="wordmark-mark">
        <Mark size={18} />
      </span>
      {compact ? null : <span>Mneme</span>}
    </span>
  );
}

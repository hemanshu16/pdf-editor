export default function DocumentMark() {
  return (
    <svg viewBox="0 0 280 320" width="220" height="251" fill="none" aria-hidden="true">
      <g transform="rotate(-3 140 160)">
        <rect x="30" y="16" width="220" height="288" rx="4" fill="var(--surface)" stroke="var(--paper-line)" strokeWidth="1.5" />
        <rect x="58" y="52" width="120" height="10" rx="2" fill="var(--ink-faint)" />
        <rect x="58" y="78" width="164" height="8" rx="2" fill="var(--ink-faint)" opacity="0.6" />
        <rect x="58" y="96" width="150" height="8" rx="2" fill="var(--ink-faint)" opacity="0.6" />

        <rect x="58" y="128" width="164" height="17" rx="2" fill="var(--redact-fill)" filter="url(#ink-rough)" />
        <rect x="58" y="154" width="120" height="8" rx="2" fill="var(--ink-faint)" opacity="0.6" />

        <rect x="58" y="184" width="96" height="17" rx="2" fill="var(--redact-fill)" filter="url(#ink-rough)" />
        <rect x="164" y="184" width="58" height="8" rx="2" fill="var(--ink-faint)" opacity="0.6" transform="translate(0 4.5)" />

        <rect x="58" y="216" width="164" height="8" rx="2" fill="var(--ink-faint)" opacity="0.6" />
        <rect x="58" y="234" width="140" height="8" rx="2" fill="var(--ink-faint)" opacity="0.6" />
      </g>
      <g transform="rotate(-3 140 160)">
        <rect x="196" y="252" width="17" height="72" rx="3" fill="var(--stamp-red)" transform="rotate(35 204.5 288)" />
      </g>
    </svg>
  );
}

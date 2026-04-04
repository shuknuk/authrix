interface AuthrixLogoProps {
  /** Size of the mark in px (default 28) */
  size?: number;
  /** Whether to show the wordmark beside the mark (default true) */
  showWordmark?: boolean;
  className?: string;
}

/**
 * Authrix brand mark — a padlock/A dual-read logo.
 *
 * The padlock SHACKLE is the letter "A":
 *   • Two angled legs rise from the lock body to a pointed apex — identical to an A
 *   • The lock body (filled rect) serves as the base, echoing the A's crossbar region
 *   • A keyhole is punched out of the body, grounding the security / auth reading
 *
 * At a glance it reads "padlock". Look again — it's an A.
 */
export function AuthrixLogo({
  size = 28,
  showWordmark = true,
  className = '',
}: AuthrixLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ lineHeight: 1 }}>
      {/* ── Mark ── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ display: 'block', flexShrink: 0 }}
      >
        {/*
          ── Shackle = A letterform ──
          Apex at (14, 3). Left leg descends to (8, 15), right leg to (20, 15).
          These are exactly the two diagonal strokes of a geometric "A".
          strokeLinecap="butt" gives a clean, engineered cut where the legs
          enter the lock body (flush with the rect top edge at y=15).
        */}
        <path
          d="M8 15 L14 3 L20 15"
          stroke="#F97316"
          strokeWidth="2.6"
          strokeLinejoin="miter"
          strokeLinecap="butt"
          fill="none"
        />

        {/*
          ── Lock body ──
          A filled orange rectangle. Its top edge at y=15 is where the
          shackle legs terminate — the connection is seamless.
          Width intentionally wider than the shackle (as on a real padlock).
        */}
        <rect
          x="2"
          y="15"
          width="24"
          height="11"
          rx="2.5"
          fill="#F97316"
        />

        {/*
          ── Shackle entry points ──
          Small filled darker rectangles at (8,15) and (20,15) mark where the
          shackle arms enter the body — a real padlock detail that also adds
          visual weight to the A's leg endpoints.
        */}
        <rect x="6.2" y="14.5" width="3.6" height="3" rx="0.5" fill="#d96010" />
        <rect x="18.2" y="14.5" width="3.6" height="3" rx="0.5" fill="#d96010" />

        {/*
          ── Keyhole ──
          Punched out of the lock body using var(--background) so it works
          on both dark and light nav backgrounds.
          Classic keyhole: circle (the key bow) + narrow rounded rect (the key blade slot).
        */}
        <circle cx="14" cy="19.5" r="2.2" fill="var(--background)" />
        <rect
          x="12.8"
          y="21.2"
          width="2.4"
          height="3.2"
          rx="0.6"
          fill="var(--background)"
        />
      </svg>

      {/* ── Wordmark ── */}
      {showWordmark && (
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9375rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--foreground)',
            lineHeight: 1,
          }}
        >
          Authrix
        </span>
      )}
    </div>
  );
}

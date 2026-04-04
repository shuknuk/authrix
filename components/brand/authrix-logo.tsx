interface AuthrixLogoProps {
  size?: number;
  className?: string;
  variant?: "default" | "light";
}

export function AuthrixLogo({
  size = 24,
  className = "",
  variant = "default",
}: AuthrixLogoProps) {
  const color = variant === "light" ? "#fffaf5" : "var(--primary)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 15L14 3L20 15"
        stroke={color}
        strokeWidth="2.6"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
      <rect x="2" y="15" width="24" height="11" rx="2.5" fill={color} />
      <rect
        x="6.2"
        y="14.5"
        width="3.6"
        height="3"
        rx="0.5"
        fill={variant === "light" ? "rgba(255,250,245,0.8)" : "color-mix(in srgb, var(--primary) 80%, black)"}
      />
      <rect
        x="18.2"
        y="14.5"
        width="3.6"
        height="3"
        rx="0.5"
        fill={variant === "light" ? "rgba(255,250,245,0.8)" : "color-mix(in srgb, var(--primary) 80%, black)"}
      />
      <circle cx="14" cy="19.5" r="2.2" fill={variant === "light" ? "#1a1612" : "var(--background)"} />
      <rect x="12.8" y="21.2" width="2.4" height="3.2" rx="0.6" fill={variant === "light" ? "#1a1612" : "var(--background)"} />
    </svg>
  );
}

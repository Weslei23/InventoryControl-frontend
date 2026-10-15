export default function AuthShell({ eyebrow, title, subtitle, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background:
          "radial-gradient(circle at 15% 15%, rgba(232,163,61,0.08), transparent 45%), var(--ink)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 30 }}>
          <svg width="30" height="30" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="20" fill="#161A22" />
            <rect x="24" y="44" width="14" height="32" fill="#E8A33D" />
            <rect x="43" y="28" width="14" height="48" fill="#E8A33D" />
            <rect x="62" y="36" width="14" height="40" fill="#E8A33D" />
          </svg>
          <div className="h-display" style={{ fontSize: 22 }}>
            ESTOQUE<span style={{ color: "var(--signal)" }}>//</span>
          </div>
        </div>

        <div className="panel" style={{ padding: 32 }}>
          {eyebrow && (
            <div className="mono dim" style={{ fontSize: 11, marginBottom: 8, letterSpacing: "0.05em" }}>
              {eyebrow}
            </div>
          )}
          <h1 className="h-display" style={{ fontSize: 28, margin: "0 0 8px" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="dim" style={{ fontSize: 13.5, margin: "0 0 26px", lineHeight: 1.5 }}>
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

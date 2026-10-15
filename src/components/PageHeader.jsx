export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        padding: "28px 32px 20px",
        borderBottom: "1px solid var(--line)",
        flexWrap: "wrap",
      }}
    >
      <div>
        {eyebrow && (
          <div className="mono dim" style={{ fontSize: 11.5, marginBottom: 6, letterSpacing: "0.04em" }}>
            {eyebrow}
          </div>
        )}
        <h1 className="h-display" style={{ fontSize: 32, margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p className="dim" style={{ margin: "6px 0 0", fontSize: 13.5, maxWidth: 520 }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
    </div>
  );
}

export default function StatCard({ label, value, hint, accent }) {
  return (
    <div className="panel" style={{ padding: "18px 20px", flex: 1, minWidth: 180 }}>
      <div className="mono dim" style={{ fontSize: 11, letterSpacing: "0.05em", marginBottom: 10 }}>
        {label}
      </div>
      <div
        className="h-display"
        style={{ fontSize: 34, color: accent || "var(--paper)", lineHeight: 1 }}
      >
        {value}
      </div>
      {hint && (
        <div className="dim" style={{ fontSize: 12, marginTop: 8 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

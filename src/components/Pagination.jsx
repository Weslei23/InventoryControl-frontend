export default function Pagination({ page, totalPages, totalElements, onChange }) {
  if (totalPages <= 1) return null;

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px",
        borderTop: "1px solid var(--line)",
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      <span className="dim" style={{ fontSize: 12.5 }}>
        {totalElements} {totalElements === 1 ? "registro" : "registros"} · página {page + 1} de {totalPages}
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-sm" disabled={!canPrev} onClick={() => onChange(page - 1)}>
          ← Anterior
        </button>
        <button className="btn btn-sm" disabled={!canNext} onClick={() => onChange(page + 1)}>
          Próxima →
        </button>
      </div>
    </div>
  );
}

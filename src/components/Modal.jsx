export default function Modal({ title, onClose, children, footer, width }) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="modal" style={width ? { maxWidth: width } : undefined}>
        <div className="modal-head">
          <h3 className="h-display" style={{ fontSize: 20, margin: 0 }}>
            {title}
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar">
            Fechar
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

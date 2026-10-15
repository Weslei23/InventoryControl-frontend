import Modal from "./Modal";

export default function ConfirmDialog({ title, message, onCancel, onConfirm, busy }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      width={420}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Excluindo..." : "Excluir"}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, color: "var(--paper-dim)", lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import { MovementsAPI } from "../api/movements";
import { ProductsAPI } from "../api/products";
import { extractErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 20;

const TYPE_LABELS = {
  INBOUND: { label: "Entrada", cls: "badge-ok" },
  OUTBOUND: { label: "Saída", cls: "badge-danger" },
  ADJUSTMENT: { label: "Ajuste", cls: "badge-neutral" },
};

export default function Movements() {
  const toast = useToast();
  const { user, can } = useAuth();
  const canCreate = can("MOVEMENT_CREATE");
  const canUpdate = can("MOVEMENT_UPDATE");
  const canDelete = can("MOVEMENT_DELETE");
  const canReadProducts = can("PRODUCT_READ");
  const [movements, setMovements] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ productId: "", movementType: "INBOUND", quantity: 1 });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load(targetPage = page) {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([
        MovementsAPI.list({ page: targetPage, size: PAGE_SIZE, sort: "createdAt,desc" }),
        canReadProducts ? ProductsAPI.list({ size: 500 }).catch(() => ({ content: [] })) : { content: [] },
      ]);
      setMovements(m?.content || []);
      setTotalPages(m?.totalPages ?? 0);
      setTotalElements(m?.totalElements ?? 0);
      setPage(m?.number ?? targetPage);
      setProducts(p?.content || []);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Não foi possível carregar as movimentações."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (typeFilter === "ALL") return movements;
    return movements.filter((m) => m.movementType === typeFilter);
  }, [movements, typeFilter]);

  function openEdit(movement) {
    // MovementResponseDTO does not carry the product, so it has to be chosen again.
    setEditingId(movement.id);
    setForm({ productId: "", movementType: movement.movementType, quantity: movement.quantity });
    setFormError("");
    setFormOpen(true);
  }

  function openCreate() {
    setEditingId(null);
    setForm({ productId: products[0]?.id ?? "", movementType: "INBOUND", quantity: 1 });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");
    if (!form.productId) {
      setFormError("Selecione um produto.");
      return;
    }
    if (!user?.id) {
      setFormError("Não foi possível identificar o usuário logado. Faça login novamente.");
      return;
    }
    const quantity = Number(form.quantity) || 0;
    if (quantity < 1) {
      setFormError("Informe uma quantidade maior que zero.");
      return;
    }
    if (!editingId && form.movementType === "OUTBOUND") {
      const product = products.find((p) => String(p.id) === String(form.productId));
      if (product && quantity > product.quantity) {
        setFormError(`Estoque insuficiente: há apenas ${product.quantity} unidade(s) de "${product.name}".`);
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        productId: Number(form.productId),
        movementType: form.movementType,
        quantity,
        userId: user?.id,
      };
      if (editingId) {
        await MovementsAPI.update(editingId, payload);
        toast.success("Movimentação atualizada.");
      } else {
        await MovementsAPI.create(payload);
        toast.success("Movimentação registrada.");
      }
      setFormOpen(false);
      load(editingId ? page : 0);
    } catch (err) {
      setFormError(extractErrorMessage(err, "Não foi possível registrar a movimentação."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await MovementsAPI.remove(deleteTarget.id);
      toast.success("Movimentação removida.");
      setDeleteTarget(null);
      load(page);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Não foi possível remover a movimentação."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="HISTÓRICO"
        title="Movimentações"
        subtitle="Entradas, saídas e ajustes de estoque registrados no sistema."
        actions={
          canCreate && (
            <button className="btn btn-primary" onClick={openCreate}>
              Nova movimentação
            </button>
          )
        }
      />

      <div style={{ padding: "20px 32px 0", display: "flex", gap: 8 }}>
        {["ALL", "INBOUND", "OUTBOUND", "ADJUSTMENT"].map((t) => (
          <button
            key={t}
            className="btn btn-sm"
            onClick={() => setTypeFilter(t)}
            style={{
              background: typeFilter === t ? "var(--signal)" : "var(--panel-raised)",
              color: typeFilter === t ? "#221806" : "var(--paper)",
              borderColor: typeFilter === t ? "var(--signal)" : "var(--line)",
            }}
          >
            {t === "ALL" ? "Todas" : TYPE_LABELS[t].label}
          </button>
        ))}
      </div>

      <div style={{ padding: 32 }}>
        <div className="panel">
          {loading ? (
            <div className="empty-state">Carregando movimentações...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">Nenhuma movimentação encontrada.</div>
          ) : (
            <div className="table-wrap">
              <table className="grid">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Quantidade</th>
                    <th>Usuário</th>
                    <th>Data</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const info = TYPE_LABELS[m.movementType] || { label: m.movementType, cls: "badge-neutral" };
                    return (
                      <tr key={m.id}>
                        <td>
                          <span className={`badge ${info.cls}`}>{info.label}</span>
                        </td>
                        <td className="mono">{m.quantity}</td>
                        <td>{m.userName || "—"}</td>
                        <td className="dim mono" style={{ fontSize: 12.5 }}>
                          {formatDate(m.createdAt)}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            {canUpdate && (
                              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(m)}>
                                Editar
                              </button>
                            )}
                            {canDelete && (
                              <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(m)}>
                                Excluir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {typeFilter === "ALL" && (
            <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onChange={load} />
          )}
        </div>
        {typeFilter !== "ALL" && (
          <p className="dim" style={{ fontSize: 12, marginTop: 10 }}>
            O filtro por tipo se aplica apenas à página atual (a API não filtra por tipo no servidor).
          </p>
        )}
      </div>

      {formOpen && (
        <Modal
          title={editingId ? "Editar movimentação" : "Nova movimentação"}
          onClose={() => setFormOpen(false)}
          width={420}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancelar
              </button>
              <button className="btn btn-primary" form="movement-form" type="submit" disabled={saving}>
                {saving ? "Salvando..." : editingId ? "Salvar" : "Registrar"}
              </button>
            </>
          }
        >
          <form id="movement-form" onSubmit={handleSave}>
            <div className="field">
              <label htmlFor="m-product">Produto</label>
              <select
                id="m-product"
                required
                value={form.productId}
                onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
              >
                <option value="">Selecione</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="m-type">Tipo</label>
                <select
                  id="m-type"
                  value={form.movementType}
                  onChange={(e) => setForm((f) => ({ ...f, movementType: e.target.value }))}
                >
                  <option value="INBOUND">Entrada</option>
                  <option value="OUTBOUND">Saída</option>
                  <option value="ADJUSTMENT">Ajuste</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="m-qty">Quantidade</label>
                <input
                  id="m-qty"
                  type="number"
                  min="1"
                  required
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
            </div>
            {editingId ? (
              <p className="dim" style={{ fontSize: 12, margin: "0 0 10px" }}>
                A edição só altera o registro (produto, tipo e quantidade) e o associa ao seu usuário;
                a API não recalcula o estoque do produto.
              </p>
            ) : form.movementType === "ADJUSTMENT" ? (
              <p className="dim" style={{ fontSize: 12, margin: "0 0 10px" }}>
                Ajuste apenas registra o evento — a API não altera a quantidade em estoque.
              </p>
            ) : null}
            {!canReadProducts && (
              <div className="field-error">
                Sua conta não pode listar produtos (PRODUCT_READ), necessário para escolher o produto.
              </div>
            )}
            {formError && <div className="field-error">{formError}</div>}
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir movimentação"
          message="Tem certeza que deseja excluir este registro de movimentação?"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          busy={deleting}
        />
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

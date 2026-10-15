import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import { SuppliersAPI } from "../api/suppliers";
import { extractErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 20;

const emptyForm = { name: "", contact: "", email: "", address: "" };

export default function Suppliers() {
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can("SUPPLIER_CREATE");
  const canUpdate = can("SUPPLIER_UPDATE");
  const canDelete = can("SUPPLIER_DELETE");
  const [suppliers, setSuppliers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load(targetPage = page) {
    setLoading(true);
    try {
      const data = await SuppliersAPI.list({ page: targetPage, size: PAGE_SIZE, sort: "name,asc" });
      setSuppliers(data?.content || []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
      setPage(data?.number ?? targetPage);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Não foi possível carregar os fornecedores."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(supplier) {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name || "",
      contact: supplier.contact || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editingId) {
        await SuppliersAPI.update(editingId, form);
        toast.success("Fornecedor atualizado.");
      } else {
        await SuppliersAPI.create(form);
        toast.success("Fornecedor cadastrado.");
      }
      setFormOpen(false);
      load(editingId ? page : 0);
    } catch (err) {
      setFormError(extractErrorMessage(err, "Não foi possível salvar o fornecedor."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await SuppliersAPI.remove(deleteTarget.id);
      toast.success("Fornecedor excluído.");
      setDeleteTarget(null);
      load(page);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Não foi possível excluir o fornecedor."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="PARCEIROS"
        title="Fornecedores"
        subtitle="Mantenha os dados de contato de quem abastece o seu estoque."
        actions={
          canCreate && (
            <button className="btn btn-primary" onClick={openCreate}>
              Novo fornecedor
            </button>
          )
        }
      />

      <div style={{ padding: 32 }}>
        <div className="panel">
          {loading ? (
            <div className="empty-state">Carregando fornecedores...</div>
          ) : suppliers.length === 0 ? (
            <div className="empty-state">Nenhum fornecedor cadastrado ainda.</div>
          ) : (
            <div className="table-wrap">
              <table className="grid">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Contato</th>
                    <th>E-mail</th>
                    <th>Endereço</th>
                    <th>Produtos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.contact}</td>
                      <td>{s.email}</td>
                      <td className="dim">{s.address}</td>
                      <td className="mono">{s.products?.length ?? 0}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {canUpdate && (
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>
                              Editar
                            </button>
                          )}
                          {canDelete && (
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(s)}>
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onChange={load} />
        </div>
      </div>

      {formOpen && (
        <Modal
          title={editingId ? "Editar fornecedor" : "Novo fornecedor"}
          onClose={() => setFormOpen(false)}
          width={480}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancelar
              </button>
              <button className="btn btn-primary" form="supplier-form" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </>
          }
        >
          <form id="supplier-form" onSubmit={handleSave}>
            <div className="field">
              <label htmlFor="s-name">Nome</label>
              <input
                id="s-name"
                required
                autoFocus
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              {editingId && (
                <span className="field-hint">
                  Atenção: a API atual pode recusar a edição com "já existe" mesmo salvando com o
                  mesmo nome. Se isso acontecer, é uma validação a ser corrigida no backend.
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="s-contact">Contato (telefone)</label>
              <input
                id="s-contact"
                required
                value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="s-email">E-mail</label>
              <input
                id="s-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="s-address">Endereço</label>
              <input
                id="s-address"
                required
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            {formError && <div className="field-error">{formError}</div>}
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir fornecedor"
          message={`Tem certeza que deseja excluir "${deleteTarget.name}"?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          busy={deleting}
        />
      )}
    </div>
  );
}

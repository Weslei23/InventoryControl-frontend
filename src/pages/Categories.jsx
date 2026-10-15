import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import { CategoriesAPI } from "../api/categories";
import { extractErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 20;

export default function Categories() {
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can("CATEGORY_CREATE");
  const canUpdate = can("CATEGORY_UPDATE");
  const canDelete = can("CATEGORY_DELETE");
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load(targetPage = page) {
    setLoading(true);
    try {
      const data = await CategoriesAPI.list({ page: targetPage, size: PAGE_SIZE, sort: "name,asc" });
      setCategories(data?.content || []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
      setPage(data?.number ?? targetPage);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Não foi possível carregar as categorias."));
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
    setName("");
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(category) {
    setEditingId(category.id);
    setName(category.name || "");
    setFormError("");
    setFormOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editingId) {
        await CategoriesAPI.update(editingId, { categoryName: name });
        toast.success("Categoria atualizada.");
      } else {
        await CategoriesAPI.create({ categoryName: name });
        toast.success("Categoria criada.");
      }
      setFormOpen(false);
      load(editingId ? page : 0);
    } catch (err) {
      setFormError(extractErrorMessage(err, "Não foi possível salvar a categoria."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await CategoriesAPI.remove(deleteTarget.id);
      toast.success("Categoria excluída.");
      setDeleteTarget(null);
      load(page);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Não foi possível excluir a categoria."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="ORGANIZAÇÃO"
        title="Categorias"
        subtitle="Agrupe produtos por categoria para facilitar buscas e relatórios."
        actions={
          canCreate && (
            <button className="btn btn-primary" onClick={openCreate}>
              Nova categoria
            </button>
          )
        }
      />

      <div style={{ padding: 32 }}>
        <div className="panel">
          {loading ? (
            <div className="empty-state">Carregando categorias...</div>
          ) : categories.length === 0 ? (
            <div className="empty-state">Nenhuma categoria cadastrada ainda.</div>
          ) : (
            <div className="table-wrap">
              <table className="grid">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Produtos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td className="mono">
                        {c.productCount ?? "—"}
                        <span className="dim"> {c.productCount === 1 ? "produto" : "produtos"}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {canUpdate && (
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>
                              Editar
                            </button>
                          )}
                          {canDelete && (
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(c)}>
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
          title={editingId ? "Editar categoria" : "Nova categoria"}
          onClose={() => setFormOpen(false)}
          width={420}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancelar
              </button>
              <button className="btn btn-primary" form="category-form" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </>
          }
        >
          <form id="category-form" onSubmit={handleSave}>
            <div className="field">
              <label htmlFor="c-name">Nome da categoria</label>
              <input
                id="c-name"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Eletrônicos"
              />
            </div>
            {formError && <div className="field-error">{formError}</div>}
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir categoria"
          message={
            `Tem certeza que deseja excluir "${deleteTarget.name}"?` +
            (deleteTarget.productCount > 0
              ? ` Há ${deleteTarget.productCount} produto(s) vinculado(s) a ela; a exclusão pode ser recusada pelo servidor.`
              : "")
          }
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          busy={deleting}
        />
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import ProductThumbnail, { useProductImage } from "../components/ProductImage";
import { ProductsAPI } from "../api/products";
import { CategoriesAPI } from "../api/categories";
import { SuppliersAPI } from "../api/suppliers";
import { MovementsAPI } from "../api/movements";
import { extractErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 20;
// Categories/suppliers are loaded in full for the form's dropdowns (not paginated there).
const OPTIONS_PAGE_SIZE = 500;

const emptyForm = {
  name: "",
  description: "",
  state: "ACTIVE",
  price: "",
  quantity: 0,
  minimumQuantity: 0,
  maximumQuantity: 1,
  categoryId: "",
  supplierId: "",
};

export default function Products() {
  const toast = useToast();
  const { user, can } = useAuth();
  const canCreate = can("PRODUCT_CREATE");
  const canUpdate = can("PRODUCT_UPDATE");
  const canDelete = can("PRODUCT_DELETE");
  const canExport = can("PRODUCT_EXPORT");
  const canMove = can("MOVEMENT_CREATE");
  const canReadCategories = can("CATEGORY_READ");
  const canReadSuppliers = can("SUPPLIER_READ");
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [zoomTarget, setZoomTarget] = useState(null); // product whose picture is enlarged
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [stockTarget, setStockTarget] = useState(null); // { product, direction }
  const [stockQty, setStockQty] = useState(1);
  const [stockBusy, setStockBusy] = useState(false);

  async function loadProducts(targetPage = page) {
    setLoading(true);
    try {
      const data = await ProductsAPI.list({ page: targetPage, size: PAGE_SIZE, sort: "name,asc" });
      setProducts(data?.content || []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
      setPage(data?.number ?? targetPage);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Não foi possível carregar os produtos."));
    } finally {
      setLoading(false);
    }
  }

  async function loadFormOptions() {
    try {
      const [c, s] = await Promise.all([
        canReadCategories
          ? CategoriesAPI.list({ size: OPTIONS_PAGE_SIZE }).catch(() => ({ content: [] }))
          : { content: [] },
        canReadSuppliers
          ? SuppliersAPI.list({ size: OPTIONS_PAGE_SIZE }).catch(() => ({ content: [] }))
          : { content: [] },
      ]);
      setCategories(c?.content || []);
      setSuppliers(s?.content || []);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Não foi possível carregar categorias/fornecedores."));
    }
  }

  useEffect(() => {
    loadProducts(0);
    loadFormOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.categoryDTO?.name?.toLowerCase().includes(q) ||
        p.supplierResponseDTO?.name?.toLowerCase().includes(q)
    );
  }, [products, search]);

  function openCreate() {
    setEditingId(null);
    setEditingImage(null);
    setForm(emptyForm);
    setImageFile(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(product) {
    setEditingId(product.id);
    setEditingImage(product.image || null);
    setForm({
      name: product.name || "",
      description: product.description || "",
      state: product.state || "ACTIVE",
      price: product.price ?? "",
      quantity: product.quantity ?? 0,
      minimumQuantity: product.minimumQuantity ?? 0,
      maximumQuantity: product.maximumQuantity ?? 1,
      categoryId: product.categoryDTO?.id ?? "",
      supplierId: product.supplierResponseDTO?.id ?? "",
    });
    setImageFile(null);
    setFormError("");
    setFormOpen(true);
  }

  function validateForm() {
    if (!form.categoryId) return "Selecione uma categoria.";
    if (!form.supplierId) return "Selecione um fornecedor (obrigatório).";
    if (form.price === "" || Number(form.price) < 0.01) return "Informe um preço maior que R$ 0,01.";
    if (Number(form.quantity) < 0) return "A quantidade não pode ser negativa.";
    if (Number(form.minimumQuantity) < 0) return "O estoque mínimo não pode ser negativo.";
    if (Number(form.maximumQuantity) < 1) return "O estoque máximo deve ser pelo menos 1.";
    return "";
  }

  async function handleSave(e) {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError("");
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      state: form.state,
      price: Number(form.price),
      quantity: Number(form.quantity) || 0,
      minimumQuantity: Number(form.minimumQuantity) || 0,
      maximumQuantity: Number(form.maximumQuantity) || 1,
      categoryId: Number(form.categoryId),
      supplierId: Number(form.supplierId),
    };
    try {
      if (editingId) {
        // PUT /update is JSON-only: keep the current file name in `image` (the API cannot swap the file).
        await ProductsAPI.update(editingId, { ...payload, image: editingImage });
        toast.success("Produto atualizado.");
      } else {
        await ProductsAPI.create(payload, imageFile);
        toast.success("Produto cadastrado.");
      }
      setFormOpen(false);
      loadProducts(editingId ? page : 0);
    } catch (err) {
      setFormError(extractErrorMessage(err, "Não foi possível salvar o produto."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ProductsAPI.remove(deleteTarget.id);
      toast.success("Produto excluído.");
      setDeleteTarget(null);
      loadProducts(page);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Não foi possível excluir o produto."));
    } finally {
      setDeleting(false);
    }
  }

  async function handleStockConfirm() {
    if (!stockTarget) return;
    const qty = Number(stockQty);
    if (!qty || qty <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }
    if (!user?.id) {
      toast.error("Não foi possível identificar o usuário logado. Faça login novamente.");
      return;
    }
    if (stockTarget.direction === "OUTBOUND" && qty > stockTarget.product.quantity) {
      toast.error(`Estoque insuficiente: há apenas ${stockTarget.product.quantity} unidade(s).`);
      return;
    }
    setStockBusy(true);
    try {
      const payload = {
        productId: stockTarget.product.id,
        movementType: stockTarget.direction,
        quantity: qty,
        userId: user.id,
      };
      if (stockTarget.direction === "INBOUND") {
        await MovementsAPI.inbound(payload);
      } else {
        await MovementsAPI.outbound(payload);
      }
      toast.success(stockTarget.direction === "INBOUND" ? "Entrada registrada." : "Saída registrada.");
      setStockTarget(null);
      setStockQty(1);
      loadProducts(page);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Não foi possível registrar a movimentação."));
    } finally {
      setStockBusy(false);
    }
  }

  async function handleDownload() {
    try {
      const blob = await ProductsAPI.downloadSheet();
      const url = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "Relatorio_Produtos.xls";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Não foi possível gerar o relatório."));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="CATÁLOGO"
        title="Produtos"
        subtitle="Cadastre itens, acompanhe níveis de estoque e registre entradas e saídas."
        actions={
          <>
            {canExport && (
              <button className="btn" onClick={handleDownload}>
                Exportar planilha
              </button>
            )}
            {canCreate && (
              <button className="btn btn-primary" onClick={openCreate}>
                Novo produto
              </button>
            )}
          </>
        }
      />

      <div style={{ padding: "20px 32px 0" }}>
        <input
          placeholder="Buscar por nome, categoria ou fornecedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 420,
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 6,
            color: "var(--paper)",
            padding: "10px 14px",
            fontSize: 13.5,
          }}
        />
      </div>

      <div style={{ padding: 32 }}>
        <div className="panel">
          {loading ? (
            <div className="empty-state">Carregando produtos...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">Nenhum produto encontrado.</div>
          ) : (
            <div className="table-wrap">
              <table className="grid">
                <thead>
                  <tr>
                    <th></th>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Fornecedor</th>
                    <th>Preço</th>
                    <th>Estoque</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td style={{ width: 64 }}>
                        <ProductThumbnail
                          image={p.image}
                          name={p.name}
                          onClick={p.image ? () => setZoomTarget(p) : undefined}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        {p.description && (
                          <div className="dim" style={{ fontSize: 12, maxWidth: 260 }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td>{p.categoryDTO?.name || "—"}</td>
                      <td>{p.supplierResponseDTO?.name || "—"}</td>
                      <td className="mono">{formatCurrency(p.price)}</td>
                      <td className="mono">
                        {p.quantity}
                        <span className="dim"> / min {p.minimumQuantity}</span>
                      </td>
                      <td>
                        <StockBadge product={p} />
                        <div style={{ marginTop: 4 }}>
                          <span className={`badge ${p.state === "INACTIVE" ? "badge-neutral" : "badge-ok"}`}>
                            {p.state === "INACTIVE" ? "Inativo" : "Ativo"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {canMove && (
                            <>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setStockTarget({ product: p, direction: "INBOUND" })}
                                title="Registrar entrada"
                              >
                                + Entrada
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setStockTarget({ product: p, direction: "OUTBOUND" })}
                                title="Registrar saída"
                              >
                                − Saída
                              </button>
                            </>
                          )}
                          {canUpdate && (
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>
                              Editar
                            </button>
                          )}
                          {canDelete && (
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(p)}>
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
          {!loading && !search && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              onChange={(next) => loadProducts(next)}
            />
          )}
        </div>
        {search && (
          <p className="dim" style={{ fontSize: 12, marginTop: 10 }}>
            A busca filtra apenas a página atual carregada. Limpe o campo para navegar entre páginas.
          </p>
        )}
      </div>

      {formOpen && (
        <Modal
          title={editingId ? "Editar produto" : "Novo produto"}
          onClose={() => setFormOpen(false)}
          width={560}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancelar
              </button>
              <button className="btn btn-primary" form="product-form" type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar produto"}
              </button>
            </>
          }
        >
          <form id="product-form" onSubmit={handleSave}>
            <div className="field">
              <label htmlFor="p-name">Nome</label>
              <input
                id="p-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="p-desc">Descrição</label>
              <textarea
                id="p-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="p-file">Imagem do produto</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <ImagePreview file={imageFile} existingImage={editingId ? editingImage : null} />
                {editingId ? (
                  <span className="field-hint" style={{ flex: 1 }}>
                    {editingImage
                      ? `Imagem atual: ${editingImage}. `
                      : "Este produto não tem imagem. "}
                    A API só aceita o envio de imagem no cadastro; na edição ela é mantida como está.
                  </span>
                ) : (
                  <input
                    id="p-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="p-category">Categoria</label>
                <select
                  id="p-category"
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="p-supplier">Fornecedor *</label>
                <select
                  id="p-supplier"
                  required
                  value={form.supplierId}
                  onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="p-price">Preço (R$) *</label>
                <input
                  id="p-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="p-state">Status</label>
                <select
                  id="p-state"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="p-qty">Quantidade inicial</label>
                <input
                  id="p-qty"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="p-min">Estoque mínimo</label>
                <input
                  id="p-min"
                  type="number"
                  min="0"
                  value={form.minimumQuantity}
                  onChange={(e) => setForm((f) => ({ ...f, minimumQuantity: e.target.value }))}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="p-max">Estoque máximo *</label>
              <input
                id="p-max"
                type="number"
                min="1"
                required
                value={form.maximumQuantity}
                onChange={(e) => setForm((f) => ({ ...f, maximumQuantity: e.target.value }))}
              />
            </div>
            {editingId && (
              <p className="dim" style={{ fontSize: 12, margin: "0 0 10px" }}>
                Na edição, a API atualiza nome, descrição, preço, quantidades, categoria e fornecedor.
                O status (Ativo/Inativo) só é gravado no cadastro.
              </p>
            )}
            {(!canReadCategories || !canReadSuppliers) && (
              <div className="field-error">
                Sua conta não pode listar{" "}
                {[!canReadCategories && "categorias", !canReadSuppliers && "fornecedores"]
                  .filter(Boolean)
                  .join(" e ")}
                , necessários para salvar um produto. Peça a permissão{" "}
                {[!canReadCategories && "CATEGORY_READ", !canReadSuppliers && "SUPPLIER_READ"]
                  .filter(Boolean)
                  .join(" e ")}
                .
              </div>
            )}
            {formError && <div className="field-error">{formError}</div>}
          </form>
        </Modal>
      )}

      {zoomTarget && (
        <Modal title={zoomTarget.name} onClose={() => setZoomTarget(null)} width={520}>
          <ZoomedImage image={zoomTarget.image} name={zoomTarget.name} />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Excluir produto"
          message={`Tem certeza que deseja excluir "${deleteTarget.name}"? Esta ação não pode ser desfeita.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          busy={deleting}
        />
      )}

      {stockTarget && (
        <Modal
          title={stockTarget.direction === "INBOUND" ? "Registrar entrada" : "Registrar saída"}
          onClose={() => setStockTarget(null)}
          width={400}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setStockTarget(null)} disabled={stockBusy}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleStockConfirm} disabled={stockBusy}>
                {stockBusy ? "Registrando..." : "Confirmar"}
              </button>
            </>
          }
        >
          <p className="dim" style={{ marginTop: 0 }}>
            Produto: <strong style={{ color: "var(--paper)" }}>{stockTarget.product.name}</strong>{" "}
            (estoque atual: {stockTarget.product.quantity})
          </p>
          <div className="field">
            <label htmlFor="stock-qty">Quantidade</label>
            <input
              id="stock-qty"
              type="number"
              min="1"
              autoFocus
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function ZoomedImage({ image, name }) {
  const { url, loading } = useProductImage(image);
  if (!url) return <div className="empty-state">{loading ? "Carregando imagem..." : "Imagem indisponível."}</div>;
  return <img src={url} alt={name} style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 8 }} />;
}

function ImagePreview({ file, existingImage }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const { url: existingUrl } = useProductImage(previewUrl ? null : existingImage);
  const src = previewUrl || existingUrl;

  return (
    <div
      style={{
        width: 64,
        height: 64,
        flexShrink: 0,
        borderRadius: 8,
        border: "1px solid var(--line)",
        background: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {src ? (
        <img src={src} alt="Pré-visualização" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span className="dim" style={{ fontSize: 10 }}>
          Sem imagem
        </span>
      )}
    </div>
  );
}

function StockBadge({ product }) {
  if (product.quantity === 0) return <span className="badge badge-danger">Sem estoque</span>;
  if (product.quantity <= product.minimumQuantity) return <span className="badge badge-warn">Baixo</span>;
  if (product.maximumQuantity && product.quantity >= product.maximumQuantity)
    return <span className="badge badge-neutral">No limite</span>;
  return <span className="badge badge-ok">Normal</span>;
}

function formatCurrency(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

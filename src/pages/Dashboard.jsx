import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { ProductsAPI } from "../api/products";
import { SuppliersAPI } from "../api/suppliers";
import { CategoriesAPI } from "../api/categories";
import { MovementsAPI } from "../api/movements";
import { extractErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

// The API now paginates every list endpoint. For dashboard aggregates we pull a large single
// page instead of implementing full pagination here — fine for typical inventory sizes, but if a
// list grows past this, the counts below will be based on a partial page.
const DASHBOARD_PAGE_SIZE = 500;

export default function Dashboard() {
  const toast = useToast();
  const { can, user, hasNoPermissions } = useAuth();
  const canProducts = can("PRODUCT_READ");
  const canSuppliers = can("SUPPLIER_READ");
  const canCategories = can("CATEGORY_READ");
  const canMovements = can("MOVEMENT_READ");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState([]);
  const [counts, setCounts] = useState({ products: 0, suppliers: 0, categories: 0 });

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const emptyPage = { content: [], totalElements: 0 };
        const [p, s, c, m] = await Promise.all([
          // Each list needs its own *_READ permission; skip the call when the user lacks it.
          canProducts ? ProductsAPI.list({ size: DASHBOARD_PAGE_SIZE }).catch(() => emptyPage) : emptyPage,
          canSuppliers ? SuppliersAPI.list({ size: DASHBOARD_PAGE_SIZE }).catch(() => emptyPage) : emptyPage,
          canCategories ? CategoriesAPI.list({ size: DASHBOARD_PAGE_SIZE }).catch(() => emptyPage) : emptyPage,
          canMovements
            ? MovementsAPI.list({ size: DASHBOARD_PAGE_SIZE, sort: "createdAt,desc" }).catch(() => emptyPage)
            : emptyPage,
        ]);
        if (!mounted) return;
        setProducts(p?.content || []);
        setSuppliers(s?.content || []);
        setCategories(c?.content || []);
        setMovements(m?.content || []);
        setCounts({
          products: p?.totalElements ?? p?.content?.length ?? 0,
          suppliers: s?.totalElements ?? s?.content?.length ?? 0,
          categories: c?.totalElements ?? c?.content?.length ?? 0,
        });
      } catch (err) {
        toast.error(extractErrorMessage(err, "Não foi possível carregar o painel."));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canProducts, canSuppliers, canCategories, canMovements]);

  const lowStock = useMemo(
    () => products.filter((p) => p.quantity <= p.minimumQuantity),
    [products]
  );

  const totalValue = useMemo(
    () => products.reduce((sum, p) => sum + (Number(p.price) || 0) * (p.quantity || 0), 0),
    [products]
  );

  const recentMovements = useMemo(
    () =>
      [...movements]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8),
    [movements]
  );

  return (
    <div>
      <PageHeader
        eyebrow="VISÃO GERAL"
        title="Painel"
        subtitle="Resumo em tempo real do estoque, catálogo e movimentações recentes."
      />

      {hasNoPermissions && (
        <div style={{ padding: "24px 32px 0" }}>
          <div className="panel" style={{ padding: "22px 24px", borderColor: "var(--signal-dim)" }}>
            <h2 className="h-display" style={{ fontSize: 20, margin: "0 0 8px" }}>
              Olá, {user?.username || "usuário"} — aguardando liberação
            </h2>
            <p className="dim" style={{ margin: 0, lineHeight: 1.6, fontSize: 13.5 }}>
              Sua conta foi criada, mas ainda não tem nenhuma permissão. Peça a um administrador
              para liberar o acesso às áreas de que você precisa (produtos, movimentações,
              categorias, fornecedores...). Assim que ele conceder, basta recarregar a página.
            </p>
          </div>
        </div>
      )}

      <div style={{ padding: "24px 32px", display: "flex", gap: 16, flexWrap: "wrap" }}>
        {canProducts && <StatCard label="Produtos cadastrados" value={loading ? "—" : counts.products} />}
        {canProducts && (
          <StatCard
            label="Estoque abaixo do mínimo"
            value={loading ? "—" : lowStock.length}
            accent={lowStock.length > 0 ? "#e79683" : undefined}
            hint={lowStock.length > 0 ? "Requer atenção" : "Tudo dentro do previsto"}
          />
        )}
        {canCategories && <StatCard label="Categorias" value={loading ? "—" : counts.categories} />}
        {canSuppliers && <StatCard label="Fornecedores" value={loading ? "—" : counts.suppliers} />}
        {canProducts && (
          <StatCard
            label="Valor total em estoque"
            value={loading ? "—" : formatCurrency(totalValue)}
          />
        )}
      </div>

      <div
        style={{
          padding: "0 32px 32px",
          display: "grid",
          gridTemplateColumns: canProducts && canMovements ? "1.4fr 1fr" : "1fr",
          gap: 20,
        }}
      >
        {canProducts && (
        <div className="panel">
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 className="h-display" style={{ fontSize: 18, margin: 0 }}>
              Estoque crítico
            </h2>
            <Link to="/products" style={{ fontSize: 12.5, color: "var(--signal)" }}>
              Ver produtos →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="empty-state">Nenhum produto abaixo do estoque mínimo.</div>
          ) : (
            <div className="table-wrap">
              <table className="grid">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Mínimo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.slice(0, 8).map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td className="mono">{p.quantity}</td>
                      <td className="mono dim">{p.minimumQuantity}</td>
                      <td>
                        <span className={`badge ${p.quantity === 0 ? "badge-danger" : "badge-warn"}`}>
                          {p.quantity === 0 ? "Sem estoque" : "Baixo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        )}

        {canMovements && (
        <div className="panel">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
            <h2 className="h-display" style={{ fontSize: 18, margin: 0 }}>
              Movimentações recentes
            </h2>
          </div>
          {recentMovements.length === 0 ? (
            <div className="empty-state">Nenhuma movimentação registrada ainda.</div>
          ) : (
            <div style={{ padding: "6px 0" }}>
              {recentMovements.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 20px",
                    borderBottom: "1px solid var(--line-soft)",
                    fontSize: 13,
                  }}
                >
                  <span>
                    <MovementBadge type={m.movementType} /> {m.quantity} un.
                  </span>
                  <span className="dim mono" style={{ fontSize: 11.5 }}>
                    {formatDate(m.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

function MovementBadge({ type }) {
  const map = {
    INBOUND: { label: "Entrada", cls: "badge-ok" },
    OUTBOUND: { label: "Saída", cls: "badge-danger" },
    ADJUSTMENT: { label: "Ajuste", cls: "badge-neutral" },
  };
  const info = map[type] || { label: type, cls: "badge-neutral" };
  return <span className={`badge ${info.cls}`}>{info.label}</span>;
}

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

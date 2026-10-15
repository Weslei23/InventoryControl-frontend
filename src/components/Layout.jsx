import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../context/permissions";

const NAV_ITEMS = [
  { to: "/", label: "Painel", icon: IconGrid, end: true },
  { to: "/products", label: "Produtos", icon: IconBox, permission: "PRODUCT_READ" },
  { to: "/movements", label: "Movimentações", icon: IconArrows, permission: "MOVEMENT_READ" },
  { to: "/categories", label: "Categorias", icon: IconTag, permission: "CATEGORY_READ" },
  { to: "/suppliers", label: "Fornecedores", icon: IconTruck, permission: "SUPPLIER_READ" },
  { to: "/users", label: "Usuários", icon: IconUsers, permission: "USER_READ" },
  { to: "/api-docs", label: "Documentação", icon: IconDocs },
];

export default function Layout() {
  const { user, logout, can, role } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 232,
          flexShrink: 0,
          borderRight: "1px solid var(--line)",
          background: "var(--panel)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark />
            <div className="h-display" style={{ fontSize: 21, letterSpacing: "0.01em" }}>
              ESTOQUE<span style={{ color: "var(--signal)" }}>//</span>
            </div>
          </div>
          <div className="dim mono" style={{ fontSize: 10.5, marginTop: 4, letterSpacing: "0.05em" }}>
            PAINEL DE CONTROLE
          </div>
        </div>

        <nav style={{ padding: "14px 12px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {NAV_ITEMS.filter((item) => !item.permission || can(item.permission)).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "9px 12px",
                borderRadius: 4,
                fontSize: 13.5,
                fontWeight: 600,
                textDecoration: "none",
                color: isActive ? "var(--ink)" : "var(--paper)",
                background: isActive ? "var(--signal)" : "transparent",
              })}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 16, borderTop: "1px solid var(--line)" }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.username || "Usuário"}</div>
          <div className="dim" style={{ fontSize: 12, marginBottom: 6 }}>
            {user?.email}
          </div>
          <div style={{ marginBottom: 12 }}>
            <span className={`badge ${role === "USER" ? "badge-neutral" : "badge-warn"}`}>
              {ROLE_LABELS[role] || role}
            </span>
          </div>
          <button className="btn btn-ghost btn-sm btn-block" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}

function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="20" fill="#161A22" />
      <rect x="24" y="44" width="14" height="32" fill="#E8A33D" />
      <rect x="43" y="28" width="14" height="48" fill="#E8A33D" />
      <rect x="62" y="36" width="14" height="40" fill="#E8A33D" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 4.5 8 1l6.5 3.5L8 8 1.5 4.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M1.5 4.5v7L8 15l6.5-3.5v-7" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 8v7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconArrows() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 5h9.5M11.5 5 8.5 2M11.5 5l-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11H4.5M4.5 11l3 3M4.5 11l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8.5 1.5H14v5.5L7 14 1.5 8.5l7-7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="11" cy="5" r="1.1" fill="currentColor" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 3.5h8v7H1v-7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 6.5h3l2 2.5v1.5H9v-4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="4" cy="12" r="1.3" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="11.5" cy="12" r="1.3" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.5 13.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10.5 3a2.3 2.3 0 0 1 0 4.4M12 9.8c1.5.5 2.5 1.8 2.5 3.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconDocs() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3.5 1.5h6l3 3v10h-9v-13Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9.5 1.5v3h3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5.5 8.5h5M5.5 11h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

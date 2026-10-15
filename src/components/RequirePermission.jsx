import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageHeader from "./PageHeader";

// Route-level guard. `any` = list of permissions (at least one is enough).
export default function RequirePermission({ any = [], children }) {
  const { canAny } = useAuth();
  if (any.length === 0 || canAny(...any)) return children;
  return (
    <div>
      <PageHeader
        eyebrow="ACESSO RESTRITO"
        title="Sem permissão"
        subtitle="Sua conta não tem permissão para acessar esta área. Peça a um administrador para liberar o acesso."
      />
      <div style={{ padding: 32 }}>
        <div className="panel empty-state">
          Permissão necessária: <span className="mono">{any.join(" ou ")}</span>
          <div style={{ marginTop: 14 }}>
            <Link to="/" style={{ color: "var(--signal)" }}>
              Voltar ao painel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

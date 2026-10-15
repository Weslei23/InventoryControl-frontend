import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage } from "../api/client";
import AuthShell from "../components/AuthShell";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // Bad credentials come back as 401/403/500 depending on the Spring Security path; only a
      // validation error (400) or a missing connection carries a more useful message.
      const status = err?.response?.status;
      setError(
        !err?.response || status === 400
          ? extractErrorMessage(err, "Não foi possível entrar.")
          : "E-mail ou senha inválidos."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="ACESSO AO SISTEMA"
      title="Entrar no painel"
      subtitle="Controle de estoque, movimentações e fornecedores em um só lugar."
    >
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && (
          <div className="field-error" style={{ marginBottom: 14 }}>
            {error}
          </div>
        )}
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="dim" style={{ fontSize: 13, marginTop: 20, textAlign: "center" }}>
        Não tem conta? <Link to="/register" style={{ color: "var(--signal)" }}>Criar conta</Link>
      </p>
    </AuthShell>
  );
}

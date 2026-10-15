import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import AuthShell from "../components/AuthShell";

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      toast.success("Conta criada. Faça login — um administrador precisará liberar suas permissões.");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err?.response?.status === 409
          ? "Já existe uma conta com este e-mail."
          : extractErrorMessage(err, "Não foi possível criar a conta.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="NOVO CADASTRO"
      title="Criar conta"
      subtitle="Toda conta nova começa sem permissões: após o cadastro, um administrador define o que você pode acessar."
    >
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="username">Usuário</label>
          <input
            id="username"
            required
            autoFocus
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
            placeholder="seu.usuario"
          />
        </div>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="voce@empresa.com"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            required
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && (
          <div className="field-error" style={{ marginBottom: 14 }}>
            {error}
          </div>
        )}
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>
      <p className="dim" style={{ fontSize: 13, marginTop: 20, textAlign: "center" }}>
        Já tem conta? <Link to="/login" style={{ color: "var(--signal)" }}>Entrar</Link>
      </p>
    </AuthShell>
  );
}

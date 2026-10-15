import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { UsersAPI } from "../api/users";
import { extractErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import {
  PERMISSION_GROUPS,
  ROLES,
  ROLE_LABELS,
  SUPER_USER_ONLY_PERMISSIONS,
} from "../context/permissions";

const PAGE_SIZE = 20;

export default function Users() {
  const toast = useToast();
  const { user: me, can, isSuperUser, refreshProfile } = useAuth();
  const canManagePermissions = can("USER_MANAGE_PERMISSIONS");

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [allPermissions, setAllPermissions] = useState([]);

  const [permTarget, setPermTarget] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);

  async function load(targetPage = page) {
    setLoading(true);
    try {
      const data = await UsersAPI.list({ page: targetPage, size: PAGE_SIZE, sort: "username,asc" });
      setUsers(data?.content || []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
      setPage(data?.number ?? targetPage);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Não foi possível carregar os usuários."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0);
    UsersAPI.permissions()
      .then((list) => setAllPermissions(list || []))
      .catch(() => setAllPermissions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side mirror of the backend rules in UserService (the server stays the authority).
  function permissionBlockReason(target) {
    if (!canManagePermissions) return "Você não tem a permissão USER_MANAGE_PERMISSIONS.";
    if (target.id === me?.id) return "Você não pode alterar as próprias permissões.";
    if (target.role === ROLES.SUPER_USER) return "As permissões do Super Usuário não podem ser alteradas.";
    if (target.role !== ROLES.USER && !isSuperUser) return "Só o Super Usuário altera as permissões de um administrador.";
    return "";
  }

  function roleBlockReason(target) {
    if (!isSuperUser) return "Só o Super Usuário altera funções.";
    if (target.id === me?.id) return "Você não pode alterar a própria função.";
    if (target.role === ROLES.SUPER_USER) return "A função do Super Usuário não pode ser alterada.";
    return "";
  }

  async function afterChange(updated) {
    setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
    // If the logged-in user was affected (e.g. a manager changed something), keep the profile fresh.
    refreshProfile();
  }

  return (
    <div>
      <PageHeader
        eyebrow="ADMINISTRAÇÃO"
        title="Usuários"
        subtitle="Contas cadastradas, funções e permissões. Contas novas começam sem nenhuma permissão."
      />

      <div style={{ padding: 32 }}>
        <div className="panel">
          {loading ? (
            <div className="empty-state">Carregando usuários...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">Nenhum usuário encontrado.</div>
          ) : (
            <div className="table-wrap">
              <table className="grid">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>E-mail</th>
                    <th>Função</th>
                    <th>Permissões</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const permBlock = permissionBlockReason(u);
                    const roleBlock = roleBlockReason(u);
                    const effectiveCount = u.effectivePermissions?.length ?? 0;
                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>
                          {u.username}
                          {u.id === me?.id && <span className="dim"> (você)</span>}
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <RoleBadge role={u.role} />
                        </td>
                        <td>
                          {u.role === ROLES.USER ? (
                            <span className="mono">
                              {effectiveCount}{" "}
                              <span className="dim">de {allPermissions.length || "—"}</span>
                            </span>
                          ) : (
                            <span className="dim">Todas (pela função)</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            {canManagePermissions && (
                              <button
                                className="btn btn-ghost btn-sm"
                                disabled={!!permBlock}
                                title={permBlock || "Editar permissões"}
                                onClick={() => setPermTarget(u)}
                              >
                                Permissões
                              </button>
                            )}
                            {isSuperUser && (
                              <button
                                className="btn btn-ghost btn-sm"
                                disabled={!!roleBlock}
                                title={roleBlock || "Alterar função"}
                                onClick={() => setRoleTarget(u)}
                              >
                                Função
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
          <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onChange={load} />
        </div>
      </div>

      {permTarget && (
        <PermissionsModal
          target={permTarget}
          allPermissions={allPermissions}
          onClose={() => setPermTarget(null)}
          onSaved={(updated) => {
            toast.success("Permissões atualizadas.");
            setPermTarget(null);
            afterChange(updated);
          }}
        />
      )}

      {roleTarget && (
        <RoleModal
          target={roleTarget}
          onClose={() => setRoleTarget(null)}
          onSaved={(updated) => {
            toast.success("Função atualizada.");
            setRoleTarget(null);
            afterChange(updated);
          }}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }) {
  const cls = role === ROLES.SUPER_USER ? "badge-danger" : role === ROLES.ADMIN ? "badge-warn" : "badge-neutral";
  return <span className={`badge ${cls}`}>{ROLE_LABELS[role] || role}</span>;
}

function PermissionsModal({ target, allPermissions, onClose, onSaved }) {
  const { isSuperUser, can } = useAuth();
  const [selected, setSelected] = useState(() => new Set(target.permissions || []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const roleHasAll = target.role !== ROLES.USER;

  // Groups from the static layout, restricted to what the API reports; unknown ones go to "Outras".
  const groups = useMemo(() => {
    const known = new Set(PERMISSION_GROUPS.flatMap((g) => g.items.map(([p]) => p)));
    const available = allPermissions.length ? new Set(allPermissions) : known;
    const result = PERMISSION_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(([p]) => available.has(p)),
    })).filter((g) => g.items.length > 0);
    const extra = [...available].filter((p) => !known.has(p));
    if (extra.length) result.push({ key: "OTHER", label: "Outras", items: extra.map((p) => [p, p]) });
    return result;
  }, [allPermissions]);

  // Non-super users can only grant/revoke what they hold themselves, and never the delegation permission.
  function lockReason(permission) {
    if (isSuperUser) return "";
    if (SUPER_USER_ONLY_PERMISSIONS.includes(permission)) return "Somente o Super Usuário concede ou revoga esta permissão.";
    if (!can(permission)) return "Você não pode conceder ou revogar uma permissão que não possui.";
    return "";
  }

  function toggle(permission) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  }

  function toggleGroup(group, value) {
    setSelected((prev) => {
      const next = new Set(prev);
      group.items.forEach(([p]) => {
        if (lockReason(p)) return;
        if (value) next.add(p);
        else next.delete(p);
      });
      return next;
    });
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      // PUT replaces the entire set of individual permissions, so always send the full selection.
      const updated = await UsersAPI.updatePermissions(target.id, [...selected]);
      onSaved(updated);
    } catch (err) {
      setError(extractErrorMessage(err, "Não foi possível salvar as permissões."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Permissões — ${target.username}`}
      onClose={onClose}
      width={560}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar permissões"}
          </button>
        </>
      }
    >
      {roleHasAll && (
        <p className="dim" style={{ marginTop: 0, fontSize: 12.5 }}>
          Esta conta é <strong>{ROLE_LABELS[target.role]}</strong> e já possui todas as permissões pela função. As
          permissões abaixo só passam a valer se a função for rebaixada para Usuário.
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {groups.map((group) => {
          const unlocked = group.items.filter(([p]) => !lockReason(p));
          const allOn = unlocked.length > 0 && unlocked.every(([p]) => selected.has(p));
          return (
            <fieldset
              key={group.key}
              style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "10px 14px", margin: 0 }}
            >
              <legend style={{ padding: "0 6px", fontSize: 12.5, fontWeight: 600 }}>
                {group.label}
                {unlocked.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ marginLeft: 8, padding: "2px 8px", fontSize: 11 }}
                    onClick={() => toggleGroup(group, !allOn)}
                  >
                    {allOn ? "Limpar" : "Marcar todas"}
                  </button>
                )}
              </legend>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                {group.items.map(([permission, label]) => {
                  const lock = lockReason(permission);
                  return (
                    <label
                      key={permission}
                      title={lock || permission}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        opacity: lock ? 0.55 : 1,
                        cursor: lock ? "not-allowed" : "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(permission)}
                        disabled={!!lock || saving}
                        onChange={() => toggle(permission)}
                        style={{ width: "auto" }}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
      {!isSuperUser && (
        <p className="dim" style={{ fontSize: 12, marginBottom: 0 }}>
          Opções acinzentadas são permissões que você não possui (ou que só o Super Usuário pode delegar).
        </p>
      )}
      {error && (
        <div className="field-error" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}
    </Modal>
  );
}

function RoleModal({ target, onClose, onSaved }) {
  const [role, setRole] = useState(target.role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.USER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      const updated = await UsersAPI.updateRole(target.id, role);
      onSaved(updated);
    } catch (err) {
      setError(extractErrorMessage(err, "Não foi possível alterar a função."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Função — ${target.username}`}
      onClose={onClose}
      width={440}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || role === target.role}>
            {saving ? "Salvando..." : "Salvar função"}
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="role-select">Função</label>
        <select id="role-select" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value={ROLES.USER}>{ROLE_LABELS.USER} — somente as permissões concedidas</option>
          <option value={ROLES.ADMIN}>{ROLE_LABELS.ADMIN} — todas as permissões</option>
        </select>
        <span className="field-hint">
          A função Super Usuário não pode ser atribuída. A mudança vale imediatamente, sem novo login.
        </span>
      </div>
      {error && <div className="field-error">{error}</div>}
    </Modal>
  );
}

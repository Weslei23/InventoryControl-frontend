// Mirrors the backend enums Permission / Role (domain/user/model/enums).
export const ROLES = {
  SUPER_USER: "SUPER_USER",
  ADMIN: "ADMIN",
  USER: "USER",
};

export const ROLE_LABELS = {
  SUPER_USER: "Super Usuário",
  ADMIN: "Administrador",
  USER: "Usuário",
};

// Grouped for display in the permission editor. The authoritative list comes from
// GET /users/permissions; anything not listed here falls into an "Outras" group.
export const PERMISSION_GROUPS = [
  {
    key: "CATEGORY",
    label: "Categorias",
    items: [
      ["CATEGORY_READ", "Visualizar"],
      ["CATEGORY_CREATE", "Criar"],
      ["CATEGORY_UPDATE", "Editar"],
      ["CATEGORY_DELETE", "Excluir"],
    ],
  },
  {
    key: "SUPPLIER",
    label: "Fornecedores",
    items: [
      ["SUPPLIER_READ", "Visualizar"],
      ["SUPPLIER_CREATE", "Criar"],
      ["SUPPLIER_UPDATE", "Editar"],
      ["SUPPLIER_DELETE", "Excluir"],
    ],
  },
  {
    key: "PRODUCT",
    label: "Produtos",
    items: [
      ["PRODUCT_READ", "Visualizar"],
      ["PRODUCT_CREATE", "Criar"],
      ["PRODUCT_UPDATE", "Editar"],
      ["PRODUCT_DELETE", "Excluir"],
      ["PRODUCT_EXPORT", "Exportar planilha"],
    ],
  },
  {
    key: "MOVEMENT",
    label: "Movimentações",
    items: [
      ["MOVEMENT_READ", "Visualizar"],
      ["MOVEMENT_CREATE", "Registrar (entrada/saída/ajuste)"],
      ["MOVEMENT_UPDATE", "Editar"],
      ["MOVEMENT_DELETE", "Excluir"],
    ],
  },
  {
    key: "USER",
    label: "Usuários",
    items: [
      ["USER_READ", "Visualizar usuários"],
      ["USER_MANAGE_PERMISSIONS", "Gerenciar permissões (delegação)"],
    ],
  },
];

// Permission that only the super user may grant/revoke (backend: Permission.isSuperUserOnly()).
export const SUPER_USER_ONLY_PERMISSIONS = ["USER_MANAGE_PERMISSIONS"];

# Inventory Control — Frontend

Frontend em React + Vite (JavaScript puro) para a API Spring Boot **InventoryControl** (SimpleStock),
alinhado ao backend com **roles e permissões** (`SUPER_USER`, `ADMIN`, `USER`).

## Como rodar

```bash
npm install
cp .env.example .env   # ajuste VITE_API_URL se a API não estiver em localhost:8080
npm run dev            # http://localhost:5173
```

Backend: suba com `SUPERUSER_PASSWORD` definida para criar o Super Usuário
(e-mail padrão `superuser@simplestock.local`). O CORS da API libera `http://localhost:5173`.

## Controle de acesso no frontend

- Após o login (e ao recarregar a página) o app chama `GET /api/v1/users/me` e guarda a **role** e as
  **permissões efetivas**. O `AuthContext` expõe `can(perm)`, `canAny(...)`, `isAdmin`, `isSuperUser`.
- **Menu**: cada item só aparece com a permissão `*_READ` correspondente; "Usuários" exige `USER_READ`.
- **Rotas**: `RequirePermission` mostra "Sem permissão" ao abrir uma URL sem acesso.
- **Botões**: criar/editar/excluir, entrada/saída e exportar planilha só aparecem com a permissão do endpoint
  (`*_CREATE`, `*_UPDATE`, `*_DELETE`, `MOVEMENT_CREATE`, `PRODUCT_EXPORT`).
- **Painel**: cada indicador/lista só é carregado se o usuário puder ler o recurso; conta sem permissões vê
  um aviso "aguardando liberação" (toda conta nova é `USER` sem permissões).
- **Sessão (403)**: a API nunca devolve 401 — token ausente/expirado e falta de permissão são ambos `403`.
  Ao receber um 403, o app rele `/users/me`: se falhar, encerra a sessão; se funcionar, apenas atualiza as
  permissões (mudanças valem na hora, sem novo login).

## Tela de Usuários (`/users`)

- Lista paginada (`GET /users`, exige `USER_READ`) com função e quantidade de permissões.
- **Permissões** (`PUT /users/{id}/permissions`, exige `USER_MANAGE_PERMISSIONS`): editor por grupos, lista vinda
  de `GET /users/permissions`. A API substitui o conjunto inteiro, então o app sempre envia a seleção completa.
- **Função** (`PUT /users/{id}/role`, só Super Usuário): alterna `ADMIN`/`USER`.
- As regras do backend são espelhadas na UI (o servidor continua sendo a autoridade): ninguém altera a si
  mesmo; o Super Usuário é imutável; só o Super Usuário altera admins e concede/revoga
  `USER_MANAGE_PERMISSIONS`; os demais só concedem/revogam permissões que possuem.

## Endpoints usados

| Recurso | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register` |
| Usuários | `GET /users/me`, `GET /users/permissions`, `GET /users`, `PUT /users/{id}/permissions`, `PUT /users/{id}/role` |
| Produtos | `GET /product`, `POST /product/add` (multipart), `PUT /product/update/{id}` (**JSON**), `DELETE /product/delete/{id}`, `GET /product/download` |
| Categorias | `GET /categories`, `POST /categories/add`, `PUT /categories/update/{id}`, `DELETE /categories/delete/{id}` |
| Fornecedores | `GET /supplier`, `POST /supplier/add`, `PUT /supplier/update/{id}`, `DELETE /supplier/delete/{id}` |
| Movimentações | `GET /movement`, `POST /movement/inbound`, `/outbound`, `/add`, `PUT /movement/update/{id}`, `DELETE /movement/delete/{id}` |

## O que mudou nesta versão

- Roles/permissões (acima) e nova tela de Usuários.
- **Edição de produto** agora envia JSON (antes enviava multipart e o backend não aceita). O nome da imagem
  atual é reenviado em `image` para não ser apagado; trocar a imagem só é possível no cadastro.
- **Edição de movimentação** adicionada (`MOVEMENT_UPDATE`).
- Mensagens de erro tratadas por status (403, 404, 409, 500 sem corpo, falha de rede).
- Validação local de estoque insuficiente em saídas (a API devolve 500 sem mensagem nesse caso).
- Removida a coluna "Produtos vinculados" de Categorias (a API nunca a preenche).

## Limitações da API (backend) que afetam o frontend

- **Imagens de produto**: a API grava o arquivo em `./shared/files/products`, mas não há rota estática nem
  liberação no `SecurityConfig` para servi-lo; as miniaturas ficam ocultas até isso existir
  (o front já aponta para `/images/products/<arquivo>`). Além disso o arquivo é salvo com o nome original (sem UUID).
- `PUT /product/update/{id}` **não atualiza `state`** (Ativo/Inativo); ele só é gravado no cadastro.
- `PUT /movement/update/{id}` não recalcula o estoque; movimentação do tipo `ADJUSTMENT` também não altera a quantidade.
- `MovementResponseDTO` não traz o produto, então a lista não mostra o produto de cada movimentação.
- `IllegalArgumentException` (estoque insuficiente, nome duplicado) vira 500 sem mensagem.
- Edição de fornecedor sem mudar o nome pode ser recusada ("já existe").
- Filtro por tipo de movimentação e busca de produtos atuam só na página carregada.

## Build

```bash
npm run build && npm run preview
```

## Imagens dos produtos

- A tabela de produtos mostra a miniatura (48px) de cada produto; clicar nela abre a imagem ampliada.
  O formulário de edição também mostra a imagem atual.
- A API serve as imagens em `GET /api/v1/product/image/{arquivo}` e **exige o token** (permissão
  `PRODUCT_READ`). Como uma tag `<img>` não envia o header `Authorization`, o app baixa a imagem com o axios
  (`fetchProductImageUrl` em `src/api/products.js`), converte em *object URL* e guarda em cache por nome de
  arquivo durante a sessão. O componente é `src/components/ProductImage.jsx`.
- Produto sem imagem (ou imagem que não carregou) mostra um traço no lugar da miniatura.
- A imagem só pode ser enviada no cadastro; a API de edição (`PUT`) não aceita arquivo.

## Categorias

A tabela de categorias mostra quantos produtos estão vinculados a cada uma (`productCount`, devolvido pela API).
O diálogo de exclusão avisa quando a categoria ainda tem produtos.

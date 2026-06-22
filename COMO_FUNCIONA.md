# Financeiro Fácil — Guia do Sistema

## Visão Geral

**Financeiro Fácil** é um sistema SaaS de controle financeiro pessoal/empresarial. Permite gerenciar transações, contas a pagar/receber, produtos, categorias e gerar relatórios. Suporte a múltiplos usuários com planos de assinatura e papel de administrador.

**Stack:** Next.js 14 (App Router) | React 18 | Prisma + SQLite | Tailwind CSS | JWT (jose)

---

## 1. Autenticação e Sessão

- Login/registro geram um **JWT** armazenado em cookie httpOnly (`session`) com validade de 30 dias.
- O `AuthProvider` (contexto React) verifica a sessão automaticamente ao carregar a página.
- Usuários não autenticados são redirecionados para `/login`.
- O registro cria automaticamente **7 categorias padrão** e uma assinatura **trial de 3 dias**.

### API de autenticação

| Método | Rota                 | Descrição                  |
| ------ | -------------------- | -------------------------- |
| POST   | `/api/auth/register` | Cadastro de novo usuário   |
| POST   | `/api/auth/login`    | Login                      |
| GET    | `/api/auth/me`       | Retorna usuário logado     |
| POST   | `/api/auth/logout`   | Remove cookie de sessão    |

---

## 2. Assinaturas

- Planos fixos (não estão no BD): **Mensal** (R$29,90/30d), **Trimestral** (R$79,90/90d), **Anual** (R$249,90/365d).
- A assinatura é verificada em todas as requisições da API. Usuários com plano expirado recebem **403**.
- O administrador **nunca** tem sua assinatura verificada.
- A compra (`/api/subscriptions/purchase`) apenas estende a data de expiração — **não há integração com pagamento real**.

### API de assinaturas

| Método | Rota                           | Descrição                      |
| ------ | ------------------------------ | ------------------------------ |
| GET    | `/api/subscriptions/plans`     | Lista planos disponíveis       |
| GET    | `/api/subscriptions/status`    | Status da assinatura do usuário|
| POST   | `/api/subscriptions/purchase`  | "Compra" / renova plano        |

---

## 3. Estrutura de Dados (Prisma — SQLite)

### User
| Campo             | Tipo     | Descrição                          |
| ----------------- | -------- | ---------------------------------- |
| id                | cuid     | Chave primária                     |
| name, email       | String   | Nome e email (único)               |
| password          | String   | Hash bcrypt                        |
| role              | String   | `"user"` ou `"admin"`              |
| status            | String   | `"active"` ou `"paused"`           |
| subscriptionPlan  | String   | `"trial"`, `"mensal"`, etc.        |
| subscriptionEnd   | DateTime?| Data de expiração (null = vitalício)|
| deletedAt         | DateTime?| Soft delete                        |

### Transaction
Transações financeiras (entrada/saída). Possui `type` (`"entrada"`/`"saida"`), `status` (`"pago"`/`"pendente"`), `amount`, `category` (nome desnormalizado), `date`.

### Payable
Contas a pagar. `status`: `"pago"`, `"pendente"`, `"vencido"` (calculado automaticamente).

### Receivable
Contas a receber. `status`: `"recebido"`, `"pendente"`, `"vencido"` (calculado automaticamente). Possui campo `client`.

### Product
Produtos com `purchasePrice` (preço de custo) e `salePrice` (preço de venda). Lucro e margem são calculados automaticamente.

### Category
Categorias com `name` e `color` (hex). Únicas por usuário.

> **Todos os modelos** (exceto User) usam **soft delete** (`deletedAt`). As consultas sempre filtram `deletedAt: null`.

---

## 4. Páginas (Rotas)

| Rota             | Descrição                                                     |
| ---------------- | ------------------------------------------------------------- |
| `/dashboard`     | Resumo financeiro do mês: saldo, entradas, saídas, lucro, pendências, vencidos + últimas 5 transações |
| `/transactions`  | CRUD de transações com filtros (tipo, status, data) e paginação de 20 itens |
| `/categories`    | CRUD de categorias com seletor de cor                         |
| `/payables`      | CRUD de contas a pagar com detecção automática de vencidos    |
| `/receivables`   | CRUD de contas a receber com detecção automática de vencidos  |
| `/products`      | CRUD de produtos com cálculo de lucro, margem e markup        |
| `/reports`       | Gráficos: barras dos últimos 6 meses + gastos por categoria   |
| `/subscriptions` | Gerenciar plano de assinatura                                 |
| `/settings`      | Editar perfil, alterar senha, alternar tema (claro/escuro)    |
| `/admin`         | Painel administrativo: gerenciar todos os usuários (admin apenas) |

---

## 5. API — Rotas CRUD

Cada entidade segue o padrão REST com escopo por usuário:

| Entidade        | GET (lista)         | POST (criar)      | GET/:id | PUT/:id           | DELETE/:id        |
| --------------- | ------------------- | ----------------- | ------- | ----------------- | ----------------- |
| `/transactions` | Filtros + paginação | Criar transação   | ✔       | Atualizar         | Soft delete       |
| `/categories`   | Lista ordenada      | Criar categoria   | ✔       | Atualizar         | Soft delete       |
| `/payables`     | Filtros + paginação | Criar conta       | ✔       | Atualizar         | Soft delete       |
| `/receivables`  | Filtros + paginação | Criar conta       | ✔       | Atualizar         | Soft delete       |
| `/products`     | Busca por nome      | Criar produto     | —       | Atualizar         | Soft delete       |

### Endpoints especiais

| Rota                | Método | Descrição                                      |
| ------------------- | ------ | ---------------------------------------------- |
| `/api/dashboard`    | GET    | Cards financeiros + transações recentes do mês |
| `/api/reports`      | GET    | Totais, gastos por categoria, últimos 6 meses  |
| `/api/settings`     | POST   | Atualizar nome e/ou senha                      |
| `/api/admin/users`  | GET    | Listar todos os usuários (admin)               |
| `/api/admin/users`  | POST   | Criar usuário (admin)                          |
| `/api/admin/users/:id` | PUT | Editar qualquer usuário (admin)                |
| `/api/admin/users/:id` | DELETE | Excluir usuário permanentemente (admin)     |

---

## 6. Fluxo de Dados

1. O **cliente React** faz `fetch()` com `credentials: 'include'` para as rotas da API.
2. Cada rota da API chama `requireUser()` ou `requireActiveUser()` para validar o JWT e buscar o usuário no banco.
3. As consultas sempre filtram por `userId` — cada usuário vê apenas seus próprios dados (multi-tenancy).
4. Números em reais (R$) são enviados no formato brasileiro (ex: `"1.234,56"`) e convertidos pela função `toNumber()` na API.
5. Datas são armazenadas como `DateTime` e serializadas como ISO string nas respostas.

---

## 7. Estilos e Tema

- **Tailwind CSS** com **modo escuro** via classe no `<html>` (estratégia `class`).
- O tema é salvo no `localStorage` (chave `theme`) e alternado pelo `AppShell` ou página `Settings`.
- Padrão: **tema claro**.

---

## 8. Administração

- O admin é definido por email na variável de ambiente `ADMIN_EMAIL`.
- O primeiro usuário a se cadastrar com esse email vira admin automaticamente.
- O seed script (`prisma/seed.js`) também pode promover um usuário existente a admin.
- O painel `/admin` permite: criar/editar/excluir usuários, alterar planos, status, papel, e renovar assinaturas.
- Um admin **não pode excluir a si mesmo**.

---

## 9. Comandos

| Comando              | Descrição                      |
| -------------------- | ------------------------------ |
| `npm run dev`        | Servidor de desenvolvimento    |
| `npm run build`      | Build de produção              |
| `npm start`          | Iniciar servidor de produção   |
| `npm run db:push`    | Sincronizar schema com o banco |
| `npm run db:studio`  | Abrir Prisma Studio (GUI BD)   |
| `npm run db:seed`    | Promover admin por email       |

---

## 10. Variáveis de Ambiente

| Variável          | Descrição                         | Padrão               |
| ----------------- | --------------------------------- | -------------------- |
| `DATABASE_URL`    | Caminho do banco SQLite           | `file:./dev.db`      |
| `AUTH_SECRET`     | Chave secreta para JWT            | (obrigatório alterar)|
| `ADMIN_EMAIL`     | Email do usuário administrador    | —                    |

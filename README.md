# Financeiro Fácil 💰

Sistema SaaS de controle financeiro pessoal/empresarial.

**Acesse:** [https://financeiro-facil.onrender.com](https://financeiro-facil.onrender.com)

---

## 🚀 Tecnologias

- **Next.js 14** (App Router)
- **React 18**
- **Prisma + SQLite**
- **Tailwind CSS**
- **JWT (jose)** para autenticação
- **Recharts** para gráficos

---

## 📋 Funcionalidades

- ✅ Dashboard com resumo financeiro
- ✅ Lançamentos (entradas e saídas)
- ✅ Produtos com cálculo de lucro
- ✅ Relatórios com gráficos
- ✅ Categorias personalizadas
- ✅ Planos de assinatura (Trial, Mensal, Trimestral, Anual, Vitalício)
- ✅ Modo escuro
- ✅ Painel administrativo (gerenciar usuários e assinaturas)
- ✅ Log de auditoria

---

## 🐙 Git - Como usar

O projeto está versionado no GitHub. Aqui está o básico:

### Comandos principais

```bash
# Ver o que foi alterado
git status

# Preparar tudo para commit
git add .

# Criar um commit (salvar no histórico)
git commit -m "Descrição do que mudou"

# Enviar para o GitHub
git push origin master
```

### Fluxo do dia a dia

```bash
git add .
git commit -m "Descrição clara da alteração"
git push origin master
```

> **Importante:** Quando você faz `git push`, o **Render** detecta automaticamente e faz um novo deploy! Não precisa fazer nada manual.

---

## ☁️ Deploy - Render

O sistema está hospedado gratuitamente no [Render](https://render.com).

### Variáveis de ambiente necessárias

| Variável | Descrição |
|---|---|
| `AUTH_SECRET` | Chave secreta para JWT (gerar com: `openssl rand -base64 32`) |
| `ADMIN_EMAIL` | Email do administrador (primeiro cadastro com este email vira admin) |
| `DATABASE_URL` | `file:./dev.db` (SQLite local) |

### Comandos de build (configurados no Render)

- **Build:** `npm install && npx prisma generate && npm run build`
- **Start:** `npx prisma db push && npm start`

---

## 💻 Desenvolvimento local

```bash
# Instalar dependências
npm install

# Criar banco SQLite
npx prisma db push

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 📄 Licença

Projeto privado.

# BarberPro Studio v2.0 — Go Backend + Next.js + Tailwind CSS v4 + shadcn/ui

Sistema completo de gerenciamento de barbearia reescrito com **Backend 100% em Go** e **Frontend moderno em Next.js 14, Tailwind CSS v4 e componentes shadcn/ui**.

## 🚀 Nova Arquitetura (v2.0)

- **Backend (100% Go)**:
  - Construído com **Go 1.24+** (`net/http` padrão moderno com roteamento nativo por método e path parameters).
  - Autenticação própria via **JWT (HMAC-SHA256)** + Cookie `HttpOnly` (`barbearia_session`) e header `Authorization: Bearer`.
  - Hash seguro de senhas com `crypto/sha256` + salt aleatório e derivação iterativa.
  - Persistência concorrente (`sync.RWMutex`) com seed automático de administrador, clientes e agendamentos.
  - Suíte de testes automatizados (`go test ./...`).
- **Frontend**:
  - **Next.js 14** (App Router) atuando exclusivamente como camada de interface, fazendo proxy de `/api/*` diretamente para o servidor Go.
  - **Tailwind CSS v4** (`@import "tailwindcss"` e `@theme` via `@tailwindcss/postcss`).
  - **shadcn/ui Design System**: Tema escuro premium (*Obsidian & Amber Gold*) com componentes reutilizáveis (`Card`, `Badge`, `Button`, `Input`, `Tabs`, `Modal`).

---

## 🛠️ Como Executar

### 1. Iniciar o Backend em Go (Porta 8080)

```bash
cd backend
go run ./cmd/server
```

Para rodar os testes do backend em Go:
```bash
cd backend
go test ./... -v
```

### 2. Iniciar o Frontend Next.js (Porta 3000)

Em outro terminal, na raiz do projeto:

```bash
npm install
npm run dev
```

Acesse **[http://localhost:3000](http://localhost:3000)**.

---

## 🔐 Credenciais de Demonstração

- **E-mail**: `admin@barbearia.com`
- **Senha**: `admin123`

*(Na tela de login há um botão de preenchimento rápido com 1 clique).*

---

## 📡 Endpoints da API em Go (`backend/cmd/server/main.go`)

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Status e healthcheck do servidor Go |
| `GET` | `/api/test-db` | Diagnóstico da engine de dados e seed |
| `GET` | `/api/services` | Catálogo de serviços, preços e durações |
| `POST` | `/api/auth/login` | Autenticação com geração de JWT e Cookie |
| `POST` | `/api/auth/logout` | Encerramento de sessão |
| `GET` | `/api/auth/session` | Validação da sessão atual |
| `GET` | `/api/clients` | Listagem paginada e busca de clientes |
| `POST` | `/api/clients` | Cadastro de cliente com validação |
| `GET` | `/api/clients/{id}` | Detalhes e histórico do cliente |
| `PUT` | `/api/clients/{id}` | Atualização cadastral do cliente |
| `DELETE` | `/api/clients/{id}` | Exclusão segura (bloqueia se houver horário pendente) |
| `GET` | `/api/appointments` | Listagem e filtros de agendamentos |
| `POST` | `/api/appointments` | Criação de agendamento com detecção de conflito |
| `GET` | `/api/appointments/{id}` | Detalhes do agendamento |
| `PUT` | `/api/appointments/{id}` | Atualização completa do agendamento |
| `PATCH` | `/api/appointments/{id}/status` | Mudança rápida de status (`PENDING`, `COMPLETED`, `CANCELLED`) |
| `DELETE` | `/api/appointments/{id}` | Exclusão de agendamento |
| `GET` | `/api/dashboard/stats` | Estatísticas executivas, receita e serviços em alta |

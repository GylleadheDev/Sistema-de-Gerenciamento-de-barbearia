# Sistema de Gerenciamento de Barbearia

Sistema web completo para gerenciamento de agendamentos de barbearia com painel administrativo.

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 14 com TypeScript
- **Estilização**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Autenticação**: NextAuth.js
- **Notificações**: React Hot Toast

## 📋 Funcionalidades

### Autenticação
- Login seguro para administradores
- Proteção de rotas
- Gerenciamento de sessão

### Dashboard
- Visão geral dos agendamentos
- Estatísticas em tempo real
- Navegação intuitiva

### Gerenciamento de Clientes
- CRUD completo de clientes
- Validação de dados
- Busca e filtros
- Máscara de telefone

### Gerenciamento de Agendamentos
- Visualização por status (Pendentes, Concluídos, Cancelados)
- Atualização de status
- Informações detalhadas do cliente
- Interface responsiva

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+ (ou Bun)
- Um banco PostgreSQL (Supabase, Neon, local via Docker...)
- npm, yarn ou bun

### Passos

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd sistema-barbearia
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Copie o `.env.example` (versionado no repositório) para `.env`:
```bash
cp .env.example .env
```

> ⚠️ Use **`.env`** e não `.env.local`. O Prisma CLI (migrações, seed, studio) só lê `.env`,
> enquanto o Next.js lê os dois. Se o `DATABASE_URL` ficar só no `.env.local`, o `prisma migrate`
> falha com `Environment variable not found: DATABASE_URL`.

```env
# Database (PostgreSQL / Supabase)
# A porta 6543 é usada pela aplicação; a 5432 pelas migrações (directUrl).
DATABASE_URL="postgresql://postgres:SENHA@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres:SENHA@aws-0-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Admin credentials
ADMIN_EMAIL="admin@barbearia.com"
ADMIN_PASSWORD="admin123"
```

4. **Configure o banco de dados**
```bash
# Gerar o cliente Prisma
npm run db:generate

# Criar e aplicar a migração inicial (gera prisma/migrations/)
npm run db:migrate

# Popular o banco com dados iniciais
npm run db:seed
```

5. **Execute o projeto**
```bash
npm run dev
```

6. **Acesse a aplicação**
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🔐 Credenciais Padrão

- **Email**: admin@barbearia.com
- **Senha**: admin123

⚠️ **Importante**: Altere essas credenciais em produção!

## 📁 Estrutura do Projeto

```
sistema-barbearia/
├── app/                    # App Router do Next.js
│   ├── api/               # API Routes
│   ├── dashboard/         # Páginas do dashboard
│   ├── login/            # Página de login
│   └── globals.css       # Estilos globais
├── components/           # Componentes React
│   ├── layout/          # Componentes de layout
│   └── ui/              # Componentes de UI
├── lib/                 # Utilitários e configurações
├── prisma/              # Schema e migrações do Prisma
├── types/               # Definições de tipos TypeScript
└── middleware.ts        # Middleware de autenticação
```

## 🎨 Design System

O sistema utiliza Tailwind CSS com um design system personalizado:
- Cores primárias em tons de azul
- Componentes reutilizáveis
- Interface responsiva
- Feedback visual com toasts

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Executa em modo desenvolvimento
npm run build        # Gera build de produção
npm run start        # Executa build de produção
npm run lint         # Executa o linter
npm run db:generate  # Gera cliente Prisma
npm run db:migrate   # Cria e aplica migrações (desenvolvimento)
npm run db:deploy    # Aplica migrações pendentes (produção/CI)
npm run db:push      # Sincroniza o schema sem gerar migração (descartável)
npm run db:seed      # Popula banco com dados iniciais
npm run db:studio    # Abre a GUI do banco
```

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop
- Tablet
- Mobile

## 🔒 Segurança

- Autenticação com NextAuth.js
- Validação de dados no frontend e backend
- Proteção de rotas com middleware
- Senhas criptografadas com bcrypt

## 🚀 Deploy

Para fazer deploy em produção:

1. Configure as variáveis de ambiente (`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`)
2. Configure o banco PostgreSQL (Supabase) e migre o schema: `npm run db:deploy`
3. Execute `npm run build`
4. Deploy em plataformas como Vercel

> Na Vercel, `prisma migrate deploy` precisa da `DIRECT_URL` configurada nas variáveis da
> plataforma — sem ela o deploy trava silenciosamente, do mesmo jeito que o `prisma migrate dev`.

## 📞 Suporte

Para dúvidas ou problemas, entre em contato através dos issues do repositório.

## 📄 Licença

Este projeto está sob a licença MIT.

# Configuração do Sistema de Barbearia

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (use `cp .env.example .env` como ponto de partida)
com as seguintes variáveis:

> O Prisma CLI (migrações, seed, studio) lê **apenas** `.env`. O Next.js também lê
> `.env.local`, mas colocar `DATABASE_URL` só lá faz o `prisma migrate` falhar.

```env
# Database (PostgreSQL / Supabase)
DATABASE_URL="postgresql://postgres:SENHA@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres:SENHA@aws-0-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Admin credentials (change these in production)
ADMIN_EMAIL="admin@barbearia.com"
ADMIN_PASSWORD="admin123"
```

## Configuração do PostgreSQL (Supabase)

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Em **Project Settings → Database**, copie as duas connection strings
3. Substitua no `.env`:
   - `DATABASE_URL` → **Connection string (Session/Transaction pooler, porta 6543)** — usada pela aplicação
   - `DIRECT_URL` → **Direct connection (porta 5432)** — usada pelas migrações
4. Escolha uma região próxima (o `vercel.json` usa `iad1`, nos EUA)

> ⚠️ O nome do banco no Supabase é sempre `postgres`, não o nome do projeto.
>
> ⚠️ **Sem `DIRECT_URL` declarada no `schema.prisma`, o `prisma migrate` trava sem nenhuma
> mensagem** — o pooler em modo Transaction atende o runtime, mas trava o schema engine.
> Veja [`MIGRACAO_POSTGRES.md`](./MIGRACAO_POSTGRES.md#4-as-duas-urls-do-supabase--e-o-problema-que-elas-resolvem).

> Este projeto **não usa nenhum pacote da Supabase** (`@supabase/ssr`, `supabase-js`...).
> A integração é só a connection string, consumida pelo Prisma.

## Comandos de Instalação

```bash
# Instalar dependências
npm install

# Gerar cliente Prisma
npm run db:generate

# Criar e aplicar a migração inicial
npm run db:migrate

# Popular banco com dados iniciais
npm run db:seed

# Executar em desenvolvimento
npm run dev
```

## Acesso ao Sistema

Após a configuração, acesse:
- URL: http://localhost:3000
- Email: admin@barbearia.com
- Senha: admin123

## Próximos Passos

1. Configure suas credenciais de administrador
2. Adicione seus clientes
3. Crie agendamentos
4. Personalize conforme necessário

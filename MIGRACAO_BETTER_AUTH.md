# Migração de NextAuth para Better Auth

> **Estado atual:** migração **concluída e verificada** neste projeto.
> Better Auth **1.7.6** · `@better-auth/cli` 1.4.21 · PostgreSQL via Prisma.
>
> Fase 2 do plano de modernização (a fase 1 foi a migração MongoDB → PostgreSQL,
> documentada em [`MIGRACAO_POSTGRES.md`](./MIGRACAO_POSTGRES.md)).

---

## Sumário

| | NextAuth (antes) | Better Auth (depois) |
|---|---|---|
| Senha | `users.password` (bcrypt) | `accounts.password` (scrypt), `providerId: "credential"` |
| `emailVerified` | `DateTime?` | `Boolean` |
| Sessão | JWT no cookie, sem tabela | Linha em `sessions` |
| `VerificationToken` | tabela própria | tabela `verifications` |
| Rota | `/api/auth/[...nextauth]` | `/api/auth/[...all]` |
| Session server-side | `getServerSession(authOptions)` | `auth.api.getSession({ headers })` |
| Session client-side | `signIn/signOut/useSession` de `next-auth/react` | `authClient` de `better-auth/react` |
| Middleware | `getToken()` (valida JWT) | `getSessionCookie()` (só presença) |

---

## 1. Pegada da mudança

| Arquivo | Mudança |
|---|---|
| `lib/auth.ts` | reescrito: `authOptions` → instância `betterAuth(...)` |
| `lib/auth-client.ts` | **novo** — `createAuthClient()` para o browser |
| `app/api/auth/[...all]/route.ts` | **novo** — `toNextJsHandler(auth)` |
| `app/api/auth/[...nextauth]/route.ts` | **removido** |
| `types/next-auth.d.ts` | **removido** |
| 6 rotas de API (12 call sites) | `getServerSession(authOptions)` → `auth.api.getSession({ headers })` |
| `middleware.ts` | `getToken` de `next-auth/jwt` → `getSessionCookie` de `better-auth/cookies` |
| `app/providers.tsx` | `SessionProvider` → `QueryClientProvider` |
| `app/login/page.tsx` | `signIn('credentials', ...)` → `authClient.signIn.email(...)` |
| `components/layout/sidebar.tsx` | `signOut()` → `authClient.signOut()` |
| `prisma/schema.prisma` | models do NextAuth → models do Better Auth |
| `prisma/seed.ts` | bcrypt → `hashPassword` do Better Auth + criação do `Account` |
| `package.json` | `+better-auth`, `+@tanstack/react-query`, `+@better-auth/cli` · `−next-auth`, `−@next-auth/prisma-adapter`, `−bcryptjs`, `−@types/bcryptjs` |

---

## 2. Mudança de schema

### 2.1 Gere, mas revise

```bash
bunx better-auth generate --config lib/auth.ts -y
```

> ⚠️ **O CLI *mescla*, não substitui.** Ele detecta os models existentes e injeta as
> colunas do Better Auth **mantendo as do NextAuth**. Resultado: um `Account` com
> `provider`/`providerAccountId`/`refresh_token` (NextAuth) **e**
> `providerId`/`accountId`/`refreshToken` (Better Auth) lado a lado, e um `User`
> com `emailVerified DateTime?` intocado.
>
> Trate a saída como **rascunho** e escreva o schema limpo na mão.

### 2.2 Tabela de tradução

| NextAuth | Better Auth |
|---|---|
| `User.password String?` | **removido** → `Account.password` (`providerId = "credential"`) |
| `User.emailVerified DateTime?` | `User.emailVerified Boolean @default(false)` |
| `Account.refresh_token/access_token/expires_at/token_type/scope/id_token/session_state` | `refreshToken/accessToken/accessTokenExpiresAt/scope/idToken` |
| `Account @@unique([provider, providerAccountId])` | `Account @@unique([providerId, accountId])` |
| `Session.sessionToken @unique` / `Session.expires` | `Session.token @unique` / `Session.expiresAt` |
| `Session` sem IP/UA | `Session.ipAddress?`, `Session.userAgent?` |
| `VerificationToken { identifier, token, expires }` | `Verification { identifier, value, expiresAt }` |

Schema final: [`prisma/schema.prisma`](./prisma/schema.prisma).

### 2.3 O campo `role`

O projeto já tinha `role UserRole @default(ADMIN)`. Ele é declarado como campo extra
em `lib/auth.ts`:

```ts
user: {
  additionalFields: {
    role: { type: 'string', defaultValue: 'ADMIN', required: false, returned: true },
  },
},
```

`returned: true` faz `session.user.role` voltar na sessão.

> **Aviso:** nada no código consome `role` hoje — as rotas API só checam `if (!session)`.
> Qualquer usuário autenticado passa por tudo. `role` é a base para corrigir isso,
> mas a autorização por role **ainda não foi implementada**.

---

## 3. Código, arquivo a arquivo

### 3.1 Instância do servidor — `lib/auth.ts`

```ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/lib/prisma'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL,
  secret:  process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true, requireEmailVerification: false },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  user: { additionalFields: { role: { type: 'string', defaultValue: 'ADMIN', required: false, returned: true } } },
})
```

### 3.2 Cliente do browser — `lib/auth-client.ts` (novo)

```ts
'use client'
import { createAuthClient } from 'better-auth/react'
export const authClient = createAuthClient()
```

Sem `baseURL`: ele usa a origem atual, então funciona igual em localhost e produção.
O `basePath` padrão `/api/auth` bate com a rota `[...all]`.

### 3.3 Rota — `app/api/auth/[...all]/route.ts`

```ts
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const dynamic = 'force-dynamic'
export const { GET, POST } = toNextJsHandler(auth)
```

### 3.4 Verificação de sessão nas rotas de API (12 call sites)

```ts
// ANTES
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
const session = await getServerSession(authOptions)

// DEPOIS
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
const session = await auth.api.getSession({ headers: headers() })
```

Arquivos: `clients/route.ts` (2), `clients/[id]/route.ts` (3),
`appointments/route.ts` (2), `appointments/[id]/route.ts` (3),
`appointments/[id]/status/route.ts` (1), `dashboard/stats/route.ts` (1).

### 3.5 `middleware.ts` — o ponto mais sutil

```ts
import { getSessionCookie } from 'better-auth/cookies'
const sessionCookie = getSessionCookie(request)
```

**Por que não `auth.api.getSession()` no middleware?**

O middleware do Next.js roda no **Edge Runtime**, que não consegue carregar o Prisma
(engine nativo). `auth.api.getSession()` consultaria o banco e quebraria o build.
`getSessionCookie()` apenas **lê a presença do cookie** — barato e seguro no edge.

A validação real (assinatura + banco + expiração) acontece **dentro de cada rota**,
em `auth.api.getSession({ headers })`, que roda no runtime Node. Ou seja: o
middleware faz o *roteamento* (redireciona para `/login`), e as rotas fazem a
*autorização*. Nunca confie só no middleware.

### 3.6 `app/providers.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()   // fora do componente, senão o cache zera

export function Providers({ children }) {
  return <QueryClientProvider client={queryClient}>{children}<Toaster ... /></QueryClientProvider>
}
```

O client React do Better Auth é construído sobre TanStack Query — sem o
`QueryClientProvider`, `useSession()` e as mutations falham.

### 3.7 `app/login/page.tsx`

```ts
const { error } = await authClient.signIn.email({ email, password })
if (error) toast.error('Email ou senha inválidos')
```

### 3.8 `components/layout/sidebar.tsx`

```ts
await authClient.signOut({
  fetchOptions: { onSuccess: () => { router.push('/login'); router.refresh() } },
})
```

---

## 4. Seed

O erro clássico aqui: criar só o `User` **não habilita o login**, porque a senha
agora mora no `Account`.

```ts
import { hashPassword } from 'better-auth/crypto'

const hashedPassword = await hashPassword(adminPassword)

const admin = await prisma.user.upsert({
  where: { email: adminEmail },
  update: { name: 'Administrador', role: UserRole.ADMIN, emailVerified: true },
  create: { email: adminEmail, name: 'Administrador', role: UserRole.ADMIN, emailVerified: true },
})

// ⚠️ accountId precisa ser o ID DO USUÁRIO, não o e-mail.
await prisma.account.upsert({
  where: { providerId_accountId: { providerId: 'credential', accountId: admin.id } },
  update: { userId: admin.id, password: hashedPassword },
  create: { userId: admin.id, providerId: 'credential', accountId: admin.id, password: hashedPassword },
})
```

**`accountId: admin.id`, não `adminEmail`.** O Better Auth decide se achou a
credencial com (em `api/routes/sign-in.mjs`):

```js
const credentialAccount = userRecord?.accounts.find(
  (a) => a.providerId === "credential" && a.accountId === userRecord.user.id
)
if (!userRecord || !credentialAccount) {
  logger.warn("User not found")     // ← log enganoso
  throw APIError("UNAUTHORIZED", INVALID_EMAIL_OR_PASSWORD)
}
```

Gravar o e-mail faz o login falhar com *"Invalid email or password"* **mesmo com
a senha correta**, e o log mente dizendo `User not found` — o usuário existe, só o
`accountId` não bate. Se você cair nisso, confira `SELECT accountId FROM accounts`
antes de suspeitar do hash.

`hashPassword` é o mesmo usado internamente pelo Better Auth — se você usar
`bcrypt.hash` aqui, o login vai falhar silenciosamente (o `verifyPassword` do
Better Auth não entende bcrypt). Verifiquei isso explicitamente:
`verifyPassword({ hash, password: 'admin123' }) === true`.

---

## 5. Variáveis de ambiente

```env
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="<openssl rand -base64 32>"
```

O código aceita `NEXTAUTH_URL`/`NEXTAUTH_SECRET` como *fallback* para não quebrar
deploys existentes, mas os nomes canônicos do Better Auth são os `BETTER_AUTH_*`.

> ⚠️ `BETTER_AUTH_SECRET` precisa estar disponível para o **servidor**. No Next.js,
> env vars só entram no bundle do cliente se forem `NEXT_PUBLIC_*` — e este segredo
> **nunca** deve ser `NEXT_PUBLIC_`.

---

## 6. Migração de dados

O schema mudou de forma **incompatível** (`emailVerified` DateTime → Boolean,
coluna `password` removida, tabelas reescritas). Como os dados são seed de
demonstração, a abordagem foi reescrever as migrações do zero:

```bash
rm -rf prisma/migrations
bunx prisma migrate reset --force      # zera o banco
PATH="$PWD/node_modules/.bin:$PATH" \
  bunx prisma migrate dev --name init  # migração limpa e única
bun run db:seed
```

> Mantive um **único** `migration.sql` porque o anterior tinha minutos, nunca foi
> commitado, e o diff contra ele geraria prompts interativos de perda de dados.

**Se você tiver dados reais**, não faça isso. Em vez disso:
1. Rode `bunx better-auth generate` e revise;
2. `bunx prisma migrate dev` e **aceite** os prompts destrutivos revisando o SQL;
3. Migre os usuários com um script: copiar `users.password` (bcrypt) para
   `accounts.password` **não funciona** — você precisa re-hashear cada senha com
   `hashPassword` e gravar em `accounts` com `providerId: 'credential'`.

---

## 7. Checklist de verificação

```bash
./node_modules/.bin/tsc --noEmit          # precisa sair 0 erros
bunx prisma validate
bun run db:seed
bun run dev
```

```bash
# 1. login
curl -s -X POST http://localhost:3000/api/auth/sign-in/email \
  -H 'Content-Type: application/json' -H 'Origin: http://localhost:3000' \
  -d '{"email":"admin@barbearia.com","password":"admin123"}' -c /tmp/jar

# 2. sessão
curl -s -b /tmp/jar http://localhost:3000/api/auth/get-session

# 3. rota protegida (precisa ser 200 e list do banco)
curl -s -b /tmp/jar -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/clients
```

---

## 8. Problemas reais encontrados nesta migração

| # | Problema | Causa | Solução |
|---|---|---|---|
| 1 | `Type '"prisma"' is not assignable to '"sqlite" \| ... \| "postgresql" \| ...'` | `prismaAdapter` pede o **provider do Prisma**, não o nome do adaptador | `{ provider: 'postgresql' }` |
| 2 | `'user' does not exist in type 'BetterAuthAdvancedOptions'` | em 1.7.x `user` é chave de **top level** do `betterAuth()`, não de `advanced` | mover `user.additionalFields` para fora de `advanced` |
| 3 | `better-auth generate` apaga o schema? | Não apaga — **mescla**, deixando um híbrido com colunas dos dois frameworks | usar a saída como rascunho e escrever o schema limpo |
| 4 | `spawn tsx ENOENT` no `migrate`/`seed` | invocar `./node_modules/.bin/prisma` direto deixa `node_modules/.bin` fora do `PATH` | prefixar com `PATH="$PWD/node_modules/.bin:$PATH"` ou usar `bun run db:*` |
| 5 | Erros TS apontando para `app/api/auth/[...nextauth]` inexistente | `.next/types` obsoleto após deletar a rota | `rm -rf .next` e rebuildar |
| 6 | Login OK mas rota 401 | middleware compilado antes do reload do env | reiniciar o dev server após mexer em `.env*` |
| 7 | `INVALID_EMAIL_OR_PASSWORD` com senha correta | `accounts.accountId` gravado com o e-mail em vez do `user.id` | ver seção 4 |
| 8 | `POST /sign-out` → 415 / 400 em testes com curl | o endpoint exige corpo JSON válido | o cliente envia `body:"{}"`; no curl use `-H 'Content-Type: application/json' -d '{}'` |

**Sobre o item 8:** o `getBody` do `better-call` só pula a checagem de
`Content-Type` quando `request.body` é nulo — e em POST o Next expõe um stream,
mesmo vazio. Por isso:

```bash
# errado  -> 415 UNSUPPORTED_MEDIA_TYPE (sem content-type)
# errado  -> 400 Invalid JSON          (content-type json, corpo vazio)
# certo   -> 200 {"success":true}
curl -X POST http://localhost:3000/api/auth/sign-out \
  -H 'Content-Type: application/json' -H 'Origin: http://localhost:3000' \
  -d '{}'
```

Confirmei o formato real interceptando a fetch do `authClient.signOut()`:
`method: POST`, `content-type: application/json`, `body: "{}"`.

---

## 9. O que ficou pendente (não era escopo desta fase)

1. **Autorização por role** — as 12 rotas só checam autenticação. Nenhuma verifica
   `session.user.role`. `ADMIN`/`BARBER` é hoje apenas cosmético.
2. **`handleApiError` não mapeia erros do Prisma** — `P2002`/`P2025`/`P2003` caem em
   500 com mensagem crua (mesma dívida apontada em `MIGRACAO_POSTGRES.md`).
3. **`Client.phone` sem `@@unique`** — a checagem de duplicidade em `findFirst` é
   race condition; com a constraint o banco resolveria (e cairia no `P2002`).
4. **Secret exposto no histórico do git** — o commit `2df82b8` versionou o `.env`
   antigo, com credencial do Atlas e um `NEXTAUTH_SECRET` fraco e genérico em
   texto plano. Esse valor já não é usado, mas continua no histórico: não
   reutilize nada de lá e gere um novo com `openssl rand -base64 32`. Se o repo
   for público, vale um `git filter-repo` para limpar.
5. **`@better-auth/cli` ficou em devDependencies** — é útil para regenerar o schema
   quando adicionar plugins (admin, two-factor, organization...).

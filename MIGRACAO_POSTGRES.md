# Migração do MongoDB para PostgreSQL

> **Estado atual:** migração **concluída e verificada** neste projeto.
> Banco: **Supabase (PostgreSQL)** · ORM: **Prisma 5.22** · Runtime: **Next 14.2 / Bun 1.4**
>
> Este documento serve de duas formas:
> 1. **Registro** do que foi feito aqui (comandos reais, problemas reais encontrados).
> 2. **Guia reutilizável** para traduzir qualquer projeto Prisma de MongoDB para PostgreSQL.

---

## Sumário executivo

| | MongoDB | PostgreSQL |
|---|---|---|
| Migração de schema | Não existe (`prisma db push`) | Existe e é versionada (`prisma migrate`) |
| Chave primária | `ObjectId` (24 hex) | `TEXT` + `cuid()` |
| Integridade referencial | Não aplicada | **Aplicada** (`FOREIGN KEY`) |
| Índices em FK | Opcional | Recomendado |
| Tipos nativos | BSON | `TIMESTAMP(3)`, `ENUM`, `TEXT` |
| Busca case-insensitive | `$regex` | `ILIKE` (`mode: "insensitive"`) |

**Esforço real neste projeto:** 0 arquivos de código de negócio alterados. A migração tocou
`prisma/schema.prisma`, `prisma/seed.ts`, `package.json`, `.gitignore` e o `.env`.

---

## 1. Inventário: o que é específico de MongoDB neste projeto

Antes de mexer, identifique tudo que depende do provider. Neste projeto:

| Arquivo | O que era Mongo-specific | Tratamento |
|---|---|---|
| `prisma/schema.prisma` | `provider = "mongodb"` | trocado |
| `prisma/schema.prisma` | `@default(auto()) @map("_id") @db.ObjectId` (6×) | trocado por `cuid()` |
| `prisma/schema.prisma` | `@db.ObjectId` em `userId` (2×) e `clientId` (1×) | removido |
| `prisma/seed.ts` | IDs hardcoded `507f1f77bcf86cd799439011` (ObjectIds) | substituídos |
| `package.json` | dependência `mongodb` | **removida** (estava órfã — nenhum `import 'mongodb'`) |
| `.gitignore` | `/prisma/migrations` ignorado | **removido da ignore-list** |
| `.env` | `mongodb+srv://...` | trocado por URL PostgreSQL |

**Verificações que fizeram a migração ser segura:**

```bash
# 1. Alguma query crua? (não pode existir)
grep -rn '\$queryRaw\|\$executeRaw\|ObjectId\|from .mongodb' --include='*.ts' --include='*.tsx' .

# 2. Quem toca o banco?
grep -rln 'lib/prisma' app lib
# → 7 rotas de API + lib/auth.ts
```

Resultado: **todo o acesso ao banco passa por `lib/prisma.ts`**. Nenhum driver direto,
nenhuma query crua, nenhum operador exclusivo de Mongo. É isso que torna a migração
quase inteiramente uma mudança de schema.

---

## 2. Tradução do schema

### 2.1 O cabeçalho — a parte mais importante

```prisma
// ANTES (MongoDB)
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

// DEPOIS (PostgreSQL)
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // ← ver seção 4: OBRIGATÓRIO no Supabase
}
```

### 2.2 Tabela de tradução campo a campo

| MongoDB (antes) | PostgreSQL (depois) | Motivo |
|---|---|---|
| `id String @id @default(auto()) @map("_id") @db.ObjectId` | `id String @id @default(cuid())` | `auto()` só gera `ObjectId`. `@map("_id")` e `@db.ObjectId` só existem no provider Mongo. **O tipo continua `string`**, então nenhum `.ts`/`.tsx` muda. |
| `userId String @db.ObjectId` | `userId String` | idem |
| `clientId String @db.ObjectId` | `clientId String` | idem |
| `provider = "mongodb"` | `provider = "postgresql"` | — |
| `enum UserRole { ... }` | **sem mudança** | PostgreSQL tem enum nativo; o Prisma cria o tipo `UserRole` |
| `@default(now())`, `@updatedAt` | **sem mudança** | viram `DEFAULT CURRENT_TIMESTAMP` e trigger/valor do cliente |
| `@unique`, `@@unique`, `@@map` | **sem mudança** | viram `CREATE UNIQUE INDEX` / `CREATE TABLE "nome"` |
| `onDelete: Cascade` | **sem mudança** | vira `ON DELETE CASCADE` — e passa a ser **exigido** |
| `mode: "insensitive"` nas queries | **sem mudança** | vira `ILIKE` (atenção: é o **MySQL** que não suporta, não o Postgres) |

### 2.3 Índices de chave estrangeira

O MongoDB não indexa colunas de referência por padrão. No PostgreSQL vale a pena declarar:

```prisma
model Account   { ...  @@index([userId])  @@map("accounts")   }
model Session   { ...  @@index([userId])  @@map("sessions")   }
model Appointment { ... @@index([clientId]) @@map("appointments") }
```

### 2.4 Schema resultante

O arquivo completo está em [`prisma/schema.prisma`](./prisma/schema.prisma).

---

## 3. Configuração do Supabase (sem pacotes da Supabase)

**Restrição do projeto: nada de `@supabase/ssr`, `@supabase/supabase-js` ou similares.**

Isso é perfeitamente viável — na verdade é o cenário ideal para o Prisma. O cliente Prisma
fala TCP direto com o Postgres. **Nenhuma dependência nova é necessária**, além do driver
que já vem embutido no próprio Prisma.

```bash
bun add @prisma/client        # já existe
bun add -d prisma             # já existe
# nada da Supabase é preciso.
```

### Três armadilhas clássicas do Supabase + Prisma

1. **O nome do banco é sempre `postgres`**, nunca `barbearia`. A URL é
   `...pooler.supabase.com:6543/postgres`, não `.../barbearia`.

2. **Região.** `vercel.json` fixa `"regions": ["iad1"]` (Virgínia). Crie o projeto Supabase
   em **`us-east-1`/`us-east-2`** (EUA), senão cada query paga ida e volta transcontinental.

3. **SSL.** Adicione `?sslmode=require` se a sua connection string não trouxer.

---

## 4. As duas URLs do Supabase — e o problema que elas resolvem

O painel do Supabase entrega duas connection strings, e elas têm funções **diferentes**:

| Variável | Host porta | Modo | Uso |
|---|---|---|---|
| `DATABASE_URL` | `aws-0-<região>.pooler.supabase.com:6543` | **Transaction** (PgBouncer) | **Aplicação em runtime** |
| `DIRECT_URL` | `aws-0-<região>.pooler.supabase.com:5432` | **Session** | **Migrações** (`prisma migrate`, `db push`, `db execute`) |

### O problema real (reproduzido neste projeto)

```ini
DATABASE_URL="postgresql://...@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
```

Sem declarar `directUrl`, o Prisma usa **sempre** a `DATABASE_URL` — inclusive para migrações.
O resultado:

```
$ prisma migrate dev
# trava. Sem mensagem. Sem stack trace. Para sempre.
```

Diagnóstico feito camada por camada:

| Teste | Porta 6543 (Transaction) | Porta 5432 (Session) |
|---|---|---|
| DNS + TCP | ✅ | ✅ |
| `SSLRequest` + handshake TLS 1.3 | ✅ | ✅ |
| **Schema engine** (`db execute` / `migrate`) | ❌ **trava (timeout)** | ✅ `Script executed successfully` |
| **Query engine** (runtime da app) | ✅ autentica | ✅ autentica |

**Conclusão:** o PgBouncer em modo *Transaction* atende o query engine normalmente, mas **trava
o schema engine**. Por isso:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // migrações vão por aqui
}
```

Com isso declarado, a saída vira:

```
Datasource "db": PostgreSQL database "postgres", schema "public"
  at "aws-0-us-east-2.pooler.supabase.com:5432"      ← DIRECT_URL, porta 5432
Applying migration `20260928104405_init`
```

> **Regra geral:** se `prisma migrate` travar sem erro algum com Supabase/Neon/RDS + PgBouncer,
> quase sempre é falta de `directUrl`.

### Sobre a senha conter caracteres especiais

Se a senha tiver `@`, `#`, `/` etc., **não precisa codificar** neste caso: o parser de URL
(RFC 3986 / WHATWG) usa o **último** `@` antes do host, então `postgres:senha@abc@host`
parseia corretamente. Ainda assim, codificar com `encodeURIComponent` é a prática mais segura
e nunca quebra.

---

## 5. Migrações: o workflow que não existia antes

### 5.1 Por que o `.gitignore` precisava mudar

`prisma/schema.prisma` estava acompanhado de, na `.gitignore`:

```
/prisma/migrations     ← REMOVIDO
```

Isso foi feito porque **no MongoDB não existe migração**: o fluxo é só `db push`.
No PostgreSQL, `prisma/migrations/` contém o SQL que **reproduz o banco do zero** —
é o que CI, deploy e qualquer outra máquina usam. Versionar isso é obrigatório.

> ⚠️ **Nunca ignore `/prisma/migrations` num projeto PostgreSQL.**

### 5.2 Scripts (`package.json`)

```jsonc
"scripts": {
  "db:generate": "prisma generate",
  "db:migrate":  "prisma migrate dev",     // cria e aplica (dev)
  "db:deploy":   "prisma migrate deploy",  // só aplica (CI/produção)
  "db:push":     "prisma db push",         // descarta migração, só prototipar
  "db:seed":     "prisma db seed",
  "db:studio":   "prisma studio"
},
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

**Por que `prisma db seed` e não `tsx prisma/seed.ts` direto?**
Porque o `tsx` **não carrega o `.env`**. Rodar `tsx prisma/seed.ts` manualmente resulta em
`Environment variable not found: DATABASE_URL`. O comando `prisma db seed` carrega o `.env`
automaticamente e, além disso, precisa que `node_modules/.bin` esteja no `PATH` — ou seja,
rode sempre via `bun run db:seed`, nunca invocando o binário direto.

### 5.3 Comandos

```bash
# primeira vez
cp .env.example .env            # preencha as duas URLs
bun run db:generate
bun run db:migrate              # gera prisma/migrations/<timestamp>_init/migration.sql
bun run db:seed
bun run dev

# a cada mudança no schema
bun run db:migrate              # → "Enter a name for the new migration:"

# produção / Vercel
bun run db:deploy               # aplica migrações pendentes, não cria
```

`vercel.json` usa `"buildCommand": "npm run build"` e `package.json` define
`"build": "prisma generate && next build"`. Para aplicar migração no deploy, acrescente
`prisma migrate deploy` antes do build:

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

---

## 6. Seed

`prisma/seed.ts` usava ObjectIds fixos do Mongo:

```ts
// ANTES — id de 24 hex, inválido como default no SQL
prisma.client.upsert({ where: { id: '507f1f77bcf86cd799439011' }, ... })

// DEPOIS — id legível e estável; funciona com @default(cuid())
prisma.client.upsert({ where: { id: 'seed-client-01' }, ... })
```

São **6 clientes** (`seed-client-01`…`06`) e **8 agendamentos** (`seed-appt-01`…`08`).
Como o seed faz `upsert` pelo `id`, ele continua **idempotente**: rodar de novo não duplica.

A criação do admin não mudou (o `upsert` já era por `email`, que é `@unique`):

```ts
await prisma.user.upsert({ where: { email: 'admin@barbearia.com' }, ... })
```

Resultado verificado:

```
🌱 Iniciando seed do banco de dados...
✅ Usuário administrador criado: admin@barbearia.com
✅ Clientes criados: 6
✅ Agendamentos criados: 8
🎉 Seed concluído com sucesso!
```

---

## 7. O que NO código não precisou mudar

Todas as queries do projeto são compatíveis com PostgreSQL **sem nenhum ajuste**:

| Padrão usado | Onde | No PostgreSQL |
|---|---|---|
| `mode: 'insensitive'` + `contains` | `clients/route.ts`, `appointments/route.ts` | `ILIKE '%term%'` ✅ |
| `skip` / `take` paginação | rotas de listagem | `OFFSET / LIMIT` ✅ |
| `include` + `_count` | `clients/route.ts` | `JOIN` + subquery ✅ |
| `upsert` | `seed.ts`, `auth.ts` | `INSERT ... ON CONFLICT` ✅ |
| `findFirst` / `findUnique` | todas as rotas | ✅ |
| `Promise.all([findMany, count])` | rotas de listagem | ✅ (mesma conexão, ok) |
| enums como valor em `where` | `status: 'PENDING'` | ✅ tipo enum nativo |
| `id: string` no TypeScript | front e API | ✅ `TEXT` também é `string` |

**Arquivos `.ts`/`.tsx` de negócio alterados: zero.**

---

## 8. Checklist de verificação

```bash
# 1. schema válido
bunx prisma validate
# → The schema at prisma/schema.prisma is valid 🚀

# 2. migração aplicada (deve citar a porta 5432 / DIRECT_URL)
bun run db:migrate

# 3. dados
bun run db:seed

# 4. app
bun run dev
curl -s http://localhost:3000/login            # 200
curl -s http://localhost:3000/api/clients      # 401 (sem sessão = porta de auth OK)
```

Verificação direta do banco (sem a aplicação):

```bash
export DATABASE_URL=$(grep '^DATABASE_URL=' .env | sed -E 's/^DATABASE_URL="//; s/"$//')
node -e "
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
Promise.all([p.user.count(),p.client.count(),p.appointment.count()])
  .then(r=>{console.log('users='+r[0],'clients='+r[1],'appointments='+r[2]);return p.\$disconnect()});
"
# → users=1 clients=6 appointments=8
```

Rodar esse trecho **sem** exportar `DATABASE_URL` é um bom teste regressivo: deve falhar com
`Environment variable not found: DATABASE_URL` e **não** com
`PrismaClientConstructorValidationError`.

---

## 9. Problemas reais encontrados nesta migração

| # | Problema | Causa | Solução |
|---|---|---|---|
| 1 | `PrismaClientConstructorValidationError: Invalid value undefined for datasource "db"` | `lib/prisma.ts` passava `datasources.db.url = process.env.DATABASE_URL` explicitamente; sem `.env`, isso vira `undefined` e o construtor valida a forma **antes** de ler o schema | Remover o bloco `datasources` de `lib/prisma.ts`. Sem ele, o Prisma usa o `url = env(...)` do schema e dá o erro amigável `Environment variable not found: DATABASE_URL` |
| 2 | `prisma migrate dev` trava sem mensagem | `directUrl` não declarado → migração ia para a porta 6543 (Transaction), onde o schema engine trava | declarar `directUrl = env("DIRECT_URL")` |
| 3 | `spawn tsx ENOENT` no seed | `prisma db seed` invocou o `tsx` sem `node_modules/.bin` no `PATH` | rodar via `bun run db:seed`, nunca o binário direto |
| 4 | `.env` faltando `NEXTAUTH_SECRET` etc. | `.gitignore` ignora `.env`; sem `.env.example` ninguém sabia quais chaves existiam | criar `.env.example` versionado como contrato |
| 5 | Dependência `mongodb` presente mas nunca importada | sobra de setup anterior | removida de `package.json`, `bun.lock` e `package-lock.json` |

---

## 10. Melhorias recomendadas (fora do escopo da migração)

Nenhuma é bloqueante — todas são dívidas pré-existentes que a migração deixou visíveis:

1. **`handleApiError` não trata erros do Prisma.** `lib/errors.ts` cai em
   `error instanceof Error` → devolve **500 com a mensagem crua do Prisma** (vazamento de
   detalhes internos). Falta um ramo para `PrismaClientKnownRequestError`:
   - `P2002` (unique violation) → **409**
   - `P2025` (registro não encontrado) → **404**
   - `P2003` (FK violation) → **400**

2. **`Client.phone` não tem `@@unique`.** A rota `POST /api/clients` checa duplicidade com
   `findFirst` e devolve 409 — isso é **race condition**: duas requisições simultâneas
   passam pelo check e duplicam. Com a constraint no banco, o problema some
   (e é exatamente o `P2002` do item 1).

3. **`mode: 'insensitive'` vira `ILIKE '%term%'`** — não usa índice. Ok na escala atual;
   se crescer, considerar `pg_trgm` + índice GIN.

4. **`TIMESTAMP(3)` sem fuso.** O Prisma mapeia `DateTime` para `timestamp(3)` (*without*
   time zone). Se for trabalhar com horários de Barbacena/múltiplos fusos, avalie
   `@db.Timestamptz(3)`.

5. **`@next-auth/prisma-adapter` está nas dependências mas não é usado** — `authOptions` está
   sem `adapter` (só Credentials + JWT). Os models `Account`, `Session` e `VerificationToken`
   estão, por ora, órfãos. Essa é a parte da migração que a **fase de Better Auth** vai
   substituir.

---

## 11. Rollback

```bash
# reverter a última migração (apaga as tabelas criadas por ela)
bunx prisma migrate reset          # ⚠️ APAGA TODOS OS DADOS

# ou voltar para um estado anterior do código e recriar
git log --oneline -- prisma/migrations
```

Como os dados deste projeto são **seed de demonstração**, `migrate reset` + `db:seed`
é um rollback completo e seguro.

---

## 12. Referência rápida dos comandos

| Ação | Comando |
|---|---|
| Validar schema | `bunx prisma validate` |
| Gerar client | `bun run db:generate` |
| Criar/aplicar migração | `bun run db:migrate` |
| Aplicar em produção | `bun run db:deploy` |
| Popular dados | `bun run db:seed` |
| Explorar o banco | `bun run db:studio` |
| Resetar tudo (dev) | `bunx prisma migrate reset` |

# Setup do Sistema de Gerenciamento de Barbearia

## Pré-requisitos

- Node.js 18+
- PostgreSQL (Supabase, Neon ou local via Docker)
- npm, yarn ou bun

## Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

- `DATABASE_URL`: URL de conexão com PostgreSQL (pooler, porta 6543)
- `DIRECT_URL`: URL de conexão direta (porta 5432) usada pelas migrações
- `NEXTAUTH_SECRET`: Chave secreta para autenticação
- `ADMIN_EMAIL` e `ADMIN_PASSWORD`: Credenciais do administrador inicial

### 3. Configurar Prisma

Gere o cliente Prisma:

```bash
npm run db:generate
```

Sincronize o schema com o banco criando uma migração:

```bash
npm run db:migrate
```

### 4. Seed do Banco (Opcional)

Para popular o banco com dados iniciais:

```bash
npm run db:seed
```

Isso criará:
- Usuário administrador
- Clientes de exemplo
- Agendamentos de exemplo

### 5. Executar o Projeto

Modo desenvolvimento:

```bash
npm run dev
```

Modo produção:

```bash
npm run build
npm start
```

## Funcionalidades

### ✅ Implementadas

- **Autenticação**: Login/logout com NextAuth.js
- **Gestão de Clientes**: CRUD completo
- **Gestão de Agendamentos**: CRUD completo com filtros
- **Dashboard**: Estatísticas em tempo real
- **Validação**: Validação robusta com Zod
- **Responsivo**: Interface adaptável para mobile
- **API REST**: APIs otimizadas com paginação

### 🔧 Backend

- **Prisma ORM**: Para interação com PostgreSQL
- **Validação**: Zod para validação de dados
- **Tratamento de Erros**: Sistema unificado de erros
- **Paginação**: Sistema de paginação eficiente
- **Filtros**: Busca e filtros avançados

### 🎨 Frontend

- **Next.js 14**: Framework React moderno
- **Tailwind CSS**: Estilização utility-first
- **React Hot Toast**: Notificações elegantes
- **Lucide Icons**: Ícones modernos
- **Responsivo**: Design mobile-first

## Estrutura do Projeto

```
├── app/                    # App Router do Next.js
│   ├── api/               # Rotas da API
│   ├── dashboard/         # Páginas do dashboard
│   └── login/             # Página de login
├── components/            # Componentes React
│   ├── layout/           # Layouts da aplicação
│   └── ui/               # Componentes de UI
├── lib/                  # Utilitários e configurações
│   ├── api.ts           # Cliente da API
│   ├── auth.ts          # Configuração do NextAuth
│   ├── prisma.ts        # Cliente do Prisma
│   └── validations.ts   # Schemas de validação
├── prisma/              # Configuração do Prisma
│   ├── schema.prisma    # Schema do banco
│   └── seed.ts          # Dados iniciais
└── types/               # Tipos TypeScript
```

## Scripts Disponíveis

- `npm run dev` - Executar em modo desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Executar build de produção
- `npm run lint` - Verificar código com ESLint
- `npm run db:generate` - Gerar cliente Prisma
- `npm run db:migrate` - Criar e aplicar migrações (desenvolvimento)
- `npm run db:deploy` - Aplica migrações pendentes (produção/CI)
- `npm run db:push` - Sincronizar schema sem gerar migração
- `npm run db:seed` - Popular banco com dados iniciais
- `npm run db:studio` - Abrir Prisma Studio

## Credenciais Padrão

Após executar o seed:

- **Email**: admin@barbearia.com
- **Senha**: admin123

## Principais Melhorias Implementadas

### Backend
- ✅ Remoção completa de dados mockados
- ✅ Validações robustas com Zod
- ✅ Sistema de paginação eficiente
- ✅ Filtros avançados para busca
- ✅ Tratamento unificado de erros
- ✅ Verificações de horário comercial
- ✅ Validação de conflitos de agendamento
- ✅ APIs otimizadas com queries paralelas

### Frontend
- ✅ Cliente API centralizado
- ✅ Tratamento consistente de erros
- ✅ Interface responsiva otimizada
- ✅ Feedback visual aprimorado
- ✅ Integração completa com backend real

### Segurança
- ✅ Autenticação obrigatória em todas as rotas
- ✅ Validação de entrada robusta
- ✅ Prevenção de conflitos de dados
- ✅ Sanitização de dados

## Próximos Passos

Para expandir o sistema, considere implementar:

1. **Notificações**: Sistema de lembretes por email/SMS
2. **Relatórios**: Relatórios avançados de vendas
3. **Agenda Visual**: Calendário interativo
4. **Pagamentos**: Integração com gateway de pagamento
5. **Multi-tenant**: Suporte a múltiplas barbearias
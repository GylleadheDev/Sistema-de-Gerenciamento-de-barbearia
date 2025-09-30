# 🚀 Backend Moderno - Sistema de Gerenciamento de Barbearia

## 📋 Visão Geral

Este backend foi construído com as mais modernas tecnologias e práticas de segurança, oferecendo uma API REST completa e eficiente para o sistema de gerenciamento de barbearia.

## 🛠️ Tecnologias Utilizadas

### Core
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática para maior segurança
- **MongoDB** - Banco de dados NoSQL escalável
- **Prisma** - ORM moderno com type-safety

### Autenticação & Segurança
- **NextAuth.js** - Autenticação completa com JWT
- **bcryptjs** - Criptografia de senhas
- **Zod** - Validação de dados em tempo de execução
- **Rate Limiting** - Proteção contra ataques de força bruta

### Funcionalidades
- **CRUD Completo** - Clientes e Agendamentos
- **Dashboard Analytics** - Estatísticas em tempo real
- **Validação Robusta** - Dados sempre consistentes
- **Tratamento de Erros** - Respostas padronizadas
- **Middleware de Segurança** - Headers e validações

## 🔧 Instalação e Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/barbearia?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# Admin credentials (change these in production)
ADMIN_EMAIL="admin@barbearia.com"
ADMIN_PASSWORD="admin123"

# MongoDB
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/barbearia?retryWrites=true&w=majority"

# App Configuration
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Configurar Banco de Dados

```bash
# Gerar cliente Prisma
npm run db:generate

# Aplicar schema no banco
npm run db:push

# Popular banco com dados iniciais
npm run db:seed
```

### 4. Executar o Projeto

```bash
npm run dev
```

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Sessão atual

### Clientes
- `GET /api/clients` - Listar clientes (com paginação e busca)
- `POST /api/clients` - Criar cliente
- `GET /api/clients/[id]` - Buscar cliente por ID
- `PUT /api/clients/[id]` - Atualizar cliente
- `DELETE /api/clients/[id]` - Excluir cliente

### Agendamentos
- `GET /api/appointments` - Listar agendamentos (com filtros)
- `POST /api/appointments` - Criar agendamento
- `GET /api/appointments/[id]` - Buscar agendamento por ID
- `PUT /api/appointments/[id]` - Atualizar agendamento
- `DELETE /api/appointments/[id]` - Excluir agendamento
- `PATCH /api/appointments/[id]/status` - Atualizar status

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas do dashboard

## 🔒 Segurança Implementada

### Autenticação
- JWT tokens seguros
- Senhas criptografadas com bcrypt
- Sessões gerenciadas pelo NextAuth

### Rate Limiting
- 100 requests por 15 minutos para APIs
- 5 tentativas de login por 15 minutos
- Proteção contra ataques de força bruta

### Validação
- Validação de dados com Zod
- Sanitização de inputs
- Validação de origem das requisições

### Headers de Segurança
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Content-Security-Policy

## 📊 Estrutura do Banco de Dados

### Collections MongoDB

#### Users
```typescript
{
  id: ObjectId
  name: string
  email: string (unique)
  password: string (hashed)
  role: 'ADMIN' | 'BARBER'
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Clients
```typescript
{
  id: ObjectId
  name: string
  phone: string
  email?: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Appointments
```typescript
{
  id: ObjectId
  clientId: ObjectId (ref: Client)
  service: string
  dateTime: DateTime
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  notes?: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

## 🎯 Funcionalidades Avançadas

### Dashboard Analytics
- Estatísticas em tempo real
- Gráficos de performance
- Relatórios mensais
- Serviços mais populares

### Busca Inteligente
- Busca por nome, telefone ou email
- Paginação eficiente
- Filtros por status e data

### Validações Robustas
- Verificação de conflitos de horário
- Validação de datas passadas
- Verificação de dependências

## 🚀 Deploy em Produção

### 1. Configurar Variáveis de Ambiente
- Use um MongoDB Atlas cluster
- Configure um secret forte para NextAuth
- Defina URLs de produção

### 2. Build e Deploy
```bash
npm run build
npm run start
```

### 3. Configurar Banco de Dados
```bash
npm run db:push
npm run db:seed
```

## 📝 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Executar produção
npm run lint         # Linter
npm run db:generate  # Gerar cliente Prisma
npm run db:push      # Aplicar schema
npm run db:seed      # Popular banco
npm run db:studio    # Interface visual do banco
```

## 🔍 Monitoramento e Logs

- Logs estruturados para todas as operações
- Tratamento de erros centralizado
- Métricas de performance
- Rate limiting logs

## 🛡️ Boas Práticas Implementadas

- **Type Safety** - TypeScript em todo o código
- **Error Handling** - Tratamento consistente de erros
- **Validation** - Validação em tempo de execução
- **Security** - Múltiplas camadas de segurança
- **Performance** - Queries otimizadas e paginação
- **Scalability** - Arquitetura preparada para escala

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Confirme as variáveis de ambiente
3. Teste a conexão com o MongoDB
4. Verifique os rate limits

---

**Backend construído com as melhores práticas de desenvolvimento moderno! 🎉**

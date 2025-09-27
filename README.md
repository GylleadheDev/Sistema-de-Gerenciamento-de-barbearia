# Sistema de Gerenciamento de Barbearia

Sistema web completo para gerenciamento de agendamentos de barbearia com painel administrativo.

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 14 com TypeScript
- **Estilização**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: MongoDB Atlas
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
- Node.js 18+ 
- MongoDB Atlas (ou MongoDB local)
- npm ou yarn

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
Crie um arquivo `.env.local` na raiz do projeto:
```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/barbearia?retryWrites=true&w=majority"

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

# Aplicar as migrações
npm run db:push

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
npm run db:push      # Aplica mudanças no banco
npm run db:generate  # Gera cliente Prisma
npm run db:seed      # Popula banco com dados iniciais
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

1. Configure as variáveis de ambiente
2. Execute `npm run build`
3. Configure o banco de dados MongoDB Atlas
4. Deploy em plataformas como Vercel, Netlify ou similar

## 📞 Suporte

Para dúvidas ou problemas, entre em contato através dos issues do repositório.

## 📄 Licença

Este projeto está sob a licença MIT.

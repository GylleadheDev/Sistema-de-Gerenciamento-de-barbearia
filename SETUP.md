# Configuração do Sistema de Barbearia

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/barbearia?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Admin credentials (change these in production)
ADMIN_EMAIL="admin@barbearia.com"
ADMIN_PASSWORD="admin123"
```

## Configuração do MongoDB Atlas

1. Acesse [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crie uma conta gratuita
3. Crie um novo cluster
4. Configure o acesso ao banco de dados
5. Copie a string de conexão e substitua no `DATABASE_URL`

## Comandos de Instalação

```bash
# Instalar dependências
npm install

# Gerar cliente Prisma
npm run db:generate

# Aplicar schema no banco
npm run db:push

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

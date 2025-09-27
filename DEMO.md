# 🚀 Demonstração do Sistema de Barbearia

## Como Executar a Demonstração

O sistema está configurado com **dados de mock** para que você possa ver a interface funcionando sem precisar configurar o banco de dados.

### 1. Instalar Dependências
```bash
npm install
```

### 2. Executar o Projeto
```bash
npm run dev
```

### 3. Acessar a Aplicação
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### 4. Build para Produção (Opcional)
```bash
npm run build
npm run start
```

## 🔐 Credenciais de Demonstração

- **Email**: admin@barbearia.com
- **Senha**: admin123

## 📱 Funcionalidades Disponíveis

### Dashboard
- Visão geral com estatísticas dos agendamentos
- Cards informativos com dados simulados
- Navegação lateral funcional

### Gerenciamento de Clientes
- ✅ Lista de clientes com dados mock
- ✅ Busca e filtros funcionais
- ✅ Adicionar novos clientes (simulado)
- ✅ Editar clientes existentes (simulado)
- ✅ Excluir clientes (simulado)
- ✅ Validação de formulários
- ✅ Máscara de telefone

### Gerenciamento de Agendamentos
- ✅ Visualização por abas (Pendentes, Concluídos, Cancelados)
- ✅ Atualização de status (simulado)
- ✅ Informações detalhadas dos clientes
- ✅ Interface responsiva

## 🎨 Dados de Demonstração

O sistema inclui dados simulados de:
- **6 clientes** com informações completas
- **8 agendamentos** em diferentes status
- **Estatísticas** do dashboard atualizadas

## 🔄 Funcionalidades Simuladas

Todas as operações CRUD estão funcionando com simulação:
- ✅ Adicionar/editar/excluir clientes
- ✅ Atualizar status de agendamentos
- ✅ Notificações de sucesso/erro
- ✅ Validação de formulários

## 📝 Notas Importantes

- **Não é necessário configurar banco de dados** para esta demonstração
- **Dados são temporários** e serão perdidos ao recarregar a página
- **Autenticação está simplificada** para demonstração
- **Todas as funcionalidades** estão visíveis e funcionais

## 🚀 Próximos Passos

Para usar em produção:
1. Configure o MongoDB Atlas
2. Execute `npm run db:generate && npm run db:push && npm run db:seed`
3. Reative o middleware de autenticação
4. Configure as variáveis de ambiente

## 🎯 O que Você Pode Testar

1. **Login** com as credenciais fornecidas
2. **Navegar** entre as páginas do dashboard
3. **Adicionar** novos clientes
4. **Editar** clientes existentes
5. **Excluir** clientes
6. **Buscar** clientes
7. **Alterar status** dos agendamentos
8. **Visualizar** diferentes abas de agendamentos
9. **Testar** a responsividade em diferentes tamanhos de tela

Aproveite para explorar todas as funcionalidades da interface! 🎉

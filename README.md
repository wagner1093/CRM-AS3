# AutoCRM

Sistema de gestão de vendas e estoque para concessionárias e revendas de veículos.

## Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Estado/Dados**: TanStack Query (React Query)
- **Backend/DB**: Supabase

## Requisitos

- Node.js (v18+)
- npm ou bun

## Começando

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as credenciais do seu Supabase:
```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:8080`.

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Cria a build de produção na pasta `dist`.
- `npm run preview`: Visualiza a build de produção localmente.
- `npm run lint`: Executa a verificação do ESLint.

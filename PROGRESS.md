# Progresso do Projeto: Health Self Tracker (Front-end)

### Fase Inicial: Setup do Projeto e Documentação
- [x] Criar arquivo `COMMANDS.md` listando como executar e gerenciar o projeto com Deno.
- [x] Inicializar SvelteKit na raiz do repositório (SvelteKit + Svelte 5 + Tailwind v4).
- [x] Instalar dependências base: Tailwind CSS, `shadcn-svelte`, `sveltekit-superforms`, `zod`, `lucide-svelte`, `tailwind-variants`, `tw-animate-css`, `clsx`, `tailwind-merge`.
- [x] Configurar SvelteKit com `@sveltejs/adapter-node` para suporte ao Deno.

### Fase de Infraestrutura (Docker)
- [x] Criar o `Dockerfile` baseado em `denoland/deno:alpine` expondo a porta 3000.
- [x] Ajustar variáveis de ambiente requeridas para comunicação (`PUBLIC_API_URL`).

### Fase de Construção do Design System e Componentes Base
- [x] Implementar a estilização base Dark Mode (Zinc) com Tailwind v4 + shadcn-svelte.
- [x] Adicionar suporte a navegação por teclado (`svelte:window onkeydown`).
- [x] Criar o Autocomplete/Combobox Component ("Creatable Autocomplete") com suporte a setas, Enter, e criação de itens on-the-fly.

### Fase de Construção da Tela Principal (Fricção Zero)
- [x] Componentizar o "Header Cronológico" com datas e botões rápidos.
- [x] Criar os "Vitals (Métricas Base)" (Energia, Sono, Humor, Foco, Estresse) utilizando Grid Minimalista de rádio/botões numéricos.
- [x] Desenvolver e integrar o "Omnibar" Principal para inserção ágil de Tags, mostrando visualmente as categorias via cores.
- [x] Criar a lista de Gestão de Substâncias com o layout requisitado (linha contendo nome, dose, queda-de-efeito e crash).
- [x] Desenvolver bloco para Distrações e Notas em textareas limpas.

### Fase de Integração e UX Avançada
- [x] Integrar atalhos globais (Ctrl+Enter para salvar, `/` para focar Omnibar, Esc para limpar).
- [x] Wire-up dos dados no backend usando estado/store (`$state` / `$derived`), garantindo um "Dump" unificado por dia.
- [x] Criar API client para integração com o backend NestJS.
- [x] Implementar autenticação JWT (login page, auth store com localStorage, guard de auth no layout).
- [x] Conectar API client ao backend real (remover mock mode, alinhar types com FRONTEND_AGENT.md).
- [x] Implementar navegação entre datas com fetch de registro via `GET /records?date=YYYY-MM-DD`.
- [x] Implementar carregamento do registro de hoje via `GET /records/today` no `onMount`.
- [x] Implementar página e rotas de gerenciamento de entidades (Gerenciamento de Tags, Atividades e Substâncias usando métodos POST, PATCH e DELETE).
- [x] Verificar build TypeScript — 0 errors, 0 warnings.

